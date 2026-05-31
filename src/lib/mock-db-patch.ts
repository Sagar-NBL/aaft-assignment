import type { Course, Enrollment, Lesson, Student, VideoProgress } from '@/types';
import type { MockDbSnapshot } from '@/types/mock-db';
import { getStoredMockDb, setStoredMockDb } from '@/lib/mock-db-storage';
import { commitLocalSnapshotToServer, invalidateMockDbSyncCache } from '@/lib/mock-db-sync';

function normalizeApiPath(url: string): string {
  const withoutQuery = url.split('?')[0] ?? '';
  return withoutQuery.replace(/^\/api/, '').replace(/^\/?/, '/');
}

function parseUrl(url: string): { path: string; searchParams: URLSearchParams } {
  const [pathPart, query = ''] = url.split('?');
  return {
    path: normalizeApiPath(pathPart ?? url),
    searchParams: new URLSearchParams(query),
  };
}

function parseRequestBody(data: unknown): Record<string, unknown> | undefined {
  if (data == null) return undefined;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  if (typeof data === 'object') return data as Record<string, unknown>;
  return undefined;
}

function courseIdFromLessonsPath(path: string): string | null {
  const match = path.match(/\/admin\/courses\/([^/]+)\/lessons/);
  return match?.[1] ?? null;
}

function updateStored(mutator: (snapshot: MockDbSnapshot) => void): void {
  const stored = getStoredMockDb();
  if (!stored) {
    invalidateMockDbSyncCache();
    return;
  }
  mutator(stored);
  setStoredMockDb(stored);
  invalidateMockDbSyncCache();
}

/**
 * Write-through cache: apply API mutation responses to localStorage immediately.
 * Covers all mock-DB mutating routes (admin CRUD, lessons, enrollments, student progress).
 */
export function applyMutationToStorage(
  method: string | undefined,
  url: string | undefined,
  data: unknown,
  requestBody?: unknown
): void {
  if (!method || !url) return;

  const m = method.toLowerCase();
  const { path, searchParams } = parseUrl(url);
  const body = parseRequestBody(requestBody);

  // —— Students ——
  if (m === 'post' && path.endsWith('/admin/students')) {
    if (!data || typeof data !== 'object') return;
    const student = data as Student;
    updateStored((snapshot) => {
      const idx = snapshot.students.findIndex((s) => s.id === student.id);
      if (idx >= 0) snapshot.students[idx] = student;
      else snapshot.students.unshift(student);
    });
    return;
  }

  if (m === 'patch' && path.includes('/admin/students/')) {
    if (!data || typeof data !== 'object') return;
    const student = data as Student;
    updateStored((snapshot) => {
      const idx = snapshot.students.findIndex((s) => s.id === student.id);
      if (idx >= 0) snapshot.students[idx] = student;
      else snapshot.students.unshift(student);
    });
    return;
  }

  if (m === 'delete' && path.includes('/admin/students/')) {
    const id = path.split('/').filter(Boolean).pop();
    if (!id) return;
    updateStored((snapshot) => {
      snapshot.students = snapshot.students.filter((s) => s.id !== id);
      snapshot.enrollments = snapshot.enrollments.filter((e) => e.studentId !== id);
    });
    return;
  }

  // —— Courses ——
  if (m === 'post' && path.endsWith('/admin/courses')) {
    if (!data || typeof data !== 'object') return;
    const course = data as Course;
    updateStored((snapshot) => {
      const idx = snapshot.courses.findIndex((c) => c.id === course.id);
      if (idx >= 0) snapshot.courses[idx] = course;
      else snapshot.courses.unshift(course);
    });
    return;
  }

  if (m === 'patch' && path.includes('/admin/courses/') && !path.includes('/lessons')) {
    if (!data || typeof data !== 'object') return;
    const course = data as Course;
    updateStored((snapshot) => {
      const idx = snapshot.courses.findIndex((c) => c.id === course.id);
      if (idx >= 0) {
        snapshot.courses[idx] = {
          ...snapshot.courses[idx],
          ...course,
          lessons: course.lessons?.length ? course.lessons : snapshot.courses[idx].lessons,
        };
      }
    });
    return;
  }

  if (m === 'delete' && path.includes('/admin/courses/') && !path.includes('/lessons')) {
    const id = path.split('/').filter(Boolean).pop();
    if (!id) return;
    updateStored((snapshot) => {
      snapshot.courses = snapshot.courses.filter((c) => c.id !== id);
      snapshot.enrollments = snapshot.enrollments.filter((e) => e.courseId !== id);
      snapshot.students = snapshot.students.map((s) => ({
        ...s,
        enrolledCourseIds: s.enrolledCourseIds.filter((cid) => cid !== id),
      }));
    });
    return;
  }

  // —— Lessons ——
  if (path.includes('/admin/courses/') && path.endsWith('/lessons')) {
    const courseId = courseIdFromLessonsPath(path);
    if (!courseId) return;

    if (m === 'post' || m === 'patch') {
      if (!data || typeof data !== 'object') return;
      const lesson = data as Lesson;
      updateStored((snapshot) => {
        const course = snapshot.courses.find((c) => c.id === courseId);
        if (!course) return;
        const idx = course.lessons.findIndex((l) => l.id === lesson.id);
        if (idx >= 0) course.lessons[idx] = lesson;
        else course.lessons.push(lesson);
      });
      return;
    }

    if (m === 'delete') {
      const lessonId = searchParams.get('lessonId') ?? (body?.lessonId as string | undefined);
      if (!lessonId) return;
      updateStored((snapshot) => {
        const course = snapshot.courses.find((c) => c.id === courseId);
        if (!course) return;
        course.lessons = course.lessons.filter((l) => l.id !== lessonId);
        delete snapshot.videoProgress[lessonId];
      });
      return;
    }
  }

  // —— Enrollments ——
  if (m === 'post' && path.endsWith('/admin/enrollments')) {
    if (!data || typeof data !== 'object') return;
    const result = data as { enrollments?: Enrollment[] };
    if (!result.enrollments?.length) return;
    updateStored((snapshot) => {
      const map = new Map(snapshot.enrollments.map((e) => [`${e.studentId}:${e.courseId}`, e]));
      for (const enrollment of result.enrollments!) {
        map.set(`${enrollment.studentId}:${enrollment.courseId}`, enrollment);
        const student = snapshot.students.find((s) => s.id === enrollment.studentId);
        if (student && !student.enrolledCourseIds.includes(enrollment.courseId)) {
          student.enrolledCourseIds.push(enrollment.courseId);
        }
      }
      snapshot.enrollments = Array.from(map.values());
    });
    return;
  }

  // —— Student video progress ——
  if (m === 'post' && path.endsWith('/student/progress')) {
    if (!data || typeof data !== 'object') return;
    const videoId = body?.videoId as string | undefined;
    if (!videoId) return;
    const result = data as { videoProgress?: VideoProgress };
    if (!result.videoProgress) return;
    updateStored((snapshot) => {
      snapshot.videoProgress[videoId] = result.videoProgress!;
    });
  }
}

/** @deprecated Use applyMutationToStorage */
export const applyAdminMutationToStorage = applyMutationToStorage;

/** When localStorage was empty, bootstrap from server after mutation. */
export async function bootstrapStorageAfterMutation(): Promise<void> {
  if (getStoredMockDb()) return;
  await commitLocalSnapshotToServer();
}

/** True for any request that mutates the mock in-memory DB. */
export function isMockDbMutatingRequest(method: string | undefined, url: string | undefined): boolean {
  if (!method || !url) return false;
  const m = method.toLowerCase();
  if (!['post', 'put', 'patch', 'delete'].includes(m)) return false;
  if (url.includes('/mock/state') || url.includes('/auth/')) return false;
  if (url.includes('/admin/')) return true;
  if (url.includes('/student/progress')) return true;
  return false;
}

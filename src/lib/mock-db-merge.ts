import type { Course, Enrollment, Student } from '@/types';
import type { MockDbSnapshot } from '@/types/mock-db';
import { MOCK_DB_VERSION } from '@/types/mock-db';

function mergeLessons(serverLessons: Course['lessons'], localLessons: Course['lessons']) {
  const map = new Map(serverLessons.map((l) => [l.id, l]));
  for (const lesson of localLessons) {
    map.set(lesson.id, lesson);
  }
  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}

function mergeCourses(serverCourses: Course[], localCourses: Course[]): Course[] {
  const map = new Map<string, Course>();
  for (const course of serverCourses) {
    map.set(course.id, course);
  }
  for (const course of localCourses) {
    const existing = map.get(course.id);
    if (!existing) {
      map.set(course.id, course);
      continue;
    }
    map.set(course.id, {
      ...existing,
      ...course,
      lessons: mergeLessons(existing.lessons, course.lessons),
    });
  }
  return Array.from(map.values());
}

function mergeStudents(serverStudents: Student[], localStudents: Student[]): Student[] {
  const map = new Map<string, Student>();
  for (const student of serverStudents) {
    map.set(student.id, student);
  }
  for (const student of localStudents) {
    const existing = map.get(student.id);
    if (!existing) {
      map.set(student.id, student);
      continue;
    }
    // Prefer local row when it differs (PATCH/create write-through)
    map.set(student.id, { ...existing, ...student });
  }
  return Array.from(map.values());
}

function mergeEnrollments(serverEnrollments: Enrollment[], localEnrollments: Enrollment[]): Enrollment[] {
  const map = new Map<string, Enrollment>();
  for (const enrollment of [...serverEnrollments, ...localEnrollments]) {
    map.set(`${enrollment.studentId}:${enrollment.courseId}`, enrollment);
  }
  return Array.from(map.values());
}

/** Union merge — never drops entities that exist on either side. */
export function mergeSnapshots(server: MockDbSnapshot, local: MockDbSnapshot): MockDbSnapshot {
  return {
    version: MOCK_DB_VERSION,
    students: mergeStudents(server.students, local.students),
    courses: mergeCourses(server.courses, local.courses),
    enrollments: mergeEnrollments(server.enrollments, local.enrollments),
    videoProgress: { ...server.videoProgress, ...local.videoProgress },
    watchSessions:
      local.watchSessions.length >= server.watchSessions.length
        ? local.watchSessions
        : server.watchSessions,
  };
}

export function snapshotFingerprint(snapshot: MockDbSnapshot): string {
  const studentIds = snapshot.students.map((s) => s.id).sort().join('|');
  const courseIds = snapshot.courses.map((c) => c.id).sort().join('|');
  const lessonCount = snapshot.courses.reduce((n, c) => n + c.lessons.length, 0);
  return `${snapshot.students.length}:${snapshot.courses.length}:${lessonCount}:${studentIds}:${courseIds}`;
}

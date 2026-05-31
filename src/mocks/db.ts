import type {
  AdminOverviewReport,
  Course,
  CourseProgress,
  Enrollment,
  Lesson,
  PaginatedResponse,
  ProgressUpdatePayload,
  Student,
  StudentCourseCard,
  StudentDashboardStats,
  StudentReport,
  User,
  VideoProgress,
} from '@/types';
import type { MockDbSnapshot, WatchSession } from '@/types/mock-db';
import { MOCK_DB_VERSION } from '@/types/mock-db';
import {
  seedCourses,
  seedEnrollments,
  seedStudents,
  seedUsers,
  seedVideoProgress,
} from './seed';

const globalForDb = globalThis as unknown as {
  courses?: Course[];
  students?: Student[];
  enrollments?: Enrollment[];
  videoProgressMap?: Record<string, VideoProgress>;
  watchSessions?: WatchSession[];
};

if (!globalForDb.courses) {
  globalForDb.courses = structuredClone(seedCourses);
}
if (!globalForDb.students) {
  globalForDb.students = structuredClone(seedStudents);
}
if (!globalForDb.enrollments) {
  globalForDb.enrollments = structuredClone(seedEnrollments);
}
if (!globalForDb.videoProgressMap) {
  globalForDb.videoProgressMap = structuredClone(seedVideoProgress);
}
if (!globalForDb.watchSessions) {
  globalForDb.watchSessions = [];
}

let courses = globalForDb.courses;
let students = globalForDb.students;
let enrollments = globalForDb.enrollments;
const videoProgressMap = globalForDb.videoProgressMap;
const watchSessions = globalForDb.watchSessions;

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function authenticate(email: string, password: string) {
  await delay();
  const entry = seedUsers[email.toLowerCase()];
  if (!entry || entry.password !== password) return null;
  return { token: `aaft-token-${entry.user.id}`, user: entry.user };
}

export function getCourseProgress(courseId: string, studentId?: string): CourseProgress {
  const course = courses.find((c) => c.id === courseId);
  if (!course) return { completedVideos: 0, totalVideos: 0, percentage: 0 };
  const total = course.lessons.length;
  const completed = course.lessons.filter((l) => videoProgressMap[l.id]?.isCompleted).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  void studentId;
  return { completedVideos: completed, totalVideos: total, percentage };
}

export async function listStudents(params: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}): Promise<PaginatedResponse<Student>> {
  await delay();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  let items = [...students];
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }
  if (params.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
  if (params.sort === 'email') items.sort((a, b) => a.email.localeCompare(b.email));
  const totalItems = items.length;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    meta: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) || 1 },
  };
}

export async function getStudent(id: string) {
  await delay();
  return students.find((s) => s.id === id) ?? null;
}

export async function createStudent(data: { name: string; email: string }) {
  await delay();
  const student: Student = {
    id: `student_${Date.now()}`,
    name: data.name,
    email: data.email,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=0A2540&color=D4AF37`,
    enrolledCourseIds: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };
  students.unshift(student);
  return student;
}

export async function updateStudent(id: string, data: Partial<Student>) {
  await delay();
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  students[idx] = { ...students[idx], ...data, id };
  return students[idx];
}

export async function deleteStudent(id: string) {
  await delay();
  students = globalForDb.students = students.filter((s) => s.id !== id);
  enrollments = globalForDb.enrollments = enrollments.filter((e) => e.studentId !== id);
  return true;
}

export async function listCourses(): Promise<Course[]> {
  await delay();
  return courses;
}

export async function getCourse(id: string) {
  await delay();
  return courses.find((c) => c.id === id) ?? null;
}

export async function createCourse(data: { name: string; description: string; thumbnail?: string }) {
  await delay();
  const course: Course = {
    id: `course_${Date.now()}`,
    name: data.name,
    description: data.description,
    thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=500&fit=crop',
    lessons: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };
  courses.unshift(course);
  return course;
}

export async function updateCourse(id: string, data: Partial<Course>) {
  await delay();
  const idx = courses.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  courses[idx] = { ...courses[idx], ...data, id, lessons: courses[idx].lessons };
  return courses[idx];
}

export async function deleteCourse(id: string) {
  await delay();
  courses = globalForDb.courses = courses.filter((c) => c.id !== id);
  enrollments = globalForDb.enrollments = enrollments.filter((e) => e.courseId !== id);
  students = globalForDb.students = students.map((s) => ({
    ...s,
    enrolledCourseIds: s.enrolledCourseIds.filter((cid) => cid !== id),
  }));
  return true;
}

export async function createLesson(
  courseId: string,
  data: { title: string; description: string; videoUrl: string; duration: number }
) {
  await delay();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;
  const lesson: Lesson = {
    id: `lesson_${Date.now()}`,
    courseId,
    title: data.title,
    description: data.description,
    videoUrl: data.videoUrl,
    duration: data.duration,
    order: course.lessons.length + 1,
  };
  course.lessons.push(lesson);
  return lesson;
}

export async function updateLesson(courseId: string, lessonId: string, data: Partial<Lesson>) {
  await delay();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;
  const idx = course.lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) return null;
  course.lessons[idx] = { ...course.lessons[idx], ...data, id: lessonId, courseId };
  return course.lessons[idx];
}

export async function deleteLesson(courseId: string, lessonId: string) {
  await delay();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return false;
  course.lessons = course.lessons.filter((l) => l.id !== lessonId);
  delete videoProgressMap[lessonId];
  return true;
}

export async function assignEnrollments(studentIds: string[], courseIds: string[]) {
  await delay();
  studentIds.forEach((studentId) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    courseIds.forEach((courseId) => {
      if (!student.enrolledCourseIds.includes(courseId)) {
        student.enrolledCourseIds.push(courseId);
        enrollments.push({
          id: `enr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          studentId,
          courseId,
          assignedAt: new Date().toISOString().slice(0, 10),
        });
      }
    });
  });
  return { success: true, enrollments };
}

export async function listEnrollments() {
  await delay();
  return enrollments.map((e) => {
    const student = students.find((s) => s.id === e.studentId);
    const course = courses.find((c) => c.id === e.courseId);
    return {
      ...e,
      studentName: student?.name ?? 'Unknown',
      courseName: course?.name ?? 'Unknown',
      progress: course ? getCourseProgress(course.id) : { completedVideos: 0, totalVideos: 0, percentage: 0 },
    };
  });
}

export async function getAdminOverview(): Promise<AdminOverviewReport> {
  await delay();
  const totalStudents = students.length;
  const totalCourses = courses.length;
  const avgCompletion =
    courses.length > 0
      ? Math.round(
          courses.reduce((acc, c) => acc + getCourseProgress(c.id).percentage, 0) / courses.length
        )
      : 0;
  return {
    metrics: [
      { label: 'Total Students', value: String(totalStudents), change: '+12%' },
      { label: 'Active Courses', value: String(totalCourses), change: '+3' },
      { label: 'Avg Completion', value: `${avgCompletion}%`, change: '+5%' },
      { label: 'Watch Hours', value: `${Math.round(watchSessions.reduce((a, s) => a + s.minutes, 0) / 60)}h`, change: '+18%' },
    ],
    completionTrend: [
      { month: 'Jan', rate: 62 },
      { month: 'Feb', rate: 68 },
      { month: 'Mar', rate: 71 },
      { month: 'Apr', rate: 74 },
      { month: 'May', rate: 78 },
      { month: 'Jun', rate: avgCompletion || 82 },
    ],
    timeSpentByCourse: courses.map((c) => ({
      course: c.name,
      hours: Math.round(
        c.lessons.reduce((acc, l) => acc + (videoProgressMap[l.id]?.totalWatchTime ?? 0), 0) / 3600
      ) || Math.floor(Math.random() * 40 + 10),
    })),
    courseCompletion: courses.map((c) => {
      const p = getCourseProgress(c.id);
      return { course: c.name, completed: p.completedVideos, total: p.totalVideos || c.lessons.length };
    }),
  };
}

export async function getStudentReport(studentId: string): Promise<StudentReport | null> {
  await delay();
  const student = students.find((s) => s.id === studentId);
  if (!student) return null;
  const enrolledCourses = student.enrolledCourseIds
    .map((cid) => {
      const course = courses.find((c) => c.id === cid);
      if (!course) return null;
      return { ...course, progress: getCourseProgress(cid, studentId) };
    })
    .filter(Boolean) as StudentReport['enrolledCourses'];
  const totalWatchTime = Object.values(videoProgressMap).reduce(
    (acc, p) => acc + (p.totalWatchTime ?? 0),
    0
  );
  return { student, enrolledCourses, totalWatchTime };
}

function resolveStudentId(user: User): string | null {
  if (user.role === 'student') {
    const match = students.find((s) => s.email === user.email);
    return match?.id ?? user.id;
  }
  return null;
}

export async function getStudentCourses(user: User, filters?: { search?: string; status?: string }) {
  await delay();
  const studentId = resolveStudentId(user);
  if (!studentId) return [];
  const student = students.find((s) => s.id === studentId);
  if (!student) return [];
  let items: StudentCourseCard[] = student.enrolledCourseIds
    .map((cid) => {
      const course = courses.find((c) => c.id === cid);
      if (!course) return null;
      const progress = getCourseProgress(cid, studentId);
      let status: StudentCourseCard['status'] = 'not_started';
      if (progress.percentage >= 100) status = 'completed';
      else if (progress.percentage > 0) status = 'in_progress';
      return { ...course, progress, status };
    })
    .filter(Boolean) as StudentCourseCard[];
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }
  if (filters?.status && filters.status !== 'all') {
    items = items.filter((c) => c.status === filters.status);
  }
  return items;
}

export async function getStudentCourseDetail(user: User, courseId: string) {
  await delay();
  const studentId = resolveStudentId(user);
  const student = students.find((s) => s.id === studentId);
  const course = courses.find((c) => c.id === courseId);
  if (!student || !course || !student.enrolledCourseIds.includes(courseId)) return null;
  const progress = getCourseProgress(courseId, studentId ?? undefined);
  const lessons = course.lessons.map((l) => ({
    ...l,
    progress: videoProgressMap[l.id] ?? {
      lastWatched: 0,
      percentage: 0,
      isCompleted: false,
      watchedSegments: [],
      totalWatchTime: 0,
    },
  }));
  return { course, progress, lessons };
}

export async function updateProgress(user: User, payload: ProgressUpdatePayload) {
  await delay(100);
  const studentId = resolveStudentId(user);
  const isCompleted = payload.percentage >= 90;
  const existing = videoProgressMap[payload.videoId];
  const segments = payload.watchedSegments ?? existing?.watchedSegments ?? [];
  const delta = payload.lastWatched - (existing?.lastWatched ?? 0);
  const addedTime = delta > 0 && delta < 120 ? delta : 0;
  videoProgressMap[payload.videoId] = {
    lastWatched: payload.lastWatched,
    percentage: Math.max(payload.percentage, existing?.percentage ?? 0),
    isCompleted: isCompleted || (existing?.isCompleted ?? false),
    watchedSegments: segments,
    totalWatchTime: (existing?.totalWatchTime ?? 0) + addedTime,
  };
  if (studentId && addedTime > 0) {
    watchSessions.push({
      studentId,
      videoId: payload.videoId,
      minutes: addedTime / 60,
      date: new Date().toISOString().slice(0, 10),
    });
  }
  const courseProgress = getCourseProgress(payload.courseId, studentId ?? undefined);
  return { videoProgress: videoProgressMap[payload.videoId], courseProgress };
}

export async function getCourseProgressForStudent(user: User, courseId: string) {
  await delay();
  const studentId = resolveStudentId(user);
  return getCourseProgress(courseId, studentId ?? undefined);
}

export async function getStudentDashboard(user: User): Promise<StudentDashboardStats> {
  await delay();
  const coursesList = await getStudentCourses(user);
  const inProgress = coursesList.filter((c) => c.status === 'in_progress').length;
  const completed = coursesList.filter((c) => c.status === 'completed').length;
  const totalWatchTime = Object.values(videoProgressMap).reduce(
    (acc, p) => acc + (p.totalWatchTime ?? 0),
    0
  );
  return {
    inProgress,
    completed,
    totalWatchTime,
    courses: coursesList,
    weeklyProgress: [
      { day: 'Mon', minutes: 45 },
      { day: 'Tue', minutes: 62 },
      { day: 'Wed', minutes: 30 },
      { day: 'Thu', minutes: 88 },
      { day: 'Fri', minutes: 55 },
      { day: 'Sat', minutes: 120 },
      { day: 'Sun', minutes: 40 },
    ],
  };
}

export function getAllVideoProgress() {
  return videoProgressMap;
}

export function exportDbSnapshot(): MockDbSnapshot {
  return {
    version: MOCK_DB_VERSION,
    courses: structuredClone(courses),
    students: structuredClone(students),
    enrollments: structuredClone(enrollments),
    videoProgress: structuredClone(videoProgressMap),
    watchSessions: structuredClone(watchSessions),
  };
}

export function importDbSnapshot(snapshot: MockDbSnapshot): boolean {
  if (snapshot.version !== MOCK_DB_VERSION) return false;
  courses = globalForDb.courses = structuredClone(snapshot.courses);
  students = globalForDb.students = structuredClone(snapshot.students);
  enrollments = globalForDb.enrollments = structuredClone(snapshot.enrollments);
  for (const key of Object.keys(videoProgressMap)) {
    delete videoProgressMap[key];
  }
  Object.assign(videoProgressMap, structuredClone(snapshot.videoProgress));
  watchSessions.length = 0;
  watchSessions.push(...structuredClone(snapshot.watchSessions));
  return true;
}

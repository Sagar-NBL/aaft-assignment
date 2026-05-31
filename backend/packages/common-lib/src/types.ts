/**
 * Frontend-contract DTO shapes.
 *
 * These mirror `../src/types/index.ts` in the reference frontend exactly.
 * Services map their internal Prisma models to these shapes before sending
 * responses, so the provided UI works without modification.
 */

export type UserRole = 'admin' | 'instructor' | 'student';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student'; // Part A frontend only knows admin/student
  avatar: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
}

export interface LessonDto {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
}

export interface CourseDto {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  lessons: LessonDto[];
  createdAt: string;
}

export interface StudentDto {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledCourseIds: string[];
  createdAt: string;
}

export interface EnrollmentDto {
  id: string;
  studentId: string;
  courseId: string;
  assignedAt: string;
  studentName?: string;
  courseName?: string;
  progress?: CourseProgressDto;
}

export interface VideoProgressDto {
  lastWatched: number;
  percentage: number;
  isCompleted: boolean;
  watchedSegments?: Array<[number, number]>;
  totalWatchTime?: number;
}

export interface CourseProgressDto {
  completedVideos: number;
  totalVideos: number;
  percentage: number;
}

export type StudentCourseStatus = 'not_started' | 'in_progress' | 'completed';

export interface StudentCourseCardDto extends CourseDto {
  progress: CourseProgressDto;
  status: StudentCourseStatus;
}

export interface PaginatedMetaDto {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponseDto<T> {
  items: T[];
  meta: PaginatedMetaDto;
}

export interface AdminOverviewReportDto {
  metrics: Array<{ label: string; value: string; change: string }>;
  completionTrend: Array<{ month: string; rate: number }>;
  timeSpentByCourse: Array<{ course: string; hours: number }>;
  courseCompletion: Array<{ course: string; completed: number; total: number }>;
}

export interface StudentReportDto {
  student: StudentDto;
  enrolledCourses: Array<CourseDto & { progress: CourseProgressDto }>;
  totalWatchTime: number;
}

export interface StudentDashboardStatsDto {
  inProgress: number;
  completed: number;
  totalWatchTime: number;
  courses: StudentCourseCardDto[];
  weeklyProgress: Array<{ day: string; minutes: number }>;
}

export interface ProgressUpdatePayloadDto {
  videoId: string;
  courseId: string;
  lastWatched: number;
  percentage: number;
  duration: number;
  watchedSegments?: Array<[number, number]>;
}

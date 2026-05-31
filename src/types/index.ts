export type UserRole = 'admin' | 'student';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
};

export type Course = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  lessons: Lesson[];
  createdAt: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledCourseIds: string[];
  createdAt: string;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  assignedAt: string;
};

export type VideoProgress = {
  lastWatched: number;
  percentage: number;
  isCompleted: boolean;
  watchedSegments?: [number, number][];
  totalWatchTime?: number;
};

export type CourseProgress = {
  completedVideos: number;
  totalVideos: number;
  percentage: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
};

export type StudentCourseCard = Course & {
  progress: CourseProgress;
  status: 'not_started' | 'in_progress' | 'completed';
};

export type PaginatedMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginatedMeta;
};

export type AdminOverviewReport = {
  metrics: { label: string; value: string; change: string }[];
  completionTrend: { month: string; rate: number }[];
  timeSpentByCourse: { course: string; hours: number }[];
  courseCompletion: { course: string; completed: number; total: number }[];
};

export type StudentReport = {
  student: Student;
  enrolledCourses: (Course & { progress: CourseProgress })[];
  totalWatchTime: number;
};

export type StudentDashboardStats = {
  inProgress: number;
  completed: number;
  totalWatchTime: number;
  courses: StudentCourseCard[];
  weeklyProgress: { day: string; minutes: number }[];
};

export type ProgressUpdatePayload = {
  videoId: string;
  courseId: string;
  lastWatched: number;
  percentage: number;
  duration: number;
  watchedSegments?: [number, number][];
};

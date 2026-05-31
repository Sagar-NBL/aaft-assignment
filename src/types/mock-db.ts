import type { Course, Enrollment, Student, VideoProgress } from '@/types';

export const MOCK_DB_VERSION = 1 as const;

export type WatchSession = {
  studentId: string;
  videoId: string;
  minutes: number;
  date: string;
};

/** Serializable mock API database snapshot (persisted in localStorage). */
export type MockDbSnapshot = {
  version: typeof MOCK_DB_VERSION;
  courses: Course[];
  students: Student[];
  enrollments: Enrollment[];
  videoProgress: Record<string, VideoProgress>;
  watchSessions: WatchSession[];
};

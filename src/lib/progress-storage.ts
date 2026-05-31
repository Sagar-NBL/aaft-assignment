import { PROGRESS_KEY } from '@/lib/storage-keys';
import type { CourseProgress, VideoProgress } from '@/types';

export type StoredProgress = {
  videoProgress: Record<string, VideoProgress>;
  courseProgress: Record<string, CourseProgress>;
};

export function loadProgressFromStorage(): StoredProgress {
  if (typeof window === 'undefined') return { videoProgress: {}, courseProgress: {} };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw) as StoredProgress;
  } catch {
    localStorage.removeItem(PROGRESS_KEY);
  }
  return { videoProgress: {}, courseProgress: {} };
}

export function saveProgressToStorage(
  videoProgress: Record<string, VideoProgress>,
  courseProgress: Record<string, CourseProgress>
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ videoProgress, courseProgress }));
}

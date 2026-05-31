import { createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { loadProgressFromStorage, saveProgressToStorage } from '@/lib/progress-storage';
import { apiClient } from '@/services/apiClient';
import type { CourseProgress, ProgressUpdatePayload, VideoProgress } from '@/types';

export { PROGRESS_KEY } from '@/lib/storage-keys';
export { loadProgressFromStorage, saveProgressToStorage } from '@/lib/progress-storage';

export const hydrateProgress = createAction<{
  videoProgress: Record<string, VideoProgress>;
  courseProgress: Record<string, CourseProgress>;
}>('progress/hydrate');

let progressDebounce: ReturnType<typeof setTimeout> | null = null;

export const updateVideoProgressThunk = createAsyncThunk<
  {
    videoId: string;
    courseId: string;
    videoProgress: VideoProgress;
    courseProgress: CourseProgress;
  },
  ProgressUpdatePayload,
  { rejectValue: string }
>('progress/updateVideo', async (payload, { rejectWithValue, getState }) => {
  return new Promise((resolve, reject) => {
    if (progressDebounce) clearTimeout(progressDebounce);
    progressDebounce = setTimeout(async () => {
      try {
        const { data } = await apiClient.post<{
          videoProgress: VideoProgress;
          courseProgress: CourseProgress;
        }>('/student/progress', payload);
        const state = getState() as { progress: { videoProgress: Record<string, VideoProgress>; courseProgress: Record<string, CourseProgress> } };
        const videoProgress = { ...state.progress.videoProgress, [payload.videoId]: data.videoProgress };
        const courseProgress = { ...state.progress.courseProgress, [payload.courseId]: data.courseProgress };
        saveProgressToStorage(videoProgress, courseProgress);
        resolve({
          videoId: payload.videoId,
          courseId: payload.courseId,
          videoProgress: data.videoProgress,
          courseProgress: data.courseProgress,
        });
      } catch (e) {
        reject(rejectWithValue(e instanceof Error ? e.message : 'Progress update failed'));
      }
    }, 1500);
  });
});

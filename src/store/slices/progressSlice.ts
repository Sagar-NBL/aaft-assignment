import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CourseProgress, VideoProgress } from '@/types';
import { updateVideoProgressThunk, hydrateProgress } from '../thunks/progressThunks';

export type ProgressState = {
  videoProgress: Record<string, VideoProgress>;
  courseProgress: Record<string, CourseProgress>;
  loading: boolean;
  error: string | null;
};

const initialState: ProgressState = {
  videoProgress: {},
  courseProgress: {},
  loading: false,
  error: null,
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    setVideoProgressLocal: (
      state,
      action: PayloadAction<{ videoId: string; progress: VideoProgress }>
    ) => {
      state.videoProgress[action.payload.videoId] = action.payload.progress;
    },
    setCourseProgressLocal: (
      state,
      action: PayloadAction<{ courseId: string; progress: CourseProgress }>
    ) => {
      state.courseProgress[action.payload.courseId] = action.payload.progress;
    },
    clearProgressError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateProgress, (state, action) => {
        state.videoProgress = action.payload.videoProgress;
        state.courseProgress = action.payload.courseProgress;
      })
      .addCase(updateVideoProgressThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateVideoProgressThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.videoProgress[action.payload.videoId] = action.payload.videoProgress;
        state.courseProgress[action.payload.courseId] = action.payload.courseProgress;
      })
      .addCase(updateVideoProgressThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setVideoProgressLocal, setCourseProgressLocal, clearProgressError } =
  progressSlice.actions;
export default progressSlice.reducer;

import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { saveProgressToStorage } from '@/lib/progress-storage';
import { commitLocalSnapshotToServer } from '@/lib/mock-db-sync';
import {
  setVideoProgressLocal,
  setCourseProgressLocal,
} from './slices/progressSlice';
import { toggleSidebar, setSidebarOpen, setTheme } from './slices/uiSlice';
import { setStoredUiPrefs } from '@/lib/ui-storage';
import type { RootState } from './types';

export const persistListener = createListenerMiddleware<RootState>();

let progressCommitTimer: ReturnType<typeof setTimeout> | null = null;

persistListener.startListening({
  matcher: isAnyOf(setVideoProgressLocal, setCourseProgressLocal),
  effect: (_action, api) => {
    const { videoProgress, courseProgress } = api.getState().progress;
    saveProgressToStorage(videoProgress, courseProgress);
    if (progressCommitTimer) clearTimeout(progressCommitTimer);
    progressCommitTimer = setTimeout(() => {
      progressCommitTimer = null;
      void commitLocalSnapshotToServer();
    }, 400);
  },
});

persistListener.startListening({
  matcher: isAnyOf(toggleSidebar, setSidebarOpen, setTheme),
  effect: (_action, api) => {
    const { sidebarOpen, theme } = api.getState().ui;
    setStoredUiPrefs({ sidebarOpen, theme });
  },
});

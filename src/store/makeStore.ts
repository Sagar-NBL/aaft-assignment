import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import authReducer from './slices/authSlice';
import coursesReducer from './slices/coursesSlice';
import studentsReducer from './slices/studentsSlice';
import progressReducer from './slices/progressSlice';
import uiReducer from './slices/uiSlice';
import { persistListener } from './persistListener';
import type { RootState } from './types';

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      courses: coursesReducer,
      students: studentsReducer,
      progress: progressReducer,
      ui: uiReducer,
      [api.reducerPath]: api.reducer,
    },
    // Partial preload is valid at runtime; RTK types expect full RootState
    preloadedState: preloadedState as RootState | undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false })
        .prepend(persistListener.middleware)
        .concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

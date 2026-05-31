import type { AuthState } from './slices/authSlice';
import type { CoursesState } from './slices/coursesSlice';
import type { StudentsState } from './slices/studentsSlice';
import type { ProgressState } from './slices/progressSlice';
import type { UiState } from './slices/uiSlice';

export type RootState = {
  auth: AuthState;
  courses: CoursesState;
  students: StudentsState;
  progress: ProgressState;
  ui: UiState;
  aaftApi: ReturnType<typeof import('@/services/api').api.reducer>;
};

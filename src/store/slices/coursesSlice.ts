import { createSlice } from '@reduxjs/toolkit';
import type { Course } from '@/types';
import {
  createCourseThunk,
  deleteCourseThunk,
  fetchCoursesThunk,
  updateCourseThunk,
} from '../thunks/coursesThunks';

export type CoursesState = {
  courses: Course[];
  selectedCourse: Course | null;
  loading: boolean;
  error: string | null;
};

const initialState: CoursesState = {
  courses: [],
  selectedCourse: null,
  loading: false,
  error: null,
};

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setSelectedCourse: (state, action) => {
      state.selectedCourse = action.payload;
    },
    clearCoursesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoursesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCoursesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createCourseThunk.fulfilled, (state, action) => {
        state.courses.unshift(action.payload);
      })
      .addCase(updateCourseThunk.fulfilled, (state, action) => {
        const idx = state.courses.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.courses[idx] = action.payload;
        if (state.selectedCourse?.id === action.payload.id) {
          state.selectedCourse = action.payload;
        }
      })
      .addCase(deleteCourseThunk.fulfilled, (state, action) => {
        state.courses = state.courses.filter((c) => c.id !== action.payload);
      });
  },
});

export const { setSelectedCourse, clearCoursesError } = coursesSlice.actions;
export default coursesSlice.reducer;

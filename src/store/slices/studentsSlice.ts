import { createSlice } from '@reduxjs/toolkit';
import type { Student } from '@/types';
import {
  createStudentThunk,
  deleteStudentThunk,
  fetchStudentsThunk,
  updateStudentThunk,
} from '../thunks/studentsThunks';

export type StudentsState = {
  students: Student[];
  selectedStudent: Student | null;
  loading: boolean;
  error: string | null;
  meta: { page: number; totalPages: number; totalItems: number };
};

const initialState: StudentsState = {
  students: [],
  selectedStudent: null,
  loading: false,
  error: null,
  meta: { page: 1, totalPages: 1, totalItems: 0 },
};

const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    setSelectedStudent: (state, action) => {
      state.selectedStudent = action.payload;
    },
    clearStudentsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchStudentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createStudentThunk.fulfilled, (state, action) => {
        state.students.unshift(action.payload);
        state.meta.totalItems += 1;
      })
      .addCase(updateStudentThunk.fulfilled, (state, action) => {
        const idx = state.students.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.students[idx] = action.payload;
      })
      .addCase(deleteStudentThunk.fulfilled, (state, action) => {
        state.students = state.students.filter((s) => s.id !== action.payload);
      });
  },
});

export const { setSelectedStudent, clearStudentsError } = studentsSlice.actions;
export default studentsSlice.reducer;

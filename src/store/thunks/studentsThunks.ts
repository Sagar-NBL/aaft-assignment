import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/services/apiClient';
import type { PaginatedResponse, Student } from '@/types';

export const fetchStudentsThunk = createAsyncThunk<
  PaginatedResponse<Student>,
  { page?: number; limit?: number; search?: string; sort?: string },
  { rejectValue: string }
>('students/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get<PaginatedResponse<Student>>('/admin/students', {
      params,
    });
    return data;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed to fetch students');
  }
});

export const createStudentThunk = createAsyncThunk<
  Student,
  { name: string; email: string },
  { rejectValue: string }
>('students/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<Student>('/admin/students', payload);
    return data;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed to create student');
  }
});

export const updateStudentThunk = createAsyncThunk<
  Student,
  { id: string; updates: Partial<Student> },
  { rejectValue: string }
>('students/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.patch<Student>(`/admin/students/${id}`, updates);
    return data;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed to update student');
  }
});

export const deleteStudentThunk = createAsyncThunk<string, string, { rejectValue: string }>(
  'students/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/students/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to delete student');
    }
  }
);

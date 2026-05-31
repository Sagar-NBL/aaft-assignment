import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/services/apiClient';
import type { Course } from '@/types';

export const fetchCoursesThunk = createAsyncThunk<Course[], void, { rejectValue: string }>(
  'courses/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<{ items: Course[] }>('/admin/courses');
      return data.items;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to fetch courses');
    }
  }
);

export const createCourseThunk = createAsyncThunk<
  Course,
  { name: string; description: string; thumbnail?: string },
  { rejectValue: string }
>('courses/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<Course>('/admin/courses', payload);
    return data;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed to create course');
  }
});

export const updateCourseThunk = createAsyncThunk<
  Course,
  { id: string; updates: Partial<Course> },
  { rejectValue: string }
>('courses/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.patch<Course>(`/admin/courses/${id}`, updates);
    return data;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed to update course');
  }
});

export const deleteCourseThunk = createAsyncThunk<string, string, { rejectValue: string }>(
  'courses/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/courses/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to delete course');
    }
  }
);

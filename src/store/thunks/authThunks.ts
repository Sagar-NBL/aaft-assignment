import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient, AUTH_KEY } from '@/services/apiClient';
import type { AuthResponse } from '@/types';

export const loginThunk = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    }
    return data;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Login failed');
  }
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
});

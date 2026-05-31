import { createSlice } from '@reduxjs/toolkit';
import type { User } from '@/types';
import { loginThunk, logoutThunk } from '../thunks/authThunks';

export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** False until client has read localStorage (avoids guard flash on navigation) */
  ready: boolean;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  ready: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth: (state, action) => {
      const { user, token } = action.payload as { user: User; token: string };
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.ready = true;
    },
    setAuthReady: (state) => {
      state.ready = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { hydrateAuth, setAuthReady, clearError } = authSlice.actions;
export default authSlice.reducer;

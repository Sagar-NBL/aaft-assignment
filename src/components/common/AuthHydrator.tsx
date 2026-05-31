'use client';

import { useLayoutEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { hydrateAuth, setAuthReady } from '@/store/slices/authSlice';
import { loadProgressFromStorage } from '@/lib/progress-storage';
import { hydrateProgress } from '@/store/thunks/progressThunks';
import { getStoredAuth } from '@/lib/auth-storage';

export function AuthHydrator() {
  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      dispatch(hydrateAuth(stored));
    } else {
      dispatch(setAuthReady());
    }
    dispatch(hydrateProgress(loadProgressFromStorage()));
  }, [dispatch]);

  return null;
}

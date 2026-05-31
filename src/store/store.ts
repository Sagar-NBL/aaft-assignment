import { getStoredAuth } from '@/lib/auth-storage';
import { getStoredUiPrefs } from '@/lib/ui-storage';
import { loadProgressFromStorage } from '@/lib/progress-storage';
import { makeStore, type AppStore } from './makeStore';
import type { RootState } from './types';

export type { RootState } from './types';

function buildClientPreloadedState(): Partial<RootState> | undefined {
  if (typeof window === 'undefined') return undefined;

  const preloaded: Partial<RootState> = {
    auth: {
      user: null,
      token: null,
      isAuthenticated: false,
      ready: true,
      loading: false,
      error: null,
    },
    progress: {
      ...loadProgressFromStorage(),
      loading: false,
      error: null,
    },
  };

  const stored = getStoredAuth();
  if (stored) {
    preloaded.auth = {
      user: stored.user,
      token: stored.token,
      isAuthenticated: true,
      ready: true,
      loading: false,
      error: null,
    };
  }

  const uiPrefs = getStoredUiPrefs();
  if (uiPrefs) {
    preloaded.ui = {
      sidebarOpen: uiPrefs.sidebarOpen,
      theme: uiPrefs.theme,
      notifications: [],
    };
  }

  return preloaded;
}

let clientStore: AppStore | undefined;

export function getStore(): AppStore {
  if (!clientStore) {
    clientStore = makeStore(buildClientPreloadedState());
  }
  return clientStore;
}

/** @deprecated Prefer getStore() via Providers — kept for tests */
export const store = typeof window !== 'undefined' ? getStore() : makeStore();

export type { AppStore, AppDispatch } from './makeStore';

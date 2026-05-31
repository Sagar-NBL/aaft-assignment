import type { User } from '@/types';

const AUTH_KEY = 'aaft_auth';

export type StoredAuth = {
  token: string;
  user: User;
};

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredAuth;
    if (data?.token && data?.user?.role) return data;
  } catch {
    localStorage.removeItem(AUTH_KEY);
  }
  return null;
}

export { AUTH_KEY };

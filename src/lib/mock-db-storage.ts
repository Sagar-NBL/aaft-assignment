import type { MockDbSnapshot } from '@/types/mock-db';
import { MOCK_DB_VERSION } from '@/types/mock-db';

export const MOCK_DB_KEY = 'aaft_mock_db';

export function getStoredMockDb(): MockDbSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as MockDbSnapshot;
    if (data?.version === MOCK_DB_VERSION && Array.isArray(data.courses) && Array.isArray(data.students)) {
      return data;
    }
  } catch {
    localStorage.removeItem(MOCK_DB_KEY);
  }
  return null;
}

export function setStoredMockDb(snapshot: MockDbSnapshot): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(snapshot));
}

export function clearStoredMockDb(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MOCK_DB_KEY);
}

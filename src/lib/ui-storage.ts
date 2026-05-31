import type { UiState } from '@/store/slices/uiSlice';

export const UI_PREFS_KEY = 'aaft_ui_prefs';

export type StoredUiPrefs = Pick<UiState, 'sidebarOpen' | 'theme'>;

export function getStoredUiPrefs(): StoredUiPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredUiPrefs;
    if (typeof data.sidebarOpen === 'boolean' && (data.theme === 'light' || data.theme === 'dark')) {
      return data;
    }
  } catch {
    localStorage.removeItem(UI_PREFS_KEY);
  }
  return null;
}

export function setStoredUiPrefs(prefs: StoredUiPrefs): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
}

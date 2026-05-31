const LAST_ROLE_KEY = 'aaft:lastRole';

export type LastRole = 'admin' | 'student';

export function setLastRole(role: LastRole): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(LAST_ROLE_KEY, role);
}

export function getLastRole(): LastRole | null {
  if (typeof window === 'undefined') return null;
  const role = sessionStorage.getItem(LAST_ROLE_KEY);
  return role === 'admin' || role === 'student' ? role : null;
}

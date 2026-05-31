import { NextResponse } from 'next/server';
import type { User } from '@/types';
import { seedUsers } from '@/mocks/seed';

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function getUserFromRequest(request: Request): User | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const userId = token.replace('aaft-token-', '');
  for (const entry of Object.values(seedUsers)) {
    if (entry.user.id === userId) return entry.user;
  }
  return null;
}

export function requireAuth(request: Request, role?: 'admin' | 'student') {
  const user = getUserFromRequest(request);
  if (!user) return { user: null, error: jsonError('Unauthorized', 401) };
  if (role && user.role !== role) return { user: null, error: jsonError('Forbidden', 403) };
  return { user, error: null };
}

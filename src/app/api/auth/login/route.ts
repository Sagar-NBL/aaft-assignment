import { authenticate } from '@/mocks/db';
import { jsonError, jsonOk } from '@/lib/api-helpers';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) return jsonError('Email and password required');
  const result = await authenticate(email, password);
  if (!result) return jsonError('Invalid credentials', 401);
  return jsonOk(result);
}

import { getStudentDashboard } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const { user, error } = requireAuth(request, 'student');
  if (error || !user) return error ?? jsonError('Unauthorized', 401);
  const stats = await getStudentDashboard(user);
  return jsonOk(stats);
}

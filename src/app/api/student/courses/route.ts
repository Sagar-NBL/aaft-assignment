import { getStudentCourses } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const { user, error } = requireAuth(request, 'student');
  if (error || !user) return error ?? jsonError('Unauthorized', 401);
  const { searchParams } = new URL(request.url);
  const items = await getStudentCourses(user, {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  });
  return jsonOk({ items });
}

import { getStudentCourseDetail } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { user, error } = requireAuth(request, 'student');
  if (error || !user) return error ?? jsonError('Unauthorized', 401);
  const { id } = await params;
  const detail = await getStudentCourseDetail(user, id);
  if (!detail) return jsonError('Course not found', 404);
  return jsonOk(detail);
}

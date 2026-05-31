import { getCourseProgressForStudent } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

type Params = { params: Promise<{ courseId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { user, error } = requireAuth(request, 'student');
  if (error || !user) return error ?? jsonError('Unauthorized', 401);
  const { courseId } = await params;
  const progress = await getCourseProgressForStudent(user, courseId);
  return jsonOk(progress);
}

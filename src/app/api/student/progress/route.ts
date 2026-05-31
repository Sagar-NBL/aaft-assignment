import { updateProgress } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

export async function POST(request: Request) {
  const { user, error } = requireAuth(request, 'student');
  if (error || !user) return error ?? jsonError('Unauthorized', 401);
  const body = await request.json();
  if (!body.videoId || !body.courseId) return jsonError('videoId and courseId required');
  const result = await updateProgress(user, body);
  return jsonOk(result);
}

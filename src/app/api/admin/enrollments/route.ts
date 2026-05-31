import { assignEnrollments, listEnrollments } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const data = await listEnrollments();
  return jsonOk({ items: data });
}

export async function POST(request: Request) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const body = await request.json();
  const { studentIds, courseIds } = body as { studentIds?: string[]; courseIds?: string[] };
  if (!studentIds?.length || !courseIds?.length) {
    return jsonError('studentIds and courseIds required');
  }
  const result = await assignEnrollments(studentIds, courseIds);
  return jsonOk(result);
}

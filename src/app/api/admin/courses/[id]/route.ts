import { deleteCourse, getCourse, updateCourse } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return jsonError('Course not found', 404);
  return jsonOk(course);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  const course = await updateCourse(id, body);
  if (!course) return jsonError('Course not found', 404);
  return jsonOk(course);
}

export async function DELETE(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id } = await params;
  await deleteCourse(id);
  return jsonOk({ success: true });
}

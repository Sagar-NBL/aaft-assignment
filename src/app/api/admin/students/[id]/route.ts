import { deleteStudent, getStudent, updateStudent } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) return jsonError('Student not found', 404);
  return jsonOk(student);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  const student = await updateStudent(id, body);
  if (!student) return jsonError('Student not found', 404);
  return jsonOk(student);
}

export async function DELETE(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id } = await params;
  await deleteStudent(id);
  return jsonOk({ success: true });
}

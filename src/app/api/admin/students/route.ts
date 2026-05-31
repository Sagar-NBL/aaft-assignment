import { createStudent, listStudents } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const data = await listStudents({
    page: Number(searchParams.get('page') ?? 1),
    limit: Number(searchParams.get('limit') ?? 10),
    search: searchParams.get('search') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
  });
  return jsonOk(data);
}

export async function POST(request: Request) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const body = await request.json();
  if (!body.name || !body.email) return jsonError('Name and email required');
  const student = await createStudent({ name: body.name, email: body.email });
  return jsonOk(student, 201);
}

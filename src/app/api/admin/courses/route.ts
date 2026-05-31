import { createCourse, listCourses } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const courses = await listCourses();
  return jsonOk({ items: courses });
}

export async function POST(request: Request) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const body = await request.json();
  if (!body.name) return jsonError('Course name required');
  const course = await createCourse(body);
  return jsonOk(course, 201);
}

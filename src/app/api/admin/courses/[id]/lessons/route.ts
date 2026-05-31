import { createLesson, deleteLesson, updateLesson } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id: courseId } = await params;
  const body = await request.json();
  const lesson = await createLesson(courseId, body);
  if (!lesson) return jsonError('Course not found', 404);
  return jsonOk(lesson, 201);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id: courseId } = await params;
  const body = await request.json();
  const { lessonId, ...updates } = body as { lessonId: string };
  const lesson = await updateLesson(courseId, lessonId, updates);
  if (!lesson) return jsonError('Lesson not found', 404);
  return jsonOk(lesson);
}

export async function DELETE(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id: courseId } = await params;
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId');
  if (!lessonId) return jsonError('lessonId required');
  await deleteLesson(courseId, lessonId);
  return jsonOk({ success: true });
}

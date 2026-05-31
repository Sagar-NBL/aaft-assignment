import { getStudentReport } from '@/mocks/db';
import { jsonError, jsonOk, requireAuth } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const { id } = await params;
  const report = await getStudentReport(id);
  if (!report) return jsonError('Student not found', 404);
  return jsonOk(report);
}

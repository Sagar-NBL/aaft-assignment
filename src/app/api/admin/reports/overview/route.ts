import { getAdminOverview } from '@/mocks/db';
import { jsonOk, requireAuth } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const { error } = requireAuth(request, 'admin');
  if (error) return error;
  const data = await getAdminOverview();
  return jsonOk(data);
}

import { exportDbSnapshot, importDbSnapshot } from '@/mocks/db';
import { jsonError, jsonOk } from '@/lib/api-helpers';
import type { MockDbSnapshot } from '@/types/mock-db';

function isDevMockEnabled() {
  return process.env.NODE_ENV !== 'production';
}

export async function GET() {
  if (!isDevMockEnabled()) return jsonError('Not found', 404);
  return jsonOk(exportDbSnapshot());
}

export async function POST(request: Request) {
  if (!isDevMockEnabled()) return jsonError('Not found', 404);
  try {
    const body = (await request.json()) as MockDbSnapshot;
    const ok = importDbSnapshot(body);
    if (!ok) return jsonError('Invalid mock database snapshot', 400);
    return jsonOk({ success: true });
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
}

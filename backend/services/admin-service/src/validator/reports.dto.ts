import { z } from 'zod';

export const reportRangeQueryDto = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export type ReportRangeQueryDto = z.infer<typeof reportRangeQueryDto>;

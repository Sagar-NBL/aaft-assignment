import { z } from 'zod';

export const bulkEnrollDto = z.object({
  studentIds: z.array(z.string().uuid()).min(1, 'studentIds required'),
  courseIds: z.array(z.string().uuid()).min(1, 'courseIds required'),
});
export type BulkEnrollDto = z.infer<typeof bulkEnrollDto>;

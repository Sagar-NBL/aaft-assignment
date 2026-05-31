import { z } from 'zod';

export const progressUpdateDto = z.object({
  videoId: z.string().uuid('Invalid videoId'),
  courseId: z.string().uuid('Invalid courseId'),
  lastWatched: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  duration: z.number().nonnegative(),
  watchedSegments: z.array(z.tuple([z.number(), z.number()])).optional(),
});
export type ProgressUpdateDto = z.infer<typeof progressUpdateDto>;

export const courseIdParamDto = z.object({
  courseId: z.string().uuid('Invalid courseId'),
});

export const courseListQueryDto = z.object({
  search: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'all']).optional().default('all'),
});
export type CourseListQueryDto = z.infer<typeof courseListQueryDto>;

import { z } from 'zod';

export const createLessonDto = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().min(1, 'Description required'),
  videoUrl: z.string().url('Invalid videoUrl'),
  duration: z.number().int().nonnegative().default(0),
});
export type CreateLessonDto = z.infer<typeof createLessonDto>;

export const updateLessonDto = z.object({
  lessonId: z.string().uuid('Invalid lessonId'),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().nonnegative().optional(),
});
export type UpdateLessonDto = z.infer<typeof updateLessonDto>;

export const deleteLessonQueryDto = z.object({
  lessonId: z.string().uuid('Invalid lessonId'),
});
export type DeleteLessonQueryDto = z.infer<typeof deleteLessonQueryDto>;

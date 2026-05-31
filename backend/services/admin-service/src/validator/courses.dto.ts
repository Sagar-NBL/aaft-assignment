import { z } from 'zod';

export const createCourseDto = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().min(1, 'Description required'),
  thumbnail: z.string().url().optional(),
});
export type CreateCourseDto = z.infer<typeof createCourseDto>;

export const updateCourseDto = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  thumbnail: z.string().url().optional(),
});
export type UpdateCourseDto = z.infer<typeof updateCourseDto>;

export const courseIdParamDto = z.object({
  id: z.string().uuid('Invalid id'),
});

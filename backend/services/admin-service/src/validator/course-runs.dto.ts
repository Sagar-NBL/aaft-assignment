import { z } from 'zod';

export const createCourseRunDto = z.object({
  courseId: z.string().uuid(),
  runName: z.string().min(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  enrollmentType: z.enum(['free', 'paid', 'honor']).default('free'),
  price: z.number().nonnegative().optional(),
  passThreshold: z.number().min(0).max(100).default(60),
});
export type CreateCourseRunDto = z.infer<typeof createCourseRunDto>;

export const updateCourseRunDto = z.object({
  runName: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  enrollmentType: z.enum(['free', 'paid', 'honor']).optional(),
  price: z.number().nonnegative().optional(),
  passThreshold: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCourseRunDto = z.infer<typeof updateCourseRunDto>;

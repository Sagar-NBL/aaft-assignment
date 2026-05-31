import { z } from 'zod';

export const listStudentsQueryDto = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  sort: z.enum(['name', 'email']).optional().default('name'),
});
export type ListStudentsQueryDto = z.infer<typeof listStudentsQueryDto>;

export const createStudentDto = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8).optional(),
  avatar: z.string().url().optional(),
});
export type CreateStudentDto = z.infer<typeof createStudentDto>;

export const updateStudentDto = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
});
export type UpdateStudentDto = z.infer<typeof updateStudentDto>;

export const studentIdParamDto = z.object({
  id: z.string().uuid('Invalid id'),
});

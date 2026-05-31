import { z } from 'zod';

export const listUsersQueryDto = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  role: z.enum(['admin', 'instructor', 'student']).optional(),
  search: z.string().optional(),
});
export type ListUsersQueryDto = z.infer<typeof listUsersQueryDto>;

export const createUserDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['admin', 'instructor', 'student']),
  avatar: z.string().url().optional(),
});
export type CreateUserDto = z.infer<typeof createUserDto>;

export const updateUserDto = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'instructor', 'student']).optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserDto = z.infer<typeof updateUserDto>;

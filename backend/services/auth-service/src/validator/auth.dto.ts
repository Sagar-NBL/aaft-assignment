import { z } from 'zod';

export const loginDto = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export type LoginDto = z.infer<typeof loginDto>;

export const registerDto = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name required'),
  role: z.enum(['admin', 'instructor', 'student']).optional().default('student'),
});

export type RegisterDto = z.infer<typeof registerDto>;

export const refreshDto = z.object({
  refreshToken: z.string().min(1, 'refreshToken required'),
});

export type RefreshDto = z.infer<typeof refreshDto>;

export const logoutDto = z.object({
  refreshToken: z.string().min(1, 'refreshToken required'),
});

export type LogoutDto = z.infer<typeof logoutDto>;

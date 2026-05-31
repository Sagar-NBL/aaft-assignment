import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
});

export const courseSchema = z.object({
  name: z.string().min(3, 'Course name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thumbnail: z.union([z.string().url('Must be a valid URL'), z.literal('')]).optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(2, 'Title required'),
  description: z.string().min(5, 'Description required'),
  videoUrl: z.string().url('Valid video URL required'),
  duration: z.coerce.number().min(1, 'Duration must be positive'),
});

export const enrollmentSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Select at least one student'),
  courseIds: z.array(z.string()).min(1, 'Select at least one course'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type StudentFormValues = z.infer<typeof studentSchema>;
export type CourseFormValues = z.infer<typeof courseSchema>;
export type LessonFormValues = z.infer<typeof lessonSchema>;

import { z } from 'zod';

export const selfEnrollDto = z.object({
  courseRunId: z.string().uuid('Invalid courseRunId'),
  paymentRef: z.string().optional(),
});
export type SelfEnrollDto = z.infer<typeof selfEnrollDto>;

export const submitAttemptDto = z.object({
  quizId: z.string().uuid('Invalid quizId'),
  enrollmentId: z.string().uuid('Invalid enrollmentId'),
  // Map of questionId -> selected optionIds
  answers: z.record(z.string().uuid(), z.array(z.string().uuid())),
});
export type SubmitAttemptDto = z.infer<typeof submitAttemptDto>;

export const enrollmentIdParamDto = z.object({
  enrollmentId: z.string().uuid('Invalid enrollmentId'),
});

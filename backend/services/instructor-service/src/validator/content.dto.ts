import { z } from 'zod';
import { UnitType, QuestionType } from '@aaft/db-lib';

export const createSectionDto = z.object({
  title: z.string().min(1),
  order: z.number().int().optional(),
});
export type CreateSectionDto = z.infer<typeof createSectionDto>;

export const createSubsectionDto = z.object({
  title: z.string().min(1),
  order: z.number().int().optional(),
});
export type CreateSubsectionDto = z.infer<typeof createSubsectionDto>;

export const createUnitDto = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(UnitType),
  order: z.number().int().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().nonnegative().optional(),
  textContent: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});
export type CreateUnitDto = z.infer<typeof createUnitDto>;

export const createQuizDto = z.object({
  title: z.string().min(1),
  passPercent: z.number().min(0).max(100).optional().default(60),
  maxAttempts: z.number().int().min(1).optional().default(3),
});
export type CreateQuizDto = z.infer<typeof createQuizDto>;

export const createQuestionDto = z.object({
  text: z.string().min(1),
  type: z.nativeEnum(QuestionType).default(QuestionType.mcq_single),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
      }),
    )
    .min(2, 'A question must have at least two options'),
});
export type CreateQuestionDto = z.infer<typeof createQuestionDto>;

export const idParamDto = z.object({ id: z.string().uuid() });

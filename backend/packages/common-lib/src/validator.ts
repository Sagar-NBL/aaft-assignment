import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UnprocessableEntityException } from './exceptions';

type Target = 'body' | 'query' | 'params';

/**
 * Returns an Express middleware that validates the given request part against
 * the provided Zod schema. On success, the parsed (and possibly transformed)
 * value is assigned back to `req[target]`. On failure, an
 * UnprocessableEntityException is thrown so the global error handler responds
 * with `{ message: ... }`.
 */
export function validate(target: Target, schema: ZodSchema<unknown>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[target]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors
          .map((e) => `${e.path.join('.') || target}: ${e.message}`)
          .join('; ');
        next(new UnprocessableEntityException(message, err.errors));
        return;
      }
      next(err);
    }
  };
}

export const validateBody = (schema: ZodSchema<unknown>) => validate('body', schema);
export const validateQuery = (schema: ZodSchema<unknown>) => validate('query', schema);
export const validateParams = (schema: ZodSchema<unknown>) => validate('params', schema);

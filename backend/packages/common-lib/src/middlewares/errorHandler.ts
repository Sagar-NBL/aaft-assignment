import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { HttpException } from '../exceptions';

/**
 * Global error handler. Serializes every error into `{ message: string }` as
 * required by the frontend contract. Unknown errors → 500. Logs server-side
 * errors with full stack; client errors are logged at debug level.
 */
export function buildErrorHandler(logger: Logger) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = req.requestId;

    if (err instanceof HttpException) {
      if (err.statusCode >= 500) {
        logger.error('HttpException', { requestId, statusCode: err.statusCode, message: err.message, stack: err.stack });
      } else {
        logger.debug('HttpException', { requestId, statusCode: err.statusCode, message: err.message });
      }
      res.status(err.statusCode).json({ message: err.message });
      return;
    }

    // Prisma "unique constraint" violation → 409
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any;
    if (anyErr?.code === 'P2002') {
      logger.debug('Prisma unique-constraint violation', { requestId, target: anyErr.meta?.target });
      const field = Array.isArray(anyErr.meta?.target) ? anyErr.meta.target.join(', ') : 'field';
      res.status(409).json({ message: `Duplicate value for ${field}` });
      return;
    }

    // Prisma "record not found" → 404
    if (anyErr?.code === 'P2025') {
      logger.debug('Prisma record not found', { requestId });
      res.status(404).json({ message: 'Resource not found' });
      return;
    }

    const message = anyErr?.message ?? 'Internal server error';
    logger.error('Unhandled error', { requestId, message, stack: anyErr?.stack });
    res.status(500).json({ message: 'Internal server error' });
  };
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Route not found' });
}

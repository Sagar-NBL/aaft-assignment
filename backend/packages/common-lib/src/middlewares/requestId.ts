import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'x-request-id';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

/**
 * Reads `X-Request-Id` header (set by gateway) or generates a new UUID,
 * attaches it to `req.requestId`, and echoes it back to the client.
 * Useful for log correlation across services.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers[REQUEST_ID_HEADER] as string) || uuidv4();
  req.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}

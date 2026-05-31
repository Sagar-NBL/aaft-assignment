import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException, ForbiddenException } from '../exceptions';

export type Role = 'admin' | 'instructor' | 'student';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export const USER_ID_HEADER = 'x-user-id';
export const USER_ROLE_HEADER = 'x-user-role';
export const USER_EMAIL_HEADER = 'x-user-email';
export const USER_NAME_HEADER = 'x-user-name';

/**
 * Reads gateway-injected user headers and attaches the result to `req.user`.
 *
 * The Nginx + Lua gateway is the SOLE source of these headers — it verifies the
 * JWT and forwards the decoded payload as headers. Services on the internal
 * Docker network trust these headers because the gateway is the only entry point.
 *
 * Use `requireAuth` to enforce presence, and `requireRole(...)` for RBAC.
 */
export function userContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const id = req.headers[USER_ID_HEADER] as string | undefined;
  const role = req.headers[USER_ROLE_HEADER] as Role | undefined;
  const email = req.headers[USER_EMAIL_HEADER] as string | undefined;
  const name = req.headers[USER_NAME_HEADER] as string | undefined;

  if (id && role && email) {
    req.user = { id, email, role, name: name ?? '' };
  }
  next();
}

/**
 * Guard middleware: requires that the gateway authenticated the request.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedException('Authentication required'));
    return;
  }
  next();
}

/**
 * Guard middleware factory: requires the authenticated user has one of the listed roles.
 *
 *     router.get('/admin/foo', requireRole('admin'), handler);
 *     router.post('/manage', requireRole('admin', 'instructor'), handler);
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedException('Authentication required'));
      return;
    }
    if (!allowed.includes(req.user.role)) {
      next(new ForbiddenException(`Requires one of: ${allowed.join(', ')}`));
      return;
    }
    next();
  };
}

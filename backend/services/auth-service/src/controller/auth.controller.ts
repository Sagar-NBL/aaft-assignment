import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { AuthService } from '../service/auth.service';
import type { LoginDto, RegisterDto, RefreshDto, LogoutDto } from '../validator/auth.dto';

/**
 * AuthController — thin HTTP layer. Validation is done in middleware so handlers
 * can trust `req.body` is well-formed. Delegates to AuthService for business logic.
 */
export class AuthController extends Controller {
  constructor(private readonly auth: AuthService) {
    super();
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as LoginDto;
      const result = await this.auth.login(email, password);
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as RegisterDto;
      const result = await this.auth.register(body);
      this.created(res, result);
    } catch (e) {
      next(e);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshDto;
      const result = await this.auth.refresh(refreshToken);
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as LogoutDto;
      await this.auth.logout(refreshToken);
      this.success(res);
    } catch (e) {
      next(e);
    }
  };
}

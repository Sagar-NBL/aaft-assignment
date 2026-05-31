import { Router } from 'express';
import { validateBody } from '@aaft/common-lib';
import { AuthController } from '../controller/auth.controller';
import { loginDto, registerDto, refreshDto, logoutDto } from '../validator/auth.dto';

export function authRouter(controller: AuthController): Router {
  const r = Router();

  r.post('/login',    validateBody(loginDto),    controller.login);
  r.post('/register', validateBody(registerDto), controller.register);
  r.post('/refresh',  validateBody(refreshDto),  controller.refresh);
  r.post('/logout',   validateBody(logoutDto),   controller.logout);

  return r;
}

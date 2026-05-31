import { Service } from '@aaft/common-lib';
import { config } from './config/service.config';
import { UserAuthService } from './service/user-auth.service';
import { RefreshTokenService } from './service/refresh-token.service';
import { AuthService as AuthBusinessService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { authRouter } from './router/auth.router';
import { healthRouter } from './router/health.router';

/**
 * AuthApiService — composes the auth-service runtime.
 *
 * Pattern (matches CLICKFIT): subclass the framework-level `Service` from
 * common-lib and wire dependencies in `initRoutes()`. Constructor injection
 * keeps the wiring explicit and testable.
 */
export class AuthApiService extends Service {
  private readonly users = new UserAuthService();
  private readonly tokens = new RefreshTokenService();
  private readonly business = new AuthBusinessService(this.users, this.tokens);
  private readonly controller = new AuthController(this.business);

  constructor() {
    super({
      name: config.serviceName,
      port: config.port,
      basePath: config.basePath,
    });
  }

  protected initRoutes(): void {
    this.app.use(this.basePath, healthRouter(this.name));
    this.app.use(this.basePath, authRouter(this.controller));
  }
}

import express, { Application, Router, RequestHandler } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import { Logger } from 'winston';
import { buildLogger } from './logger';
import {
  requestIdMiddleware,
  userContextMiddleware,
  buildErrorHandler,
  notFoundHandler,
} from './middlewares';

export interface ServiceOptions {
  /** Logical service name — used in logs and the X-Service header. */
  name: string;
  /** Port to listen on. */
  port: number;
  /**
   * Base path that the router is mounted under. Example: '/api/admin'.
   * The Nginx gateway rewrites public URLs to forward the full path so each
   * service mounts at its own segment.
   */
  basePath?: string;
}

/**
 * Base Service class. All AAFT backend services extend this to inherit a
 * consistent middleware stack:
 *
 *   1. helmet           (basic security headers)
 *   2. body parser      (JSON)
 *   3. requestId        (X-Request-Id propagation)
 *   4. userContext      (X-User-* headers → req.user)
 *   5. <child routes>   (via initRoutes())
 *   6. 404 handler
 *   7. error handler    (uniform { message } JSON)
 *
 * The subclass implements `initRoutes()` to mount its domain routers and
 * `start()` to listen. The base class wires the lifecycle.
 *
 * Single Responsibility: this class owns the HTTP server lifecycle and
 * cross-cutting middleware. It is intentionally agnostic of any domain logic.
 */
export abstract class Service {
  public readonly name: string;
  public readonly port: number;
  public readonly basePath: string;
  public readonly app: Application;
  public readonly logger: Logger;

  constructor(opts: ServiceOptions) {
    this.name = opts.name;
    this.port = opts.port;
    this.basePath = opts.basePath ?? '/';
    this.app = express();
    this.logger = buildLogger(opts.name);

    this.applyPreMiddleware();
  }

  // ----------------------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------------------

  private applyPreMiddleware(): void {
    this.app.disable('x-powered-by');
    this.app.use(helmet({ contentSecurityPolicy: false }));
    this.app.use(bodyParser.json({ limit: '5mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(requestIdMiddleware);
    this.app.use(userContextMiddleware);

    // Identify which service handled the request — useful when debugging the
    // gateway routing.
    this.app.use((_req, res, next) => {
      res.setHeader('x-service', this.name);
      next();
    });
  }

  private applyPostMiddleware(): void {
    this.app.use(notFoundHandler);
    this.app.use(buildErrorHandler(this.logger));
  }

  /**
   * Subclass mounts its routers here. Called automatically after construction
   * by `start()`.
   */
  protected abstract initRoutes(): void;

  /** Convenience helper for subclasses to mount a router under basePath. */
  protected mount(path: string, router: Router): void {
    const full = this.basePath === '/' ? path : `${this.basePath}${path}`;
    this.app.use(full, router);
  }

  /** Convenience to register a single handler at a path (e.g. health checks). */
  protected route(method: 'get' | 'post' | 'patch' | 'delete', path: string, ...handlers: RequestHandler[]): void {
    const full = this.basePath === '/' ? path : `${this.basePath}${path}`;
    this.app[method](full, ...handlers);
  }

  /**
   * Boot the HTTP server.
   */
  async start(): Promise<void> {
    this.initRoutes();
    this.applyPostMiddleware();

    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.port, '0.0.0.0', () => {
        this.logger.info(`Service "${this.name}" listening on :${this.port} (basePath=${this.basePath})`);
        resolve();
      });
      server.on('error', (err) => {
        this.logger.error(`Service "${this.name}" failed to start`, { error: err.message });
        reject(err);
      });

      const shutdown = (signal: string) => {
        this.logger.info(`Received ${signal}, shutting down "${this.name}"...`);
        server.close(() => process.exit(0));
      };
      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
    });
  }
}

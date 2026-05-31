import { Service } from '@aaft/common-lib';
import { config } from './config/service.config';
import { CertificatesService } from './service/certificates.service';
import { CertificatesController } from './controller/certificates.controller';
import { publicRouter } from './router/router';
import { healthRouter } from './router/health.router';

/**
 * PublicApiService — anonymous endpoints (currently just certificate verify).
 *
 * No RBAC enforcement here: this service intentionally accepts unauthenticated
 * traffic because the gateway never attaches role guards to /api/certificates/*.
 */
export class PublicApiService extends Service {
  private readonly certificatesSvc = new CertificatesService();
  private readonly certificatesCtrl = new CertificatesController(this.certificatesSvc);

  constructor() {
    super({ name: config.serviceName, port: config.port, basePath: config.basePath });
  }

  protected initRoutes(): void {
    this.app.use(this.basePath, healthRouter(this.name));
    this.app.use(this.basePath, publicRouter(this.certificatesCtrl));
  }
}

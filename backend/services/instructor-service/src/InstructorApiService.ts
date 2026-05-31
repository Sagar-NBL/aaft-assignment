import { Service, requireRole } from '@aaft/common-lib';
import { config } from './config/service.config';
import { ContentService } from './service/content.service';
import { ContentController } from './controller/content.controller';
import { instructorRouter } from './router/router';
import { healthRouter } from './router/health.router';

export class InstructorApiService extends Service {
  private readonly contentSvc = new ContentService();
  private readonly contentCtrl = new ContentController(this.contentSvc);

  constructor() {
    super({ name: config.serviceName, port: config.port, basePath: config.basePath });
  }

  protected initRoutes(): void {
    this.app.use(this.basePath, healthRouter(this.name));
    this.app.use(this.basePath, requireRole('instructor'));
    this.app.use(this.basePath, instructorRouter(this.contentCtrl));
  }
}

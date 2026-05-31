import { Service, requireRole } from '@aaft/common-lib';
import { config } from './config/service.config';

import { EnrollmentLookupService }   from './service/enrollment-lookup.service';
import { StudentCoursesService }     from './service/courses.service';
import { ProgressService }           from './service/progress.service';
import { DashboardService }          from './service/dashboard.service';
import { EnrollmentsWriteService }   from './service/enrollments-write.service';
import { GradesService }             from './service/grades.service';
import { AttemptsService }           from './service/attempts.service';
import { StudentCertificatesService } from './service/certificates.service';

import { CoursesController }     from './controller/courses.controller';
import { ProgressController }    from './controller/progress.controller';
import { DashboardController }   from './controller/dashboard.controller';
import { EnrollmentsController } from './controller/enrollments.controller';
import {
  AttemptsController,
  GradesController,
  CertificatesController,
} from './controller/attempts.controller';

import { studentRouter }   from './router/router';
import { studentBRouter }  from './router/student-b.router';
import { healthRouter }    from './router/health.router';

/**
 * StudentApiService — composes the /api/student/* runtime.
 *
 * Two router groups:
 *   - studentRouter   (Part A): courses, progress, dashboard
 *   - studentBRouter  (Part B): self-enroll, attempts, grades, certificates
 *
 * Shared EnrollmentLookupService keeps the "is the caller enrolled?" check
 * in one place (DRY) across every domain service.
 */
export class StudentApiService extends Service {
  // Shared deps
  private readonly lookup         = new EnrollmentLookupService();
  private readonly gradesSvc      = new GradesService();

  // Part A
  private readonly coursesSvc     = new StudentCoursesService(this.lookup);
  private readonly progressSvc    = new ProgressService(this.lookup);
  private readonly dashboardSvc   = new DashboardService(this.lookup);

  // Part B
  private readonly enrollWriteSvc  = new EnrollmentsWriteService();
  private readonly attemptsSvc     = new AttemptsService(this.gradesSvc);
  private readonly certsSvc        = new StudentCertificatesService();

  // Controllers
  private readonly coursesCtrl     = new CoursesController(this.coursesSvc);
  private readonly progressCtrl    = new ProgressController(this.progressSvc);
  private readonly dashboardCtrl   = new DashboardController(this.dashboardSvc);
  private readonly enrollmentsCtrl = new EnrollmentsController(this.enrollWriteSvc);
  private readonly attemptsCtrl    = new AttemptsController(this.attemptsSvc);
  private readonly gradesCtrl      = new GradesController(this.gradesSvc);
  private readonly certsCtrl       = new CertificatesController(this.certsSvc);

  constructor() {
    super({ name: config.serviceName, port: config.port, basePath: config.basePath });
  }

  protected initRoutes(): void {
    this.app.use(this.basePath, healthRouter(this.name));
    this.app.use(this.basePath, requireRole('student'));

    this.app.use(
      this.basePath,
      studentRouter(this.coursesCtrl, this.progressCtrl, this.dashboardCtrl),
    );
    this.app.use(
      this.basePath,
      studentBRouter(
        this.enrollmentsCtrl,
        this.attemptsCtrl,
        this.gradesCtrl,
        this.certsCtrl,
      ),
    );
  }
}

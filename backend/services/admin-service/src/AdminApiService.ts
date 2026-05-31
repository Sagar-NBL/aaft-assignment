import { Service, requireRole } from '@aaft/common-lib';
import { config } from './config/service.config';

// Services (extending BaseService where applicable)
import { StudentsService }        from './service/students.service';
import { CoursesService }         from './service/courses.service';
import { LessonsService }         from './service/lessons.service';
import { EnrollmentsService }     from './service/enrollments.service';
import { ReportsService }         from './service/reports.service';
import { UsersService }           from './service/users.service';
import { CourseRunsService }      from './service/course-runs.service';
import { CourseLifecycleService } from './service/course-lifecycle.service';

// Controllers
import { StudentsController }    from './controller/students.controller';
import { CoursesController }     from './controller/courses.controller';
import { LessonsController }     from './controller/lessons.controller';
import { EnrollmentsController } from './controller/enrollments.controller';
import { ReportsController }     from './controller/reports.controller';
import { UsersController }       from './controller/users.controller';
import { CourseRunsController }  from './controller/course-runs.controller';

// Routers
import { studentsRouter }    from './router/students.router';
import { coursesRouter }     from './router/courses.router';
import { enrollmentsRouter } from './router/enrollments.router';
import { reportsRouter }     from './router/reports.router';
import { usersRouter }       from './router/users.router';
import { courseRunsRouter }  from './router/course-runs.router';
import { healthRouter }      from './router/health.router';

/**
 * AdminApiService — composes the admin runtime.
 *
 * Dependency wiring in one place (constructor) keeps SRP intact: each domain
 * service owns its data, controllers own HTTP, this class owns assembly.
 */
export class AdminApiService extends Service {
  // Domain services
  private readonly studentsSvc    = new StudentsService();
  private readonly coursesSvc     = new CoursesService();
  private readonly lessonsSvc     = new LessonsService(this.coursesSvc);
  private readonly enrollmentsSvc = new EnrollmentsService();
  private readonly reportsSvc     = new ReportsService();
  private readonly usersSvc       = new UsersService();
  private readonly courseRunsSvc  = new CourseRunsService();
  private readonly lifecycleSvc   = new CourseLifecycleService();

  // Controllers
  private readonly studentsCtrl    = new StudentsController(this.studentsSvc);
  private readonly coursesCtrl     = new CoursesController(this.coursesSvc);
  private readonly lessonsCtrl     = new LessonsController(this.lessonsSvc);
  private readonly enrollmentsCtrl = new EnrollmentsController(this.enrollmentsSvc);
  private readonly reportsCtrl     = new ReportsController(this.reportsSvc);
  private readonly usersCtrl       = new UsersController(this.usersSvc);
  private readonly courseRunsCtrl  = new CourseRunsController(this.courseRunsSvc, this.lifecycleSvc);

  constructor() {
    super({ name: config.serviceName, port: config.port, basePath: config.basePath });
  }

  protected initRoutes(): void {
    // Health stays unauthenticated for docker health-checks.
    this.app.use(this.basePath, healthRouter(this.name));

    // Belt-and-suspenders RBAC: gateway already enforces role=admin via lua,
    // but services also reject non-admin callers if reached directly.
    this.app.use(this.basePath, requireRole('admin'));

    this.app.use(this.basePath, studentsRouter(this.studentsCtrl));
    this.app.use(this.basePath, coursesRouter(this.coursesCtrl, this.lessonsCtrl));
    this.app.use(this.basePath, enrollmentsRouter(this.enrollmentsCtrl));
    this.app.use(this.basePath, reportsRouter(this.reportsCtrl));
    this.app.use(this.basePath, usersRouter(this.usersCtrl));
    this.app.use(this.basePath, courseRunsRouter(this.courseRunsCtrl));
  }
}

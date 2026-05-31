import { Router } from 'express';
import { validateBody, validateQuery, validateParams } from '@aaft/common-lib';
import { CoursesController } from '../controller/courses.controller';
import { ProgressController } from '../controller/progress.controller';
import { DashboardController } from '../controller/dashboard.controller';
import {
  progressUpdateDto,
  courseIdParamDto,
  courseListQueryDto,
} from '../validator/progress.dto';

export function studentRouter(
  courses: CoursesController,
  progress: ProgressController,
  dashboard: DashboardController,
): Router {
  const r = Router();

  // Courses
  r.get('/courses',     validateQuery(courseListQueryDto), courses.list);
  r.get('/courses/:id', courses.detail);

  // Progress
  r.post('/progress',             validateBody(progressUpdateDto),  progress.update);
  r.get('/progress/:courseId',    validateParams(courseIdParamDto), courses.courseProgress);

  // Dashboard
  r.get('/dashboard', dashboard.stats);

  return r;
}

import { Router } from 'express';
import { validateBody, validateParams } from '@aaft/common-lib';
import { CourseRunsController } from '../controller/course-runs.controller';
import { createCourseRunDto, updateCourseRunDto } from '../validator/course-runs.dto';
import { courseIdParamDto } from '../validator/courses.dto';

export function courseRunsRouter(c: CourseRunsController): Router {
  const r = Router();

  // Course lifecycle (publish/archive)
  r.patch('/courses/:id/publish', validateParams(courseIdParamDto), c.publish);
  r.patch('/courses/:id/archive', validateParams(courseIdParamDto), c.archive);

  // Course runs
  r.get('/course-runs',           c.list);
  r.post('/course-runs',          validateBody(createCourseRunDto), c.create);
  r.patch('/course-runs/:id',     validateParams(courseIdParamDto), validateBody(updateCourseRunDto), c.update);
  r.delete('/course-runs/:id',    validateParams(courseIdParamDto), c.remove);
  r.post('/course-runs/:id/clone', validateParams(courseIdParamDto), c.clone);

  return r;
}

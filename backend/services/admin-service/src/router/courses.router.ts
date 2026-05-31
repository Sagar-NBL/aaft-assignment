import { Router } from 'express';
import { validateBody, validateParams } from '@aaft/common-lib';
import { CoursesController } from '../controller/courses.controller';
import { LessonsController } from '../controller/lessons.controller';
import { createCourseDto, updateCourseDto, courseIdParamDto } from '../validator/courses.dto';
import { createLessonDto, updateLessonDto } from '../validator/lessons.dto';

export function coursesRouter(
  coursesCtrl: CoursesController,
  lessonsCtrl: LessonsController,
): Router {
  const r = Router();

  // Courses
  r.get('/courses',         coursesCtrl.list);
  r.post('/courses',        validateBody(createCourseDto), coursesCtrl.create);
  r.patch('/courses/:id',   validateParams(courseIdParamDto), validateBody(updateCourseDto), coursesCtrl.update);
  r.delete('/courses/:id',  validateParams(courseIdParamDto), coursesCtrl.remove);

  // Lessons (nested)
  r.post('/courses/:id/lessons',   validateParams(courseIdParamDto), validateBody(createLessonDto), lessonsCtrl.create);
  r.patch('/courses/:id/lessons',  validateParams(courseIdParamDto), validateBody(updateLessonDto), lessonsCtrl.update);
  r.delete('/courses/:id/lessons', validateParams(courseIdParamDto), lessonsCtrl.remove);

  return r;
}

import { Router } from 'express';
import { validateBody, validateParams } from '@aaft/common-lib';
import { ContentController } from '../controller/content.controller';
import {
  createSectionDto,
  createSubsectionDto,
  createUnitDto,
  createQuizDto,
  createQuestionDto,
  idParamDto,
} from '../validator/content.dto';

export function instructorRouter(c: ContentController): Router {
  const r = Router();

  r.get('/courses',                              c.listOwn);

  r.post('/courses/:id/sections',                validateParams(idParamDto), validateBody(createSectionDto),    c.createSection);
  r.post('/sections/:id/subsections',            validateParams(idParamDto), validateBody(createSubsectionDto), c.createSubsection);
  r.post('/subsections/:id/units',               validateParams(idParamDto), validateBody(createUnitDto),       c.createUnit);
  r.post('/units/:id/quiz',                      validateParams(idParamDto), validateBody(createQuizDto),       c.createQuiz);
  r.post('/quizzes/:id/questions',               validateParams(idParamDto), validateBody(createQuestionDto),   c.createQuestion);
  r.get('/course-runs/:id/progress',             validateParams(idParamDto), c.runProgress);

  return r;
}

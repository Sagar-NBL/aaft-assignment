import { Router } from 'express';
import { validateBody, validateQuery, validateParams } from '@aaft/common-lib';
import { StudentsController } from '../controller/students.controller';
import {
  createStudentDto,
  updateStudentDto,
  listStudentsQueryDto,
  studentIdParamDto,
} from '../validator/students.dto';

export function studentsRouter(controller: StudentsController): Router {
  const r = Router();
  r.get('/students',         validateQuery(listStudentsQueryDto),     controller.list);
  r.post('/students',        validateBody(createStudentDto),          controller.create);
  r.get('/students/:id',     validateParams(studentIdParamDto),        controller.getOne);
  r.patch('/students/:id',   validateParams(studentIdParamDto), validateBody(updateStudentDto), controller.update);
  r.delete('/students/:id',  validateParams(studentIdParamDto),        controller.remove);
  return r;
}

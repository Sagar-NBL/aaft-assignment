import { Router } from 'express';
import { validateBody, validateQuery, validateParams } from '@aaft/common-lib';
import { UsersController } from '../controller/users.controller';
import {
  listUsersQueryDto,
  createUserDto,
  updateUserDto,
} from '../validator/users.dto';
import { courseIdParamDto } from '../validator/courses.dto';

export function usersRouter(c: UsersController): Router {
  const r = Router();
  r.get('/users',         validateQuery(listUsersQueryDto), c.list);
  r.post('/users',        validateBody(createUserDto),       c.create);
  r.get('/users/:id',     validateParams(courseIdParamDto),  c.getOne);
  r.patch('/users/:id',   validateParams(courseIdParamDto),  validateBody(updateUserDto), c.update);
  r.delete('/users/:id',  validateParams(courseIdParamDto),  c.remove);
  return r;
}

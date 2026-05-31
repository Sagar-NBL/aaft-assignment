import { Router } from 'express';
import { validateBody } from '@aaft/common-lib';
import { EnrollmentsController } from '../controller/enrollments.controller';
import { bulkEnrollDto } from '../validator/enrollments.dto';

export function enrollmentsRouter(controller: EnrollmentsController): Router {
  const r = Router();
  r.get('/enrollments',  controller.list);
  r.post('/enrollments', validateBody(bulkEnrollDto), controller.bulk);
  return r;
}

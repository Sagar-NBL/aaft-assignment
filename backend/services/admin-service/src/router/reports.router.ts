import { Router } from 'express';
import { validateQuery } from '@aaft/common-lib';
import { ReportsController } from '../controller/reports.controller';
import { reportRangeQueryDto } from '../validator/reports.dto';

export function reportsRouter(controller: ReportsController): Router {
  const r = Router();

  // Part A
  r.get('/reports/overview',     controller.overview);
  r.get('/reports/students/:id', controller.student);

  // Part B Module 10 (date range + pagination)
  r.get('/reports/progress',     validateQuery(reportRangeQueryDto), controller.progress);
  r.get('/reports/completions',  validateQuery(reportRangeQueryDto), controller.completions);
  r.get('/reports/time-spent',   validateQuery(reportRangeQueryDto), controller.timeSpent);

  return r;
}

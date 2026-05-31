import { Router } from 'express';
import { validateBody, validateParams } from '@aaft/common-lib';
import { EnrollmentsController } from '../controller/enrollments.controller';
import {
  AttemptsController,
  GradesController,
  CertificatesController,
} from '../controller/attempts.controller';
import {
  selfEnrollDto,
  submitAttemptDto,
  enrollmentIdParamDto,
} from '../validator/student-b.dto';

export function studentBRouter(
  enrollments: EnrollmentsController,
  attempts: AttemptsController,
  grades: GradesController,
  certificates: CertificatesController,
): Router {
  const r = Router();

  // Enrollments
  r.post('/enroll',              validateBody(selfEnrollDto), enrollments.enroll);
  r.get('/enrollments',          enrollments.list);
  r.get('/enrollments/:id/content', enrollments.content);
  r.delete('/enrollments/:id',   enrollments.unenroll);

  // Quiz attempts (server-side scoring)
  r.post('/attempts', validateBody(submitAttemptDto), attempts.submit);

  // Grades
  r.get('/grades/:enrollmentId', validateParams(enrollmentIdParamDto), grades.getOne);

  // Certificates (own)
  r.get('/certificates', certificates.list);

  return r;
}

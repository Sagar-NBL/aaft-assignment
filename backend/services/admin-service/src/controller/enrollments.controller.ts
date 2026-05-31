import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { EnrollmentsService } from '../service/enrollments.service';
import type { BulkEnrollDto } from '../validator/enrollments.dto';

export class EnrollmentsController extends Controller {
  constructor(private readonly enrollments: EnrollmentsService) {
    super();
  }

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.enrollments.listEnrollments();
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };

  bulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.enrollments.bulkEnroll(req.body as BulkEnrollDto);
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };
}

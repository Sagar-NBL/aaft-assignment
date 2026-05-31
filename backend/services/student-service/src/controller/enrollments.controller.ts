import { Request, Response, NextFunction } from 'express';
import { Controller, UnauthorizedException } from '@aaft/common-lib';
import { EnrollmentsWriteService } from '../service/enrollments-write.service';
import type { SelfEnrollDto } from '../validator/student-b.dto';

export class EnrollmentsController extends Controller {
  constructor(private readonly enrollments: EnrollmentsWriteService) {
    super();
  }

  private studentId(req: Request): string {
    if (!req.user) throw new UnauthorizedException('Authentication required');
    return req.user.id;
  }

  enroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as SelfEnrollDto;
      const dto = await this.enrollments.selfEnroll(this.studentId(req), body.courseRunId, body.paymentRef);
      this.created(res, dto);
    } catch (e) {
      next(e);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.enrollments.listOwnEnrollments(this.studentId(req));
      this.ok(res, { items });
    } catch (e) {
      next(e);
    }
  };

  content = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.enrollments.enrollmentContent(this.studentId(req), req.params.id);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  unenroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.enrollments.unenroll(this.studentId(req), req.params.id);
      this.success(res);
    } catch (e) {
      next(e);
    }
  };
}

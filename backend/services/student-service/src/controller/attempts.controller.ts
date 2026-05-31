import { Request, Response, NextFunction } from 'express';
import { Controller, UnauthorizedException } from '@aaft/common-lib';
import { AttemptsService } from '../service/attempts.service';
import { GradesService } from '../service/grades.service';
import { StudentCertificatesService } from '../service/certificates.service';
import type { SubmitAttemptDto } from '../validator/student-b.dto';

export class AttemptsController extends Controller {
  constructor(private readonly attempts: AttemptsService) {
    super();
  }

  private studentId(req: Request): string {
    if (!req.user) throw new UnauthorizedException('Authentication required');
    return req.user.id;
  }

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as SubmitAttemptDto;
      const dto = await this.attempts.submit({
        studentId: this.studentId(req),
        enrollmentId: body.enrollmentId,
        quizId: body.quizId,
        answers: body.answers,
      });
      this.created(res, dto);
    } catch (e) {
      next(e);
    }
  };
}

export class GradesController extends Controller {
  constructor(private readonly grades: GradesService) {
    super();
  }

  private studentId(req: Request): string {
    if (!req.user) throw new UnauthorizedException('Authentication required');
    return req.user.id;
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.grades.getForStudent(this.studentId(req), req.params.enrollmentId);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };
}

export class CertificatesController extends Controller {
  constructor(private readonly certificates: StudentCertificatesService) {
    super();
  }

  private studentId(req: Request): string {
    if (!req.user) throw new UnauthorizedException('Authentication required');
    return req.user.id;
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.certificates.listForStudent(this.studentId(req));
      this.ok(res, { items });
    } catch (e) {
      next(e);
    }
  };
}

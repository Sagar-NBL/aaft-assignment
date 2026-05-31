import { Request, Response, NextFunction } from 'express';
import { Controller, UnauthorizedException } from '@aaft/common-lib';
import { StudentCoursesService } from '../service/courses.service';
import type { CourseListQueryDto } from '../validator/progress.dto';

export class CoursesController extends Controller {
  constructor(private readonly courses: StudentCoursesService) {
    super();
  }

  private studentId(req: Request): string {
    if (!req.user) throw new UnauthorizedException('Authentication required');
    return req.user.id;
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as unknown as CourseListQueryDto;
      const result = await this.courses.listForStudent(this.studentId(req), q);
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const detail = await this.courses.getCourseDetail(this.studentId(req), req.params.id);
      this.ok(res, detail);
    } catch (e) {
      next(e);
    }
  };

  courseProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.courses.courseProgress(this.studentId(req), req.params.courseId);
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };
}

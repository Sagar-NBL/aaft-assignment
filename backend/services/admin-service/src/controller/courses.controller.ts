import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { CoursesService } from '../service/courses.service';
import type { CreateCourseDto, UpdateCourseDto } from '../validator/courses.dto';

export class CoursesController extends Controller {
  constructor(private readonly courses: CoursesService) {
    super();
  }

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.courses.listCourses();
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.courses.createCourse(req.body as CreateCourseDto);
      this.created(res, dto);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.courses.updateCourse(req.params.id, req.body as UpdateCourseDto);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.courses.deleteCourse(req.params.id);
      this.success(res);
    } catch (e) {
      next(e);
    }
  };
}

import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { CourseRunsService } from '../service/course-runs.service';
import { CourseLifecycleService } from '../service/course-lifecycle.service';
import type { CreateCourseRunDto, UpdateCourseRunDto } from '../validator/course-runs.dto';
import { CourseStatus } from '@aaft/db-lib';

export class CourseRunsController extends Controller {
  constructor(
    private readonly runs: CourseRunsService,
    private readonly lifecycle: CourseLifecycleService,
  ) {
    super();
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
      const items = await this.runs.listRuns(courseId);
      this.ok(res, { items });
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.runs.createRun(req.body as CreateCourseRunDto);
      this.created(res, dto);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.runs.updateRun(req.params.id, req.body as UpdateCourseRunDto);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.runs.deleteRun(req.params.id);
      this.success(res);
    } catch (e) {
      next(e);
    }
  };

  clone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.runs.cloneRun(req.params.id, req.body?.runName);
      this.created(res, dto);
    } catch (e) {
      next(e);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.lifecycle.transition(req.params.id, CourseStatus.published);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.lifecycle.transition(req.params.id, CourseStatus.archived);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };
}

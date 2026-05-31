import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { LessonsService } from '../service/lessons.service';
import type {
  CreateLessonDto,
  UpdateLessonDto,
  DeleteLessonQueryDto,
} from '../validator/lessons.dto';

export class LessonsController extends Controller {
  constructor(private readonly lessons: LessonsService) {
    super();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.lessons.createLesson(req.params.id, req.body as CreateLessonDto);
      this.created(res, dto);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as UpdateLessonDto;
      const { lessonId, ...updates } = body;
      const dto = await this.lessons.updateLesson(req.params.id, lessonId, updates);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lessonId } = req.query as unknown as DeleteLessonQueryDto;
      await this.lessons.deleteLesson(req.params.id, lessonId);
      this.success(res);
    } catch (e) {
      next(e);
    }
  };
}

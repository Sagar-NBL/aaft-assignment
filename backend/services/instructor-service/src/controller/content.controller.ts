import { Request, Response, NextFunction } from 'express';
import { Controller, UnauthorizedException } from '@aaft/common-lib';
import { ContentService } from '../service/content.service';
import type {
  CreateSectionDto,
  CreateSubsectionDto,
  CreateUnitDto,
  CreateQuizDto,
  CreateQuestionDto,
} from '../validator/content.dto';

export class ContentController extends Controller {
  constructor(private readonly content: ContentService) {
    super();
  }

  private instructorId(req: Request): string {
    if (!req.user) throw new UnauthorizedException('Authentication required');
    return req.user.id;
  }

  createSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.content.createSection(
        this.instructorId(req),
        req.params.id,
        req.body as CreateSectionDto,
      );
      this.created(res, created);
    } catch (e) {
      next(e);
    }
  };

  createSubsection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.content.createSubsection(
        this.instructorId(req),
        req.params.id,
        req.body as CreateSubsectionDto,
      );
      this.created(res, created);
    } catch (e) {
      next(e);
    }
  };

  createUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.content.createUnit(
        this.instructorId(req),
        req.params.id,
        req.body as CreateUnitDto,
      );
      this.created(res, created);
    } catch (e) {
      next(e);
    }
  };

  createQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.content.createQuiz(
        this.instructorId(req),
        req.params.id,
        req.body as CreateQuizDto,
      );
      this.created(res, created);
    } catch (e) {
      next(e);
    }
  };

  createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.content.createQuestion(
        this.instructorId(req),
        req.params.id,
        req.body as CreateQuestionDto,
      );
      this.created(res, created);
    } catch (e) {
      next(e);
    }
  };

  listOwn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.content.listOwnCourses(this.instructorId(req));
      this.ok(res, { items });
    } catch (e) {
      next(e);
    }
  };

  runProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.content.courseRunProgress(this.instructorId(req), req.params.id);
      this.ok(res, { items });
    } catch (e) {
      next(e);
    }
  };
}

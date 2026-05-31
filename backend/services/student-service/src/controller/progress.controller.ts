import { Request, Response, NextFunction } from 'express';
import { Controller, UnauthorizedException } from '@aaft/common-lib';
import { ProgressService } from '../service/progress.service';
import type { ProgressUpdateDto } from '../validator/progress.dto';

export class ProgressController extends Controller {
  constructor(private readonly progress: ProgressService) {
    super();
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedException('Authentication required');
      const body = req.body as ProgressUpdateDto;
      const result = await this.progress.upsert({
        studentId: req.user.id,
        videoId: body.videoId,
        courseId: body.courseId,
        lastWatched: body.lastWatched,
        percentage: body.percentage,
        duration: body.duration,
        watchedSegments: body.watchedSegments,
      });
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };
}

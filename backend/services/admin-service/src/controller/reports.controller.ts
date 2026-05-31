import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { ReportsService } from '../service/reports.service';

export class ReportsController extends Controller {
  constructor(private readonly reports: ReportsService) {
    super();
  }

  overview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.reports.overview();
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  student = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.reports.studentReport(req.params.id);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  progress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as unknown as { from?: Date; to?: Date; page: number; limit: number };
      const result = await this.reports.progressReport(q);
      this.paginated(res, result);
    } catch (e) {
      next(e);
    }
  };

  completions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as unknown as { from?: Date; to?: Date; page: number; limit: number };
      const result = await this.reports.completionsReport(q);
      this.paginated(res, result);
    } catch (e) {
      next(e);
    }
  };

  timeSpent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as unknown as { from?: Date; to?: Date; page: number; limit: number };
      const result = await this.reports.timeSpentReport(q);
      this.paginated(res, result);
    } catch (e) {
      next(e);
    }
  };
}

import { Request, Response, NextFunction } from 'express';
import { Controller, UnauthorizedException } from '@aaft/common-lib';
import { DashboardService } from '../service/dashboard.service';

export class DashboardController extends Controller {
  constructor(private readonly dashboard: DashboardService) {
    super();
  }

  stats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedException('Authentication required');
      const result = await this.dashboard.stats(req.user.id);
      this.ok(res, result);
    } catch (e) {
      next(e);
    }
  };
}

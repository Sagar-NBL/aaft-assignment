import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { CertificatesService } from '../service/certificates.service';

export class CertificatesController extends Controller {
  constructor(private readonly certificates: CertificatesService) {
    super();
  }

  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.certificates.verify(req.params.code);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };
}

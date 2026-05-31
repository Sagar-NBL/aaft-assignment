import { Router } from 'express';
import { CertificatesController } from '../controller/certificates.controller';

export function publicRouter(controller: CertificatesController): Router {
  const r = Router();
  r.get('/:code', controller.verify);
  return r;
}

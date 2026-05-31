import { Router } from 'express';

export function healthRouter(serviceName: string): Router {
  const r = Router();
  r.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: serviceName, timestamp: new Date().toISOString() });
  });
  return r;
}

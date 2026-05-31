import { AdminApiService } from './AdminApiService';

const service = new AdminApiService();
service.start().catch((err: Error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: admin-service failed to start', err);
  process.exit(1);
});

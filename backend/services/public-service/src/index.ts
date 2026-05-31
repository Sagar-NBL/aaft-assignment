import { PublicApiService } from './PublicApiService';

const service = new PublicApiService();
service.start().catch((err: Error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: public-service failed to start', err);
  process.exit(1);
});

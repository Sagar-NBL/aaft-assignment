import { AuthApiService } from './AuthService';

const service = new AuthApiService();
service.start().catch((err: Error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: auth-service failed to start', err);
  process.exit(1);
});

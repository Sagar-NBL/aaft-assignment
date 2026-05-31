import { StudentApiService } from './StudentApiService';

const service = new StudentApiService();
service.start().catch((err: Error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: student-service failed to start', err);
  process.exit(1);
});

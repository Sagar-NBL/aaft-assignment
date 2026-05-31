import { InstructorApiService } from './InstructorApiService';

const service = new InstructorApiService();
service.start().catch((err: Error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: instructor-service failed to start', err);
  process.exit(1);
});

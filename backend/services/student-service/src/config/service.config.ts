export const config = {
  serviceName: 'student-service',
  basePath: '/api/student',
  port: parseInt(process.env.PORT ?? process.env.STUDENT_SERVICE_PORT ?? '4004', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // 90% threshold is the global business rule for a lesson being "complete".
  completionThreshold: 90,
} as const;

export type AppConfig = typeof config;

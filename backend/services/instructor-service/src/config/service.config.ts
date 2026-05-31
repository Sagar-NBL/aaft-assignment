export const config = {
  serviceName: 'instructor-service',
  basePath: '/api/instructor',
  port: parseInt(process.env.PORT ?? process.env.INSTRUCTOR_SERVICE_PORT ?? '4003', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;

export type AppConfig = typeof config;

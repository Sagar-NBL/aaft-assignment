export const config = {
  serviceName: 'admin-service',
  basePath: '/api/admin',
  port: parseInt(process.env.PORT ?? process.env.ADMIN_SERVICE_PORT ?? '4002', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Default password used when an admin creates a student via the Part A endpoint
  // (which doesn't accept a password). In production this would trigger an email invite.
  defaultStudentPassword: process.env.DEFAULT_STUDENT_PASSWORD ?? 'Welcome@AAFT123',
} as const;

export type AppConfig = typeof config;

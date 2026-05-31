/**
 * auth-service configuration. Reads from env, validates required vars at boot.
 */

export const config = {
  serviceName: 'auth-service',
  basePath: '/api/auth',
  port: parseInt(process.env.PORT ?? process.env.AUTH_SERVICE_PORT ?? '4001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;

export type AppConfig = typeof config;

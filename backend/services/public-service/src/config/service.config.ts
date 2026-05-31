export const config = {
  serviceName: 'public-service',
  basePath: '/api/certificates',
  port: parseInt(process.env.PORT ?? process.env.PUBLIC_SERVICE_PORT ?? '4005', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;

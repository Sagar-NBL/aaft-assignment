import { createLogger, format, transports, Logger } from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = format;

const consoleFormat = printf(({ level, message, timestamp: ts, service, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const svc = service ? `[${service}]` : '';
  return `${ts} ${level} ${svc} ${message}${metaStr}`;
});

export function buildLogger(serviceName: string): Logger {
  const isProd = process.env.NODE_ENV === 'production';

  return createLogger({
    level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
    defaultMeta: { service: serviceName },
    format: combine(
      errors({ stack: true }),
      timestamp(),
      isProd ? json() : combine(colorize(), consoleFormat),
    ),
    transports: [new transports.Console()],
  });
}

// Default fallback logger (used in places where service name isn't known yet)
export const logger = buildLogger('common-lib');

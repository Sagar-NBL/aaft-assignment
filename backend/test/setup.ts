/**
 * Global Jest setup. Runs once before every test file.
 *
 * - Sets env vars the services expect (JWT secrets, bcrypt rounds, etc.)
 *   so we don't have to repeat them in each test file.
 * - Silences the winston logger so test output stays clean. We don't need
 *   logs for unit assertions; integration tests can re-enable.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-access-secret-please-do-not-use-in-prod';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-please-do-not-use-in-prod';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.JWT_ISSUER = 'aaft-lms-test';
// Lower rounds so bcrypt is fast in tests but still passes the >= 10 floor we enforce.
process.env.BCRYPT_ROUNDS = '10';

// Keep winston quiet.
jest.mock('winston', () => {
  const noop = () => undefined;
  const noopLogger = {
    info: noop, warn: noop, error: noop, debug: noop, child: () => noopLogger,
  };
  return {
    createLogger: () => noopLogger,
    format: { combine: noop, timestamp: noop, printf: noop, colorize: noop, errors: noop, json: noop },
    transports: { Console: function () {} },
  };
});

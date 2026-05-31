import type { Config } from 'jest';

/**
 * Root Jest configuration.
 *
 * Discovers any `*.spec.ts` files anywhere under `services/` or `packages/`
 * (excluding `dist/` and `node_modules/`) and runs them under ts-jest.
 *
 * `moduleNameMapper` resolves the `@aaft/...` workspace imports to the source
 * files (TypeScript), bypassing the need for a pre-build step. This keeps the
 * inner-loop fast: edit a service, run `npm test`, get results.
 */
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/services', '<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.spec.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@aaft/db-lib$': '<rootDir>/packages/db-lib/src/index.ts',
    '^@aaft/db-lib/(.*)$': '<rootDir>/packages/db-lib/src/$1',
    '^@aaft/common-lib$': '<rootDir>/packages/common-lib/src/index.ts',
    '^@aaft/common-lib/(.*)$': '<rootDir>/packages/common-lib/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: 'es2022',
          strict: true,
        },
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  collectCoverageFrom: [
    'services/**/src/service/*.ts',
    'services/**/src/controller/*.ts',
    'packages/**/src/*.ts',
    '!**/dist/**',
    '!**/*.dto.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  clearMocks: true,
  // Silence the noisy console during tests; comment out for debugging.
  silent: false,
  verbose: true,
};

export default config;

import type { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

/**
 * A deep mock of PrismaClient. Lets tests assert against any model method
 * without hitting a real database. Each test file should call
 * `resetPrismaMock()` in `beforeEach` to keep tests independent.
 *
 * Usage:
 *   jest.mock('@aaft/db-lib', () => ({ prisma: prismaMock, ...require('jest-mock-extended') }));
 */
export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

export function resetPrismaMock(): void {
  mockReset(prismaMock);
}

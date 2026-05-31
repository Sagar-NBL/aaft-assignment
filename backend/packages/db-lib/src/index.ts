/**
 * @aaft/db-lib — Shared persistence library.
 *
 * Exports:
 *   - prisma           : singleton PrismaClient
 *   - BaseService<T>   : abstract CRUD class for domain services to extend
 *   - Prisma + all generated model types from @prisma/client (re-exported)
 *
 * Convention: every domain service in the monorepo MUST go through this
 * package for DB access. No service constructs its own PrismaClient.
 */

export { prisma } from './prisma';
export type { PrismaClientType } from './prisma';

export {
  BaseService,
  type PaginateParams,
  type PaginatedMeta,
  type PaginatedResult,
  type PrismaModelDelegate,
} from './BaseService';

// Re-export Prisma generated types + namespace for downstream services.
export * from '@prisma/client';
export { Prisma } from '@prisma/client';

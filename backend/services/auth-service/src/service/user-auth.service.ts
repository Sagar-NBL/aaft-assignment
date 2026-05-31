import { BaseService, prisma, Prisma, User } from '@aaft/db-lib';

/**
 * UserAuthService — auth-service's view over the User table.
 *
 * Inherits CRUD from BaseService. Adds only the lookup methods auth needs.
 * Domain-level user *management* (admin-side updates, role changes, etc.) lives
 * in admin-service, not here. SRP.
 */
export class UserAuthService extends BaseService<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereUniqueInput,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput,
  Prisma.UserInclude
> {
  protected get model() {
    return prisma.user;
  }
  protected get entityName(): string {
    return 'User';
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }
}

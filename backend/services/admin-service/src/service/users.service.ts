import { BaseService, prisma, Prisma, User, UserRole } from '@aaft/db-lib';
import {
  hashPassword,
  generateAvatar,
  NotFoundException,
  ConflictException,
  type PaginatedBody,
} from '@aaft/common-lib';
import type { CreateUserDto, UpdateUserDto } from '../validator/users.dto';

interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
}

function toDto(u: User): AdminUserDto {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    avatar: u.avatar,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

/**
 * UsersService (admin) — full-role user management (Part B Module 1).
 *
 * Distinct from StudentsService: that one is scoped to role=student for the
 * Part A admin students UI. This one operates on every role and allows admins
 * to assign / change roles. Soft-deletes only (is_active=false) per spec.
 */
export class UsersService extends BaseService<
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

  async listUsers(params: {
    page: number;
    limit: number;
    role?: UserRole;
    search?: string;
  }): Promise<PaginatedBody<AdminUserDto>> {
    const where: Prisma.UserWhereInput = {};
    if (params.role) where.role = params.role;
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    const result = await this.paginate({
      page: params.page,
      limit: params.limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: result.items.map(toDto),
      meta: result.meta,
    };
  }

  async createUser(input: CreateUserDto): Promise<AdminUserDto> {
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name,
        role: input.role,
        avatar: input.avatar ?? generateAvatar(input.name),
      },
    });
    return toDto(user);
  }

  async updateUser(id: string, input: UpdateUserDto): Promise<AdminUserDto> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    const data: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email.toLowerCase();
    if (input.role !== undefined) data.role = input.role;
    if (input.avatar !== undefined) data.avatar = input.avatar;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    const updated = await prisma.user.update({ where: { id }, data });
    return toDto(updated);
  }

  /** Soft-delete only: spec mandates is_active=false, never hard-delete users. */
  async softDeleteUser(id: string): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    await prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async getUser(id: string): Promise<AdminUserDto> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return toDto(user);
  }
}

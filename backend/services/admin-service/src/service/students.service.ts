import {
  BaseService,
  prisma,
  Prisma,
  User,
  UserRole,
} from '@aaft/db-lib';
import {
  hashPassword,
  generateAvatar,
  NotFoundException,
  toStudentDto,
  type StudentDto,
  type PaginatedBody,
} from '@aaft/common-lib';
import { config } from '../config/service.config';

const STUDENT_INCLUDE = {
  enrollments: {
    where: { isActive: true },
    include: { courseRun: { select: { id: true, courseId: true } } },
  },
} satisfies Prisma.UserInclude;

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  sort: 'name' | 'email';
}

/**
 * StudentsService — admin-side operations on User rows with role=student.
 *
 * Inherits CRUD from BaseService. Adds:
 *   - student-only scoping (role=student & is_active=true)
 *   - search + sort
 *   - enriched response (enrolledCourseIds via enrollments join)
 *   - default password injection (POST contract has no password field)
 */
export class StudentsService extends BaseService<
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
    return 'Student';
  }

  private studentScope(): Prisma.UserWhereInput {
    return { role: UserRole.student, isActive: true };
  }

  async listStudents(params: ListParams): Promise<PaginatedBody<StudentDto>> {
    const where: Prisma.UserWhereInput = { ...this.studentScope() };
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    const orderBy: Prisma.UserOrderByWithRelationInput = { [params.sort]: 'asc' };
    const result = await this.paginate({
      page: params.page,
      limit: params.limit,
      where,
      orderBy,
      include: STUDENT_INCLUDE,
    });
    return {
      items: result.items.map(toStudentDto),
      meta: result.meta,
    };
  }

  async getStudent(id: string): Promise<StudentDto> {
    const user = await prisma.user.findFirst({
      where: { id, ...this.studentScope() },
      include: STUDENT_INCLUDE,
    });
    if (!user) throw new NotFoundException('Student not found');
    return toStudentDto(user);
  }

  async createStudent(input: {
    name: string;
    email: string;
    password?: string;
    avatar?: string;
  }): Promise<StudentDto> {
    const passwordHash = await hashPassword(input.password ?? config.defaultStudentPassword);
    const created = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        role: UserRole.student,
        avatar: input.avatar ?? generateAvatar(input.name),
      },
      include: STUDENT_INCLUDE,
    });
    return toStudentDto(created);
  }

  async updateStudent(
    id: string,
    input: { name?: string; email?: string; avatar?: string },
  ): Promise<StudentDto> {
    const existing = await prisma.user.findFirst({ where: { id, ...this.studentScope() } });
    if (!existing) throw new NotFoundException('Student not found');

    const data: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email.toLowerCase();
    if (input.avatar !== undefined) data.avatar = input.avatar;

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: STUDENT_INCLUDE,
    });
    return toStudentDto(updated);
  }

  async deleteStudent(id: string): Promise<void> {
    const existing = await prisma.user.findFirst({ where: { id, ...this.studentScope() } });
    if (!existing) throw new NotFoundException('Student not found');
    // Soft delete — never hard-delete users (spec requirement).
    await prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}

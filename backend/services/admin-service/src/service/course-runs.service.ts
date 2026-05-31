import {
  BaseService,
  prisma,
  Prisma,
  CourseRun,
  EnrollmentType,
} from '@aaft/db-lib';
import { NotFoundException, ConflictException } from '@aaft/common-lib';
import type { CreateCourseRunDto, UpdateCourseRunDto } from '../validator/course-runs.dto';

/**
 * CourseRunsService — admin CRUD over CourseRun rows (Part B Module 3).
 *
 * Business rules enforced here:
 *   - Cannot delete a run that has active enrollments
 *   - Cloning a run copies the row's scheduling fields but re-uses the same
 *     course (content references already point at the course, not the run)
 *   - Grading config is auto-created on clone if the source had one
 */
export class CourseRunsService extends BaseService<
  CourseRun,
  Prisma.CourseRunCreateInput,
  Prisma.CourseRunUpdateInput,
  Prisma.CourseRunWhereUniqueInput,
  Prisma.CourseRunWhereInput,
  Prisma.CourseRunOrderByWithRelationInput,
  Prisma.CourseRunInclude
> {
  protected get model() {
    return prisma.courseRun;
  }
  protected get entityName(): string {
    return 'CourseRun';
  }

  async listRuns(courseId?: string) {
    return prisma.courseRun.findMany({
      where: courseId ? { courseId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { course: { select: { id: true, name: true } } },
    });
  }

  async createRun(input: CreateCourseRunDto): Promise<CourseRun> {
    const course = await prisma.course.findUnique({ where: { id: input.courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'published') {
      throw new ConflictException('Only published courses can be assigned to a course run');
    }
    return prisma.courseRun.create({
      data: {
        courseId: input.courseId,
        runName: input.runName,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        enrollmentType: input.enrollmentType as EnrollmentType,
        price: input.price !== undefined ? new Prisma.Decimal(input.price) : null,
        passThreshold: new Prisma.Decimal(input.passThreshold),
        isActive: true,
      },
    });
  }

  async updateRun(id: string, input: UpdateCourseRunDto): Promise<CourseRun> {
    const existing = await prisma.courseRun.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course run not found');
    const data: Prisma.CourseRunUpdateInput = {};
    if (input.runName !== undefined) data.runName = input.runName;
    if (input.startDate !== undefined) data.startDate = input.startDate;
    if (input.endDate !== undefined) data.endDate = input.endDate;
    if (input.enrollmentType !== undefined) data.enrollmentType = input.enrollmentType as EnrollmentType;
    if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
    if (input.passThreshold !== undefined) data.passThreshold = new Prisma.Decimal(input.passThreshold);
    if (input.isActive !== undefined) data.isActive = input.isActive;
    return prisma.courseRun.update({ where: { id }, data });
  }

  async deleteRun(id: string): Promise<void> {
    const existing = await prisma.courseRun.findUnique({
      where: { id },
      include: { enrollments: { where: { isActive: true }, select: { id: true } } },
    });
    if (!existing) throw new NotFoundException('Course run not found');
    if (existing.enrollments.length > 0) {
      throw new ConflictException('Cannot delete a course run with active enrollments');
    }
    await prisma.courseRun.delete({ where: { id } });
  }

  async cloneRun(id: string, newRunName?: string): Promise<CourseRun> {
    const source = await prisma.courseRun.findUnique({
      where: { id },
      include: { gradingConfig: true },
    });
    if (!source) throw new NotFoundException('Course run not found');

    const created = await prisma.courseRun.create({
      data: {
        courseId: source.courseId,
        runName: newRunName ?? `${source.runName} (clone)`,
        startDate: source.startDate,
        endDate: source.endDate,
        enrollmentType: source.enrollmentType,
        price: source.price,
        passThreshold: source.passThreshold,
        isActive: true,
      },
    });

    if (source.gradingConfig) {
      await prisma.gradingConfig.create({
        data: {
          courseRunId: created.id,
          weights: source.gradingConfig.weights as Prisma.InputJsonValue,
        },
      });
    }

    return created;
  }
}

import {
  prisma,
  Prisma,
  type Section,
  type Subsection,
  type Unit,
  type Quiz,
  type Question,
  UnitType,
} from '@aaft/db-lib';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@aaft/common-lib';
import type {
  CreateSectionDto,
  CreateSubsectionDto,
  CreateUnitDto,
  CreateQuizDto,
  CreateQuestionDto,
} from '../validator/content.dto';

/**
 * ContentService — instructor-side authoring of the Part B hierarchy:
 *
 *   Course → Section → Subsection → Unit (video | text | attachment | quiz)
 *           Unit (type=quiz) → Quiz → Question → Options
 *
 * Every write is gated by `ensureOwnership(instructorId, courseId)` so an
 * instructor cannot edit a peer's course. Admins bypass this check upstream
 * via the admin-service (out of scope for this service).
 */
export class ContentService {
  // ----------------------------------------------------------------
  // Ownership check
  // ----------------------------------------------------------------

  private async ensureOwnership(instructorId: string, courseId: string): Promise<void> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You do not own this course');
    }
  }

  private async resolveCourseIdFromSection(sectionId: string): Promise<string> {
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    return section.courseId;
  }

  private async resolveCourseIdFromSubsection(subsectionId: string): Promise<string> {
    const sub = await prisma.subsection.findUnique({
      where: { id: subsectionId },
      include: { section: true },
    });
    if (!sub) throw new NotFoundException('Subsection not found');
    return sub.section.courseId;
  }

  private async resolveCourseIdFromUnit(unitId: string): Promise<string> {
    const u = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { subsection: { include: { section: true } } },
    });
    if (!u) throw new NotFoundException('Unit not found');
    return u.subsection.section.courseId;
  }

  private async resolveCourseIdFromQuiz(quizId: string): Promise<string> {
    const q = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { unit: { include: { subsection: { include: { section: true } } } } },
    });
    if (!q) throw new NotFoundException('Quiz not found');
    return q.unit.subsection.section.courseId;
  }

  // ----------------------------------------------------------------
  // Sections / Subsections / Units
  // ----------------------------------------------------------------

  async createSection(instructorId: string, courseId: string, dto: CreateSectionDto): Promise<Section> {
    await this.ensureOwnership(instructorId, courseId);
    const max = await prisma.section.aggregate({
      where: { courseId },
      _max: { order: true },
    });
    return prisma.section.create({
      data: {
        courseId,
        title: dto.title,
        order: dto.order ?? (max._max.order ?? -1) + 1,
      },
    });
  }

  async createSubsection(
    instructorId: string,
    sectionId: string,
    dto: CreateSubsectionDto,
  ): Promise<Subsection> {
    const courseId = await this.resolveCourseIdFromSection(sectionId);
    await this.ensureOwnership(instructorId, courseId);
    const max = await prisma.subsection.aggregate({
      where: { sectionId },
      _max: { order: true },
    });
    return prisma.subsection.create({
      data: {
        sectionId,
        title: dto.title,
        order: dto.order ?? (max._max.order ?? -1) + 1,
      },
    });
  }

  async createUnit(
    instructorId: string,
    subsectionId: string,
    dto: CreateUnitDto,
  ): Promise<Unit> {
    const courseId = await this.resolveCourseIdFromSubsection(subsectionId);
    await this.ensureOwnership(instructorId, courseId);

    const max = await prisma.unit.aggregate({
      where: { subsectionId },
      _max: { order: true },
    });
    const order = dto.order ?? (max._max.order ?? -1) + 1;

    const contentCreate: Prisma.UnitContentUncheckedCreateWithoutUnitInput = {
      videoUrl: dto.videoUrl ?? null,
      duration: dto.duration ?? null,
      textContent: dto.textContent ?? null,
      fileUrl: dto.fileUrl ?? null,
      fileName: dto.fileName ?? null,
      mimeType: dto.mimeType ?? null,
    };

    return prisma.unit.create({
      data: {
        subsectionId,
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type,
        order,
        content: { create: contentCreate },
      },
    });
  }

  // ----------------------------------------------------------------
  // Quizzes / Questions / Options
  // ----------------------------------------------------------------

  async createQuiz(instructorId: string, unitId: string, dto: CreateQuizDto): Promise<Quiz> {
    const courseId = await this.resolveCourseIdFromUnit(unitId);
    await this.ensureOwnership(instructorId, courseId);

    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.type !== UnitType.quiz) {
      throw new BadRequestException('Unit type must be "quiz" to attach a quiz');
    }

    return prisma.quiz.create({
      data: {
        unitId,
        title: dto.title,
        passPercent: new Prisma.Decimal(dto.passPercent),
        maxAttempts: dto.maxAttempts,
      },
    });
  }

  async createQuestion(
    instructorId: string,
    quizId: string,
    dto: CreateQuestionDto,
  ): Promise<Question> {
    const courseId = await this.resolveCourseIdFromQuiz(quizId);
    await this.ensureOwnership(instructorId, courseId);

    // Enforce at least one correct option (server-side scoring rule)
    if (!dto.options.some((o) => o.isCorrect)) {
      throw new BadRequestException('At least one option must be marked correct');
    }

    const maxOrder = await prisma.question.aggregate({
      where: { quizId },
      _max: { order: true },
    });

    return prisma.question.create({
      data: {
        quizId,
        text: dto.text,
        type: dto.type,
        order: (maxOrder._max.order ?? -1) + 1,
        options: {
          create: dto.options.map((o, idx) => ({
            text: o.text,
            isCorrect: o.isCorrect,
            order: idx,
          })),
        },
      },
    });
  }

  // ----------------------------------------------------------------
  // Own courses / learner progress
  // ----------------------------------------------------------------

  async listOwnCourses(instructorId: string) {
    return prisma.course.findMany({
      where: { instructorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async courseRunProgress(instructorId: string, courseRunId: string) {
    const run = await prisma.courseRun.findUnique({
      where: { id: courseRunId },
      include: { course: true },
    });
    if (!run) throw new NotFoundException('Course run not found');
    await this.ensureOwnership(instructorId, run.courseId);

    return prisma.enrollment.findMany({
      where: { courseRunId, isActive: true },
      include: {
        student: { select: { id: true, name: true, email: true } },
        videoProgress: { where: { isCompleted: true } },
      },
    });
  }
}

import { prisma, Prisma, UnitType } from '@aaft/db-lib';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  type LessonDto,
} from '@aaft/common-lib';
import { CoursesService } from './courses.service';

/**
 * LessonsService — Part A "Lesson" CRUD that bridges into the Part B unit hierarchy.
 *
 * A "lesson" is a video Unit inside the course's default subsection. This is
 * the adapter layer the assignment explicitly calls out:
 *   "Map lessons to video units in your schema, or expose an adapter layer."
 */
export class LessonsService {
  constructor(private readonly courses: CoursesService) {}

  // -----------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------

  private async loadLessonForCourse(courseId: string, lessonId: string) {
    const unit = await prisma.unit.findUnique({
      where: { id: lessonId },
      include: {
        content: true,
        subsection: { include: { section: true } },
      },
    });
    if (!unit) throw new NotFoundException('Lesson not found');
    if (unit.subsection.section.courseId !== courseId) {
      throw new BadRequestException('Lesson does not belong to this course');
    }
    if (unit.type !== UnitType.video) {
      throw new ConflictException('Unit is not a video lesson');
    }
    return unit;
  }

  private toLessonDto(unit: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    content: { videoUrl: string | null; duration: number | null } | null;
    subsection: { section: { courseId: string } };
  }): LessonDto {
    return {
      id: unit.id,
      courseId: unit.subsection.section.courseId,
      title: unit.title,
      description: unit.description ?? '',
      videoUrl: unit.content?.videoUrl ?? '',
      duration: unit.content?.duration ?? 0,
      order: unit.order,
    };
  }

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------

  async createLesson(
    courseId: string,
    input: { title: string; description: string; videoUrl: string; duration: number },
  ): Promise<LessonDto> {
    const subsectionId = await this.courses.ensureDefaultSubsection(courseId);

    const maxOrder = await prisma.unit.aggregate({
      where: { subsectionId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const unit = await prisma.unit.create({
      data: {
        subsectionId,
        title: input.title,
        description: input.description,
        type: UnitType.video,
        order: nextOrder,
        content: {
          create: {
            videoUrl: input.videoUrl,
            duration: input.duration,
          },
        },
      },
      include: {
        content: true,
        subsection: { include: { section: true } },
      },
    });

    return this.toLessonDto(unit);
  }

  async updateLesson(
    courseId: string,
    lessonId: string,
    input: { title?: string; description?: string; videoUrl?: string; duration?: number },
  ): Promise<LessonDto> {
    await this.loadLessonForCourse(courseId, lessonId);

    const unitData: Prisma.UnitUpdateInput = {};
    if (input.title !== undefined) unitData.title = input.title;
    if (input.description !== undefined) unitData.description = input.description;

    const contentData: Prisma.UnitContentUncheckedUpdateInput = {};
    if (input.videoUrl !== undefined) contentData.videoUrl = input.videoUrl;
    if (input.duration !== undefined) contentData.duration = input.duration;

    const updated = await prisma.unit.update({
      where: { id: lessonId },
      data: {
        ...unitData,
        content:
          Object.keys(contentData).length > 0
            ? {
                upsert: {
                  create: {
                    videoUrl: contentData.videoUrl as string | null | undefined,
                    duration: contentData.duration as number | null | undefined,
                  },
                  update: contentData,
                },
              }
            : undefined,
      },
      include: {
        content: true,
        subsection: { include: { section: true } },
      },
    });

    return this.toLessonDto(updated);
  }

  async deleteLesson(courseId: string, lessonId: string): Promise<void> {
    await this.loadLessonForCourse(courseId, lessonId);
    await prisma.unit.delete({ where: { id: lessonId } });
  }
}

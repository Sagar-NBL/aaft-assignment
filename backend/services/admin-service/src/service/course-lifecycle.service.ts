import { prisma, CourseStatus } from '@aaft/db-lib';
import { NotFoundException, BadRequestException } from '@aaft/common-lib';

/**
 * CourseLifecycleService — handles draft → published → archived transitions.
 * Owns the small state machine in one place (Part B Module 2).
 */
export class CourseLifecycleService {
  async transition(courseId: string, target: CourseStatus) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    // Allowed transitions:
    //   draft     ↔ published
    //   published → archived
    //   archived  → published   (republish)
    const ok =
      (course.status === CourseStatus.draft     && target === CourseStatus.published) ||
      (course.status === CourseStatus.published && target === CourseStatus.archived) ||
      (course.status === CourseStatus.archived  && target === CourseStatus.published) ||
      (course.status === CourseStatus.published && target === CourseStatus.draft);
    if (!ok) {
      throw new BadRequestException(`Illegal transition: ${course.status} → ${target}`);
    }
    return prisma.course.update({ where: { id: courseId }, data: { status: target } });
  }
}

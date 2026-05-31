import { prisma, type Enrollment, type CourseRun, type Course } from '@aaft/db-lib';
import { NotFoundException, ForbiddenException } from '@aaft/common-lib';

export type EnrollmentWithCourse = Enrollment & {
  courseRun: CourseRun & { course: Course };
};

/**
 * EnrollmentLookupService — shared helper for verifying that a student is
 * actually enrolled in a given course and resolving the enrollment row. Used
 * by every student-facing read endpoint as the gatekeeper. Keeps that "is the
 * caller allowed to see this?" rule in one place (SRP, security).
 */
export class EnrollmentLookupService {
  /**
   * All active enrollments for a student, with course + run joined.
   */
  async listForStudent(studentId: string): Promise<EnrollmentWithCourse[]> {
    return prisma.enrollment.findMany({
      where: { studentId, isActive: true },
      include: { courseRun: { include: { course: true } } },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /**
   * Resolve the active enrollment that links this student to this course,
   * via any of the course's runs. Throws if the student isn't enrolled.
   */
  async requireEnrollment(studentId: string, courseId: string): Promise<EnrollmentWithCourse> {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        isActive: true,
        courseRun: { courseId },
      },
      include: { courseRun: { include: { course: true } } },
    });
    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }
    return enrollment;
  }

  async requireCourse(courseId: string): Promise<Course> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }
}

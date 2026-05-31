import {
  prisma,
  EnrollmentType,
  type Enrollment,
} from '@aaft/db-lib';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@aaft/common-lib';

/**
 * EnrollmentsWriteService (student) — handles self-enroll + unenroll.
 *
 * Implements the three enrollment paths from Part B Module 4:
 *   - free / audit  : open self-enroll
 *   - paid          : requires a payment reference (we don't process payments;
 *                     we accept a confirmation flag for now)
 *   - honor         : admin-issued only — rejected here
 */
export class EnrollmentsWriteService {
  async selfEnroll(studentId: string, courseRunId: string, paymentRef?: string): Promise<Enrollment> {
    const run = await prisma.courseRun.findUnique({ where: { id: courseRunId } });
    if (!run) throw new NotFoundException('Course run not found');
    if (!run.isActive) throw new BadRequestException('Course run is inactive');

    if (run.enrollmentType === EnrollmentType.honor) {
      throw new BadRequestException('Honor enrollments must be issued by an admin');
    }
    if (run.enrollmentType === EnrollmentType.paid && !paymentRef) {
      throw new BadRequestException('paymentRef required for paid enrollment');
    }

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseRunId: { studentId, courseRunId } },
    });
    if (existing && existing.isActive) {
      throw new ConflictException('Already enrolled');
    }
    if (existing && !existing.isActive) {
      return prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          paidAt: paymentRef ? new Date() : null,
          paymentRef: paymentRef ?? null,
        },
      });
    }

    return prisma.enrollment.create({
      data: {
        studentId,
        courseRunId,
        isActive: true,
        paidAt: paymentRef ? new Date() : null,
        paymentRef: paymentRef ?? null,
      },
    });
  }

  async unenroll(studentId: string, enrollmentId: string): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.studentId !== studentId) {
      throw new BadRequestException('Enrollment does not belong to this student');
    }
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { isActive: false },
    });
  }

  async listOwnEnrollments(studentId: string) {
    return prisma.enrollment.findMany({
      where: { studentId, isActive: true },
      include: {
        courseRun: { include: { course: { select: { id: true, name: true, description: true } } } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async enrollmentContent(studentId: string, enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        courseRun: {
          include: {
            course: {
              include: {
                sections: {
                  orderBy: { order: 'asc' },
                  include: {
                    subsections: {
                      orderBy: { order: 'asc' },
                      include: {
                        units: {
                          orderBy: { order: 'asc' },
                          include: { content: true, quiz: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.studentId !== studentId) {
      throw new BadRequestException('Enrollment does not belong to this student');
    }
    return enrollment;
  }
}

import { prisma } from '@aaft/db-lib';

/**
 * StudentCertificatesService — list certificates earned by the current student.
 */
export class StudentCertificatesService {
  async listForStudent(studentId: string) {
    const rows = await prisma.certificate.findMany({
      where: { enrollment: { studentId } },
      orderBy: { issuedAt: 'desc' },
      include: {
        enrollment: {
          include: { courseRun: { include: { course: { select: { id: true, name: true } } } } },
        },
      },
    });
    return rows.map((c) => ({
      id: c.id,
      verificationCode: c.verificationCode,
      issuedAt: c.issuedAt.toISOString(),
      course: { id: c.enrollment.courseRun.course.id, name: c.enrollment.courseRun.course.name },
      courseRun: { id: c.enrollment.courseRunId, runName: c.enrollment.courseRun.runName },
    }));
  }
}

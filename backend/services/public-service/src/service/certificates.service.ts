import { prisma } from '@aaft/db-lib';
import { NotFoundException } from '@aaft/common-lib';

interface CertificateVerificationDto {
  verificationCode: string;
  issuedAt: string;
  student: { name: string; email: string };
  course: { id: string; name: string; description: string };
  courseRun: { id: string; runName: string; startDate: string | null; endDate: string | null };
}

/**
 * CertificatesService (public) — read-only lookup by verification code.
 *
 * No authentication. Returns the certificate plus the minimum amount of
 * student / course context needed to render a verification page. PII is
 * limited to name + email — passwords, IDs, and progress are not exposed.
 */
export class CertificatesService {
  async verify(code: string): Promise<CertificateVerificationDto> {
    const cert = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      include: {
        enrollment: {
          include: {
            student: { select: { name: true, email: true } },
            courseRun: { include: { course: true } },
          },
        },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');

    return {
      verificationCode: cert.verificationCode,
      issuedAt: cert.issuedAt.toISOString(),
      student: {
        name: cert.enrollment.student.name,
        email: cert.enrollment.student.email,
      },
      course: {
        id: cert.enrollment.courseRun.course.id,
        name: cert.enrollment.courseRun.course.name,
        description: cert.enrollment.courseRun.course.description,
      },
      courseRun: {
        id: cert.enrollment.courseRun.id,
        runName: cert.enrollment.courseRun.runName,
        startDate: cert.enrollment.courseRun.startDate?.toISOString() ?? null,
        endDate: cert.enrollment.courseRun.endDate?.toISOString() ?? null,
      },
    };
  }
}

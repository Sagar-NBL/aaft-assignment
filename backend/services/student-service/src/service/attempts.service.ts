import { v4 as uuidv4 } from 'uuid';
import {
  prisma,
  Prisma,
} from '@aaft/db-lib';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@aaft/common-lib';
import { GradesService } from './grades.service';

interface SubmitAttemptParams {
  studentId: string;
  enrollmentId: string;
  quizId: string;
  answers: Record<string, string[]>;
}

interface AttemptResultDto {
  id: string;
  score: number;
  passed: boolean;
  attemptNo: number;
  total: number;
  correct: number;
  certificateIssued: boolean;
  verificationCode?: string;
}

/**
 * AttemptsService — student quiz submissions with **server-side scoring**.
 *
 * - We never trust the client to compute scores.
 * - No partial credit: an answer is correct only if the set of selected
 *   option IDs is exactly the set of correct option IDs.
 * - Respects `maxAttempts` per quiz.
 * - After every attempt, grades are recomputed (delegated to GradesService).
 *   If the student passes the course run's threshold, a Certificate is
 *   auto-issued with a unique verification code (Part B Module 9).
 */
export class AttemptsService {
  constructor(private readonly grades: GradesService) {}

  async submit(params: SubmitAttemptParams): Promise<AttemptResultDto> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: params.enrollmentId },
      include: { courseRun: true },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.studentId !== params.studentId) {
      throw new ForbiddenException('Enrollment does not belong to caller');
    }
    if (!enrollment.isActive) {
      throw new BadRequestException('Enrollment is inactive');
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        questions: { include: { options: true } },
        unit: { include: { subsection: { include: { section: true } } } },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.unit.subsection.section.courseId !== enrollment.courseRun.courseId) {
      throw new BadRequestException('Quiz does not belong to the enrolled course');
    }

    const attempts = await prisma.attempt.count({
      where: { quizId: quiz.id, enrollmentId: enrollment.id },
    });
    if (attempts >= quiz.maxAttempts) {
      throw new ConflictException('Maximum attempts exceeded');
    }

    // ----- server-side scoring -----
    let correct = 0;
    for (const q of quiz.questions) {
      const submitted = new Set(params.answers[q.id] ?? []);
      const correctOpts = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const correctSet = new Set(correctOpts);
      if (submitted.size !== correctSet.size) continue;
      let match = true;
      for (const id of submitted) {
        if (!correctSet.has(id)) { match = false; break; }
      }
      if (match) correct++;
    }
    const total = quiz.questions.length;
    const scorePct = total === 0 ? 0 : Math.round((correct / total) * 10000) / 100;
    const passed = scorePct >= Number(quiz.passPercent);

    const attempt = await prisma.attempt.create({
      data: {
        quizId: quiz.id,
        enrollmentId: enrollment.id,
        answers: params.answers as unknown as Prisma.InputJsonValue,
        score: new Prisma.Decimal(scorePct),
        passed,
        attemptNo: attempts + 1,
      },
    });

    // Recompute weighted grade aggregate, then maybe issue certificate
    const aggregate = await this.grades.recompute(enrollment.id);
    let certificateIssued = false;
    let verificationCode: string | undefined;

    if (aggregate.aggregateScore >= Number(enrollment.courseRun.passThreshold)) {
      const existing = await prisma.certificate.findUnique({
        where: { enrollmentId: enrollment.id },
      });
      if (!existing) {
        const code = this.generateVerificationCode();
        const cert = await prisma.certificate.create({
          data: { enrollmentId: enrollment.id, verificationCode: code },
        });
        certificateIssued = true;
        verificationCode = cert.verificationCode;
      }
    }

    return {
      id: attempt.id,
      score: scorePct,
      passed,
      attemptNo: attempt.attemptNo,
      total,
      correct,
      certificateIssued,
      verificationCode,
    };
  }

  /** Short, human-shareable verification code. */
  private generateVerificationCode(): string {
    return `AAFT-${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }
}

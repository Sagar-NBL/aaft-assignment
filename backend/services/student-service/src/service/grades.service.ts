import { prisma, Prisma, UnitType } from '@aaft/db-lib';
import { NotFoundException, ForbiddenException } from '@aaft/common-lib';

interface GradeBreakdown {
  quizzes: { raw: number; weighted: number; weight: number };
  videoCompletion: { raw: number; weighted: number; weight: number };
}

interface GradeDto {
  enrollmentId: string;
  aggregateScore: number;
  breakdown: GradeBreakdown;
  passed: boolean;
  passThreshold: number;
}

/**
 * GradesService — weighted aggregate scoring (Part B Module 8).
 *
 * Reads the course run's `grading_config.weights` JSON (default
 *   { quizzes: 60, videoCompletion: 40 })
 * and produces a weighted aggregate that is recomputed on every quiz attempt.
 * Persisted into the `grades` row for fast reads.
 */
export class GradesService {
  async recompute(enrollmentId: string): Promise<GradeDto> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { courseRun: { include: { gradingConfig: true } } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const weights = this.readWeights(enrollment.courseRun.gradingConfig?.weights);

    // ----- quizzes component: best-attempt-per-quiz, averaged -----
    const quizzes = await prisma.quiz.findMany({
      where: { unit: { subsection: { section: { courseId: enrollment.courseRun.courseId } } } },
      include: {
        attempts: { where: { enrollmentId }, orderBy: { score: 'desc' } },
      },
    });
    let quizzesRaw = 0;
    if (quizzes.length > 0) {
      const bestScores = quizzes.map((q) => (q.attempts[0] ? Number(q.attempts[0].score) : 0));
      quizzesRaw = bestScores.reduce((a, b) => a + b, 0) / quizzes.length;
    }

    // ----- video completion component -----
    const totalVideos = await prisma.unit.count({
      where: { type: UnitType.video, subsection: { section: { courseId: enrollment.courseRun.courseId } } },
    });
    const completed = totalVideos === 0
      ? 0
      : await prisma.videoProgress.count({
          where: {
            enrollmentId,
            isCompleted: true,
            unit: { type: UnitType.video, subsection: { section: { courseId: enrollment.courseRun.courseId } } },
          },
        });
    const videoRaw = totalVideos === 0 ? 0 : (completed / totalVideos) * 100;

    const quizzesWeighted = (quizzesRaw * weights.quizzes) / 100;
    const videoWeighted = (videoRaw * weights.videoCompletion) / 100;
    const aggregate = Math.round((quizzesWeighted + videoWeighted) * 100) / 100;

    const breakdown: GradeBreakdown = {
      quizzes: { raw: Math.round(quizzesRaw * 100) / 100, weighted: Math.round(quizzesWeighted * 100) / 100, weight: weights.quizzes },
      videoCompletion: { raw: Math.round(videoRaw * 100) / 100, weighted: Math.round(videoWeighted * 100) / 100, weight: weights.videoCompletion },
    };

    await prisma.grade.upsert({
      where: { enrollmentId },
      create: {
        enrollmentId,
        aggregateScore: new Prisma.Decimal(aggregate),
        breakdown: breakdown as unknown as Prisma.InputJsonValue,
      },
      update: {
        aggregateScore: new Prisma.Decimal(aggregate),
        breakdown: breakdown as unknown as Prisma.InputJsonValue,
      },
    });

    const passThreshold = Number(enrollment.courseRun.passThreshold);
    return {
      enrollmentId,
      aggregateScore: aggregate,
      breakdown,
      passed: aggregate >= passThreshold,
      passThreshold,
    };
  }

  async getForStudent(studentId: string, enrollmentId: string): Promise<GradeDto> {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.studentId !== studentId) {
      throw new ForbiddenException('Enrollment does not belong to caller');
    }
    return this.recompute(enrollmentId);
  }

  // ----------------------------------------------------------------
  // helpers
  // ----------------------------------------------------------------

  private readWeights(raw: unknown): { quizzes: number; videoCompletion: number } {
    const defaults = { quizzes: 60, videoCompletion: 40 };
    if (!raw || typeof raw !== 'object') return defaults;
    const obj = raw as Record<string, unknown>;
    const q = Number(obj.quizzes);
    const v = Number(obj.videoCompletion);
    if (!Number.isFinite(q) || !Number.isFinite(v) || q + v <= 0) return defaults;
    // Renormalize if sum != 100 so callers can't game the math.
    const sum = q + v;
    return { quizzes: (q / sum) * 100, videoCompletion: (v / sum) * 100 };
  }
}

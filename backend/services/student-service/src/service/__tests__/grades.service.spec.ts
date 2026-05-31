import { Prisma } from '@aaft/db-lib';
import { GradesService } from '../grades.service';

jest.mock('@aaft/db-lib', () => {
  const actual = jest.requireActual('@aaft/db-lib');
  return {
    ...actual,
    prisma: {
      enrollment: { findUnique: jest.fn() },
      quiz: { findMany: jest.fn() },
      unit: { count: jest.fn() },
      videoProgress: { count: jest.fn() },
      grade: { upsert: jest.fn() },
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require('@aaft/db-lib') as { prisma: any };

describe('GradesService — weighted aggregate', () => {
  const enrollmentRow = (weights: unknown) => ({
    id: 'enr-1',
    courseRunId: 'run-1',
    courseRun: {
      id: 'run-1',
      courseId: 'course-1',
      passThreshold: new Prisma.Decimal('60'),
      gradingConfig: { weights },
    },
  });

  let service: GradesService;

  beforeEach(() => {
    service = new GradesService();
    prisma.grade.upsert.mockResolvedValue({});
  });

  it('applies the default 60/40 weighting when no quizzes exist (video-only)', async () => {
    prisma.enrollment.findUnique.mockResolvedValue(
      enrollmentRow({ quizzes: 60, videoCompletion: 40 }),
    );
    prisma.quiz.findMany.mockResolvedValue([]);  // no quizzes
    prisma.unit.count.mockResolvedValue(10);
    prisma.videoProgress.count.mockResolvedValue(5); // 50% videos completed

    const result = await service.recompute('enr-1');

    // quizzesRaw=0, videoRaw=50 → 0*0.6 + 50*0.4 = 20
    expect(result.aggregateScore).toBeCloseTo(20, 1);
    expect(result.passed).toBe(false);
  });

  it('full credit on quizzes + half on videos with default weights', async () => {
    prisma.enrollment.findUnique.mockResolvedValue(
      enrollmentRow({ quizzes: 60, videoCompletion: 40 }),
    );
    prisma.quiz.findMany.mockResolvedValue([
      { id: 'q1', attempts: [{ score: new Prisma.Decimal('100') }] },
      { id: 'q2', attempts: [{ score: new Prisma.Decimal('100') }] },
    ]);
    prisma.unit.count.mockResolvedValue(4);
    prisma.videoProgress.count.mockResolvedValue(2); // 50%

    const result = await service.recompute('enr-1');

    // quizzesRaw=100, videoRaw=50 → 100*0.6 + 50*0.4 = 60 + 20 = 80
    expect(result.aggregateScore).toBeCloseTo(80, 1);
    expect(result.passed).toBe(true);
    expect(result.breakdown.quizzes.raw).toBe(100);
    expect(result.breakdown.quizzes.weight).toBe(60);
    expect(result.breakdown.videoCompletion.raw).toBe(50);
  });

  it('renormalises weights when they do not sum to 100', async () => {
    // 30 + 30 should be treated as 50/50.
    prisma.enrollment.findUnique.mockResolvedValue(
      enrollmentRow({ quizzes: 30, videoCompletion: 30 }),
    );
    prisma.quiz.findMany.mockResolvedValue([
      { id: 'q1', attempts: [{ score: new Prisma.Decimal('80') }] },
    ]);
    prisma.unit.count.mockResolvedValue(4);
    prisma.videoProgress.count.mockResolvedValue(4); // 100% videos

    const result = await service.recompute('enr-1');

    // After renormalisation: quizzes=50, videos=50 → 80*0.5 + 100*0.5 = 90
    expect(result.aggregateScore).toBeCloseTo(90, 1);
  });

  it('best attempt per quiz wins (Prisma sorts desc by score in our query)', async () => {
    prisma.enrollment.findUnique.mockResolvedValue(
      enrollmentRow({ quizzes: 100, videoCompletion: 0 }),
    );
    // attempts are pre-sorted desc by score in our query — service takes the first.
    prisma.quiz.findMany.mockResolvedValue([
      {
        id: 'q1',
        attempts: [
          { score: new Prisma.Decimal('80') },
          { score: new Prisma.Decimal('40') },
          { score: new Prisma.Decimal('60') },
        ],
      },
    ]);
    prisma.unit.count.mockResolvedValue(0);
    prisma.videoProgress.count.mockResolvedValue(0);

    const result = await service.recompute('enr-1');

    // quizzesRaw = best = 80, weighted at 100% → aggregate ≈ 80
    expect(result.aggregateScore).toBeCloseTo(80, 1);
  });
});

import { Prisma } from '@aaft/db-lib';
import { AttemptsService } from '../attempts.service';
import { GradesService } from '../grades.service';
import { ConflictException } from '@aaft/common-lib';

jest.mock('@aaft/db-lib', () => {
  const actual = jest.requireActual('@aaft/db-lib');
  return {
    ...actual,
    prisma: {
      enrollment: { findUnique: jest.fn() },
      quiz: { findUnique: jest.fn() },
      attempt: { count: jest.fn(), create: jest.fn() },
      certificate: { findUnique: jest.fn(), create: jest.fn() },
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require('@aaft/db-lib') as { prisma: any };

describe('AttemptsService — server-side scoring + cert auto-issue', () => {
  const ENROLLMENT = {
    id: 'enr-1',
    studentId: 'stu-1',
    isActive: true,
    courseRunId: 'run-1',
    courseRun: {
      id: 'run-1',
      courseId: 'course-1',
      passThreshold: new Prisma.Decimal('60'),
    },
  };

  const QUIZ = (questions: any[]) => ({
    id: 'quiz-1',
    unitId: 'unit-1',
    title: 'Sample Quiz',
    passPercent: new Prisma.Decimal('50'),
    maxAttempts: 3,
    questions,
    unit: { subsection: { section: { courseId: 'course-1' } } },
  });

  /** Helper to build a question with N options, only `correctIndexes` set isCorrect=true. */
  const makeQuestion = (id: string, optionIds: string[], correctIndexes: number[]) => ({
    id,
    text: 'q?',
    type: 'mcq_single',
    options: optionIds.map((oid, i) => ({ id: oid, isCorrect: correctIndexes.includes(i) })),
  });

  let grades: jest.Mocked<GradesService>;
  let service: AttemptsService;

  beforeEach(() => {
    grades = {
      recompute: jest.fn(),
      getForStudent: jest.fn(),
    } as unknown as jest.Mocked<GradesService>;
    service = new AttemptsService(grades);

    prisma.enrollment.findUnique.mockResolvedValue(ENROLLMENT);
    prisma.attempt.count.mockResolvedValue(0);
    prisma.attempt.create.mockResolvedValue({
      id: 'att-1', attemptNo: 1, score: new Prisma.Decimal('0'), passed: false,
    });
    prisma.certificate.findUnique.mockResolvedValue(null);
    prisma.certificate.create.mockResolvedValue({ verificationCode: 'AAFT-TESTCODE0001' });
    grades.recompute.mockResolvedValue({
      enrollmentId: 'enr-1', aggregateScore: 0, breakdown: {} as any,
      passed: false, passThreshold: 60,
    });
  });

  it('rejects when the student has already used all attempts', async () => {
    prisma.quiz.findUnique.mockResolvedValue(QUIZ([makeQuestion('q1', ['o1', 'o2'], [0])]));
    prisma.attempt.count.mockResolvedValue(3); // == maxAttempts

    await expect(
      service.submit({
        studentId: 'stu-1', enrollmentId: 'enr-1', quizId: 'quiz-1',
        answers: { q1: ['o1'] },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.attempt.create).not.toHaveBeenCalled();
  });

  it('scores 100% when every answer set exactly matches the correct set', async () => {
    prisma.quiz.findUnique.mockResolvedValue(
      QUIZ([
        makeQuestion('q1', ['o1', 'o2'], [0]),
        makeQuestion('q2', ['o3', 'o4'], [1]),
      ]),
    );

    const result = await service.submit({
      studentId: 'stu-1', enrollmentId: 'enr-1', quizId: 'quiz-1',
      answers: { q1: ['o1'], q2: ['o4'] },
    });

    expect(result.correct).toBe(2);
    expect(result.total).toBe(2);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('no partial credit: superset answer for an mcq_multi is wrong', async () => {
    // Correct = {o1, o2}; student picks {o1, o2, o3} — extra option → 0 marks for the question.
    prisma.quiz.findUnique.mockResolvedValue(
      QUIZ([makeQuestion('q1', ['o1', 'o2', 'o3'], [0, 1])]),
    );

    const result = await service.submit({
      studentId: 'stu-1', enrollmentId: 'enr-1', quizId: 'quiz-1',
      answers: { q1: ['o1', 'o2', 'o3'] },
    });

    expect(result.correct).toBe(0);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('scores 0% on missing answers, no exceptions', async () => {
    prisma.quiz.findUnique.mockResolvedValue(QUIZ([makeQuestion('q1', ['o1', 'o2'], [0])]));

    const result = await service.submit({
      studentId: 'stu-1', enrollmentId: 'enr-1', quizId: 'quiz-1',
      answers: {},
    });

    expect(result.correct).toBe(0);
    expect(result.score).toBe(0);
  });

  it('auto-issues a certificate when the recomputed aggregate clears the run threshold', async () => {
    prisma.quiz.findUnique.mockResolvedValue(QUIZ([makeQuestion('q1', ['o1', 'o2'], [0])]));
    grades.recompute.mockResolvedValue({
      enrollmentId: 'enr-1', aggregateScore: 75, breakdown: {} as any,
      passed: true, passThreshold: 60,
    });

    const result = await service.submit({
      studentId: 'stu-1', enrollmentId: 'enr-1', quizId: 'quiz-1',
      answers: { q1: ['o1'] },
    });

    expect(result.certificateIssued).toBe(true);
    expect(result.verificationCode).toMatch(/^AAFT-/);
    expect(prisma.certificate.create).toHaveBeenCalledTimes(1);
  });

  it('does NOT re-issue a certificate when one already exists', async () => {
    prisma.quiz.findUnique.mockResolvedValue(QUIZ([makeQuestion('q1', ['o1', 'o2'], [0])]));
    grades.recompute.mockResolvedValue({
      enrollmentId: 'enr-1', aggregateScore: 90, breakdown: {} as any,
      passed: true, passThreshold: 60,
    });
    prisma.certificate.findUnique.mockResolvedValue({ verificationCode: 'AAFT-EXISTING01' });

    const result = await service.submit({
      studentId: 'stu-1', enrollmentId: 'enr-1', quizId: 'quiz-1',
      answers: { q1: ['o1'] },
    });

    expect(result.certificateIssued).toBe(false);
    expect(prisma.certificate.create).not.toHaveBeenCalled();
  });
});

import { Prisma, UnitType } from '@aaft/db-lib';
import { ProgressService } from '../progress.service';
import { EnrollmentLookupService } from '../enrollment-lookup.service';

// Replace the real Prisma client with a mock proxy.
jest.mock('@aaft/db-lib', () => {
  const actual = jest.requireActual('@aaft/db-lib');
  return {
    ...actual,
    prisma: {
      unit: { findUnique: jest.fn(), count: jest.fn() },
      videoProgress: { upsert: jest.fn(), update: jest.fn(), count: jest.fn() },
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require('@aaft/db-lib') as { prisma: any };

describe('ProgressService — the 90% rule', () => {
  const ENROLLMENT = {
    id: 'enr-1',
    studentId: 'stu-1',
    courseRunId: 'run-1',
    isActive: true,
    courseRun: { id: 'run-1', courseId: 'course-1', course: { id: 'course-1', name: 'C1' } },
  } as unknown as Awaited<ReturnType<EnrollmentLookupService['requireEnrollment']>>;

  const UNIT = {
    id: 'unit-1',
    type: UnitType.video,
    subsection: { section: { courseId: 'course-1' } },
  };

  let lookup: jest.Mocked<EnrollmentLookupService>;
  let service: ProgressService;

  beforeEach(() => {
    lookup = {
      requireEnrollment: jest.fn().mockResolvedValue(ENROLLMENT),
      requireCourse: jest.fn(),
      listForStudent: jest.fn(),
    } as unknown as jest.Mocked<EnrollmentLookupService>;
    service = new ProgressService(lookup);

    prisma.unit.findUnique.mockResolvedValue(UNIT);
    prisma.unit.count.mockResolvedValue(2);            // 2 video units in the course
    prisma.videoProgress.count.mockResolvedValue(0);   // none completed yet
  });

  it('marks isCompleted=false when percentage is below 90', async () => {
    prisma.videoProgress.upsert.mockResolvedValue({
      id: 'vp-1',
      lastWatched: 100,
      completionPercent: new Prisma.Decimal('50'),
      isCompleted: false,
      watchedSegments: [[0, 100]],
      totalWatchTime: 100,
    });

    const result = await service.upsert({
      studentId: 'stu-1', videoId: 'unit-1', courseId: 'course-1',
      lastWatched: 100, percentage: 50, duration: 200,
    });

    expect(result.videoProgress.isCompleted).toBe(false);
    expect(prisma.videoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ isCompleted: false }) }),
    );
    // On update path we deliberately omit isCompleted so the existing value sticks.
    const callArg = prisma.videoProgress.upsert.mock.calls[0][0];
    expect(callArg.update).not.toHaveProperty('isCompleted');
  });

  it('auto-completes when percentage crosses 90 (the headline rule)', async () => {
    prisma.videoProgress.upsert.mockResolvedValue({
      id: 'vp-2',
      lastWatched: 180,
      completionPercent: new Prisma.Decimal('95'),
      isCompleted: false, // DB returned old value because the update path omits it
      watchedSegments: [[0, 180]],
      totalWatchTime: 180,
    });
    prisma.videoProgress.update.mockResolvedValue({ isCompleted: true });

    const result = await service.upsert({
      studentId: 'stu-1', videoId: 'unit-1', courseId: 'course-1',
      lastWatched: 180, percentage: 95, duration: 200,
    });

    expect(result.videoProgress.isCompleted).toBe(true);
    // The follow-up flip-to-true must have happened
    expect(prisma.videoProgress.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isCompleted: true } }),
    );
  });

  it('stickiness: when DB already has isCompleted=true, we do NOT flip it back on a later <90% update', async () => {
    prisma.videoProgress.upsert.mockResolvedValue({
      id: 'vp-3',
      lastWatched: 60,
      completionPercent: new Prisma.Decimal('30'),
      isCompleted: true, // DB preserves the previously-completed flag
      watchedSegments: [[0, 60]],
      totalWatchTime: 60,
    });

    const result = await service.upsert({
      studentId: 'stu-1', videoId: 'unit-1', courseId: 'course-1',
      lastWatched: 60, percentage: 30, duration: 200,
    });

    expect(result.videoProgress.isCompleted).toBe(true);
    // No second update — we never flip true → false.
    expect(prisma.videoProgress.update).not.toHaveBeenCalled();
  });

  it('returns course progress alongside lesson progress', async () => {
    prisma.videoProgress.upsert.mockResolvedValue({
      id: 'vp-4', lastWatched: 200, completionPercent: new Prisma.Decimal('95'),
      isCompleted: true, watchedSegments: [], totalWatchTime: 200,
    });
    prisma.videoProgress.count.mockResolvedValue(1); // 1 completed video
    prisma.unit.count.mockResolvedValue(2);          // 2 total videos

    const result = await service.upsert({
      studentId: 'stu-1', videoId: 'unit-1', courseId: 'course-1',
      lastWatched: 200, percentage: 95, duration: 200,
    });

    expect(result.courseProgress).toEqual({ completedVideos: 1, totalVideos: 2, percentage: 50 });
  });
});

import { prisma, Prisma, UnitType } from '@aaft/db-lib';
import {
  NotFoundException,
  BadRequestException,
  type VideoProgressDto,
  type CourseProgressDto,
} from '@aaft/common-lib';
import { EnrollmentLookupService } from './enrollment-lookup.service';
import { config } from '../config/service.config';

interface UpsertParams {
  studentId: string;
  videoId: string;       // unit.id of the video lesson
  courseId: string;
  lastWatched: number;
  percentage: number;
  duration: number;
  watchedSegments?: Array<[number, number]>;
}

/**
 * ProgressService — applies the **90% completion rule** and upserts a single
 * video_progress row per (enrollment, unit). Never inserts duplicates; updates
 * watched_segments, last_watched, completion_percent, and toggles is_completed
 * the first time percentage crosses the configured threshold.
 *
 * Course progress is recomputed and returned on every write so the client can
 * keep its progress ring in sync without an extra round-trip.
 */
export class ProgressService {
  constructor(private readonly lookup: EnrollmentLookupService) {}

  async upsert(params: UpsertParams): Promise<{
    videoProgress: VideoProgressDto;
    courseProgress: CourseProgressDto;
  }> {
    const enrollment = await this.lookup.requireEnrollment(params.studentId, params.courseId);

    // Ensure the videoId is actually a video unit that belongs to this course.
    const unit = await prisma.unit.findUnique({
      where: { id: params.videoId },
      include: { subsection: { include: { section: true } } },
    });
    if (!unit) throw new NotFoundException('Lesson not found');
    if (unit.type !== UnitType.video) {
      throw new BadRequestException('Unit is not a video');
    }
    if (unit.subsection.section.courseId !== params.courseId) {
      throw new BadRequestException('Lesson does not belong to this course');
    }

    const isCompleted = params.percentage >= config.completionThreshold;

    const upserted = await prisma.videoProgress.upsert({
      where: { enrollmentId_unitId: { enrollmentId: enrollment.id, unitId: unit.id } },
      create: {
        enrollmentId: enrollment.id,
        unitId: unit.id,
        lastWatched: Math.floor(params.lastWatched),
        completionPercent: new Prisma.Decimal(params.percentage.toFixed(2)),
        isCompleted,
        watchedSegments: (params.watchedSegments ?? []) as unknown as Prisma.InputJsonValue,
        totalWatchTime: Math.floor(params.lastWatched),
      },
      // Stickiness rule: on update we deliberately omit `isCompleted` so the
      // DB keeps its existing value. If the current % crosses the threshold
      // we flip it to true via the follow-up below — but never back to false.
      update: {
        lastWatched: Math.floor(params.lastWatched),
        completionPercent: new Prisma.Decimal(params.percentage.toFixed(2)),
        watchedSegments: (params.watchedSegments ?? []) as unknown as Prisma.InputJsonValue,
        totalWatchTime: Math.floor(params.lastWatched),
      },
    });

    if (isCompleted && !upserted.isCompleted) {
      await prisma.videoProgress.update({
        where: { id: upserted.id },
        data: { isCompleted: true },
      });
      upserted.isCompleted = true;
    }

    const videoProgress: VideoProgressDto = {
      lastWatched: upserted.lastWatched,
      percentage: Number(upserted.completionPercent),
      isCompleted: upserted.isCompleted,
      watchedSegments: Array.isArray(upserted.watchedSegments)
        ? (upserted.watchedSegments as Array<[number, number]>)
        : [],
      totalWatchTime: upserted.totalWatchTime,
    };

    const courseProgress = await this.recomputeCourseProgress(enrollment.id, params.courseId);

    return { videoProgress, courseProgress };
  }

  // ------------------------------------------------------------------
  // Course aggregate
  // ------------------------------------------------------------------

  async recomputeCourseProgress(enrollmentId: string, courseId: string): Promise<CourseProgressDto> {
    const totalVideos = await prisma.unit.count({
      where: { type: UnitType.video, subsection: { section: { courseId } } },
    });
    if (totalVideos === 0) return { completedVideos: 0, totalVideos: 0, percentage: 0 };

    const completedVideos = await prisma.videoProgress.count({
      where: {
        enrollmentId,
        isCompleted: true,
        unit: { type: UnitType.video, subsection: { section: { courseId } } },
      },
    });
    return {
      completedVideos,
      totalVideos,
      percentage: Math.round((completedVideos / totalVideos) * 100),
    };
  }
}

import { prisma, UnitType } from '@aaft/db-lib';
import {
  toCourseDto,
  COURSE_INCLUDE,
  type StudentDashboardStatsDto,
  type StudentCourseCardDto,
  type CourseProgressDto,
  type StudentCourseStatus,
} from '@aaft/common-lib';
import { EnrollmentLookupService } from './enrollment-lookup.service';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * DashboardService — student home page aggregates.
 *
 * - inProgress / completed counts of the student's enrollments
 * - total watch time across all enrollments
 * - last-7-day weekly chart of minutes watched
 * - course cards (same shape as the courses list)
 */
export class DashboardService {
  constructor(private readonly lookup: EnrollmentLookupService) {}

  async stats(studentId: string): Promise<StudentDashboardStatsDto> {
    const enrollments = await this.lookup.listForStudent(studentId);

    let inProgress = 0;
    let completed = 0;
    const courses: StudentCourseCardDto[] = [];

    for (const e of enrollments) {
      const course = await prisma.course.findUnique({
        where: { id: e.courseRun.courseId },
        include: COURSE_INCLUDE,
      });
      if (!course) continue;

      const totalVideos = await prisma.unit.count({
        where: { type: UnitType.video, subsection: { section: { courseId: course.id } } },
      });
      const completedVideos = totalVideos === 0
        ? 0
        : await prisma.videoProgress.count({
            where: {
              enrollmentId: e.id,
              isCompleted: true,
              unit: { type: UnitType.video, subsection: { section: { courseId: course.id } } },
            },
          });
      const percentage = totalVideos === 0 ? 0 : Math.round((completedVideos / totalVideos) * 100);
      const progress: CourseProgressDto = { completedVideos, totalVideos, percentage };
      const status: StudentCourseStatus =
        totalVideos === 0 || completedVideos === 0
          ? 'not_started'
          : completedVideos >= totalVideos
            ? 'completed'
            : 'in_progress';

      if (status === 'completed') completed++;
      else if (status === 'in_progress') inProgress++;

      courses.push({ ...toCourseDto(course), progress, status });
    }

    const totalWatchTime = (
      await prisma.videoProgress.aggregate({
        where: { enrollment: { studentId } },
        _sum: { totalWatchTime: true },
      })
    )._sum.totalWatchTime ?? 0;

    const weeklyProgress = await this.weeklyProgress(studentId);

    return {
      inProgress,
      completed,
      totalWatchTime,
      courses,
      weeklyProgress,
    };
  }

  /**
   * Sum of watch time (in minutes) per day for the past 7 days, ordered
   * Mon → Sun in line with the frontend chart.
   */
  private async weeklyProgress(studentId: string): Promise<Array<{ day: string; minutes: number }>> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    const rows = await prisma.videoProgress.findMany({
      where: {
        enrollment: { studentId },
        updatedAt: { gte: from },
      },
      select: { totalWatchTime: true, updatedAt: true },
    });

    // Day-of-week bucket (last 7 days starting from "6 days ago")
    const buckets: Array<{ day: string; minutes: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({ day: DAY_NAMES[date.getDay()], minutes: 0 });
    }
    for (const r of rows) {
      const diffDays = Math.floor((now.getTime() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      const idx = 6 - diffDays;
      if (idx >= 0 && idx < 7) {
        buckets[idx].minutes += Math.round((r.totalWatchTime ?? 0) / 60);
      }
    }
    return buckets;
  }
}

import {
  prisma,
  UnitType,
  UserRole,
} from '@aaft/db-lib';
import {
  NotFoundException,
  toStudentDto,
  toCourseDto,
  COURSE_INCLUDE,
  type AdminOverviewReportDto,
  type StudentReportDto,
  type CourseProgressDto,
} from '@aaft/common-lib';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * ReportsService — admin analytics. Heavy reads, no writes.
 *
 * For Part A this service produces the four panels the admin dashboard shows:
 *   - top-line metrics
 *   - completion trend by month
 *   - time spent by course
 *   - course completion (completed vs total students)
 *
 * Calculations are intentionally simple SQL aggregations — N+1 is avoided by
 * pulling lists once and reducing in memory.
 */
export class ReportsService {
  // ------------------------------------------------------------------
  // Overview
  // ------------------------------------------------------------------

  async overview(): Promise<AdminOverviewReportDto> {
    const [studentCount, courseCount, enrollments, completionStats, courses] = await Promise.all([
      prisma.user.count({ where: { role: UserRole.student, isActive: true } }),
      prisma.course.count(),
      prisma.enrollment.count({ where: { isActive: true } }),
      prisma.videoProgress.aggregate({
        _avg: { completionPercent: true },
        _count: { id: true },
        _sum: { totalWatchTime: true },
      }),
      prisma.course.findMany({
        include: {
          courseRuns: {
            where: { isActive: true },
            include: {
              enrollments: {
                where: { isActive: true },
                include: {
                  videoProgress: { where: { isCompleted: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalWatchHours = Math.round(((completionStats._sum.totalWatchTime ?? 0) / 3600) * 10) / 10;
    const avgCompletion = completionStats._avg.completionPercent
      ? Math.round(Number(completionStats._avg.completionPercent))
      : 0;

    // Completion trend — last 6 months by enrollment.assignedAt vs completion
    const trend = await this.completionTrend();

    // Time spent by course
    const timeByCourse = await this.timeSpentByCourse();

    // Course completion (per course: how many enrollments have completed all videos)
    const courseCompletion = await Promise.all(
      courses.map(async (c) => {
        const totalUnits = await prisma.unit.count({
          where: { type: UnitType.video, subsection: { section: { courseId: c.id } } },
        });
        const enrolls = c.courseRuns.flatMap((r) => r.enrollments);
        const completed = totalUnits === 0
          ? 0
          : enrolls.filter((e) => e.videoProgress.length >= totalUnits).length;
        return { course: c.name, completed, total: enrolls.length };
      }),
    );

    return {
      metrics: [
        { label: 'Total Students', value: String(studentCount), change: '+0%' },
        { label: 'Active Courses', value: String(courseCount), change: '+0%' },
        { label: 'Total Enrollments', value: String(enrollments), change: '+0%' },
        { label: 'Avg Completion %', value: `${avgCompletion}%`, change: '+0%' },
        { label: 'Total Watch Hours', value: `${totalWatchHours}h`, change: '+0%' },
      ],
      completionTrend: trend,
      timeSpentByCourse: timeByCourse,
      courseCompletion,
    };
  }

  private async completionTrend(): Promise<Array<{ month: string; rate: number }>> {
    // For the last 6 calendar months, compute % of progress rows that are completed.
    const now = new Date();
    const buckets: Array<{ key: string; label: string; from: Date; to: Date }> = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({
        key: `${month.getFullYear()}-${month.getMonth()}`,
        label: MONTHS[month.getMonth()],
        from: month,
        to: next,
      });
    }

    const result: Array<{ month: string; rate: number }> = [];
    for (const b of buckets) {
      const [total, done] = await Promise.all([
        prisma.videoProgress.count({ where: { updatedAt: { gte: b.from, lt: b.to } } }),
        prisma.videoProgress.count({
          where: { updatedAt: { gte: b.from, lt: b.to }, isCompleted: true },
        }),
      ]);
      const rate = total === 0 ? 0 : Math.round((done / total) * 100);
      result.push({ month: b.label, rate });
    }
    return result;
  }

  private async timeSpentByCourse(): Promise<Array<{ course: string; hours: number }>> {
    const rows = await prisma.course.findMany({
      include: {
        sections: {
          include: {
            subsections: {
              include: {
                units: {
                  include: { videoProgress: { select: { totalWatchTime: true } } },
                },
              },
            },
          },
        },
      },
    });
    return rows.map((c) => {
      let seconds = 0;
      for (const s of c.sections)
        for (const sub of s.subsections)
          for (const u of sub.units)
            for (const vp of u.videoProgress) seconds += vp.totalWatchTime;
      return { course: c.name, hours: Math.round((seconds / 3600) * 10) / 10 };
    });
  }

  // ------------------------------------------------------------------
  // Part B Module 10 — progress / completions / time-spent across runs
  // ------------------------------------------------------------------

  /**
   * Per-run progress aggregates with date-range filter and pagination.
   * Returns one row per (course run × student) with completion %.
   */
  async progressReport(params: { from?: Date; to?: Date; page: number; limit: number }) {
    const where: import('@aaft/db-lib').Prisma.EnrollmentWhereInput = {
      isActive: true,
      ...(params.from || params.to
        ? { assignedAt: { ...(params.from && { gte: params.from }), ...(params.to && { lte: params.to }) } }
        : {}),
    };

    const totalItems = await prisma.enrollment.count({ where });
    const rows = await prisma.enrollment.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: {
        student: { select: { id: true, name: true, email: true } },
        courseRun: { include: { course: { select: { id: true, name: true } } } },
        videoProgress: { where: { isCompleted: true }, select: { id: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const items = await Promise.all(
      rows.map(async (e) => {
        const totalVideos = await prisma.unit.count({
          where: { type: UnitType.video, subsection: { section: { courseId: e.courseRun.courseId } } },
        });
        const completed = e.videoProgress.length;
        return {
          enrollmentId: e.id,
          studentId: e.studentId,
          studentName: e.student.name,
          studentEmail: e.student.email,
          courseId: e.courseRun.course.id,
          courseName: e.courseRun.course.name,
          courseRunId: e.courseRunId,
          completed,
          total: totalVideos,
          percentage: totalVideos === 0 ? 0 : Math.round((completed / totalVideos) * 100),
        };
      }),
    );

    return {
      items,
      meta: {
        page: params.page,
        limit: params.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / params.limit)),
      },
    };
  }

  /**
   * Completion counts per course run within the optional date range.
   */
  async completionsReport(params: { from?: Date; to?: Date; page: number; limit: number }) {
    const runs = await prisma.courseRun.findMany({
      include: {
        course: { select: { id: true, name: true } },
        enrollments: {
          where: { isActive: true },
          include: { videoProgress: { where: { isCompleted: true }, select: { id: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const aggregates = await Promise.all(
      runs.map(async (r) => {
        const totalVideos = await prisma.unit.count({
          where: { type: UnitType.video, subsection: { section: { courseId: r.courseId } } },
        });
        let inRange = r.enrollments;
        if (params.from || params.to) {
          inRange = inRange.filter(
            (e) =>
              (!params.from || e.assignedAt >= params.from) &&
              (!params.to || e.assignedAt <= params.to),
          );
        }
        const completed = totalVideos === 0
          ? 0
          : inRange.filter((e) => e.videoProgress.length >= totalVideos).length;
        return {
          courseRunId: r.id,
          runName: r.runName,
          courseId: r.course.id,
          courseName: r.course.name,
          enrolled: inRange.length,
          completed,
          percentage: inRange.length === 0 ? 0 : Math.round((completed / inRange.length) * 100),
        };
      }),
    );

    const totalItems = aggregates.length;
    const items = aggregates.slice((params.page - 1) * params.limit, params.page * params.limit);
    return {
      items,
      meta: {
        page: params.page,
        limit: params.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / params.limit)),
      },
    };
  }

  /**
   * Aggregated watch time per course (in hours) for the optional date range.
   */
  async timeSpentReport(params: { from?: Date; to?: Date; page: number; limit: number }) {
    const where: import('@aaft/db-lib').Prisma.VideoProgressWhereInput =
      params.from || params.to
        ? { updatedAt: { ...(params.from && { gte: params.from }), ...(params.to && { lte: params.to }) } }
        : {};

    const rows = await prisma.videoProgress.findMany({
      where,
      include: {
        unit: { include: { subsection: { include: { section: { include: { course: true } } } } } },
      },
    });

    const byCourse = new Map<string, { course: string; seconds: number }>();
    for (const r of rows) {
      const courseId = r.unit.subsection.section.courseId;
      const courseName = r.unit.subsection.section.course.name;
      const cur = byCourse.get(courseId) ?? { course: courseName, seconds: 0 };
      cur.seconds += r.totalWatchTime;
      byCourse.set(courseId, cur);
    }

    const aggregates = Array.from(byCourse.entries()).map(([courseId, v]) => ({
      courseId,
      course: v.course,
      hours: Math.round((v.seconds / 3600) * 10) / 10,
      seconds: v.seconds,
    }));
    aggregates.sort((a, b) => b.seconds - a.seconds);

    const totalItems = aggregates.length;
    const items = aggregates.slice((params.page - 1) * params.limit, params.page * params.limit);
    return {
      items,
      meta: {
        page: params.page,
        limit: params.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / params.limit)),
      },
    };
  }

  // ------------------------------------------------------------------
  // Per-student report
  // ------------------------------------------------------------------

  async studentReport(studentId: string): Promise<StudentReportDto> {
    const student = await prisma.user.findFirst({
      where: { id: studentId, role: UserRole.student },
      include: {
        enrollments: {
          where: { isActive: true },
          include: { courseRun: { select: { id: true, courseId: true } } },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const enrolledCourseIds = student.enrollments
      .map((e) => e.courseRun?.courseId)
      .filter((v): v is string => Boolean(v));

    const courses = await prisma.course.findMany({
      where: { id: { in: enrolledCourseIds } },
      include: COURSE_INCLUDE,
    });

    const enrolledCourses = await Promise.all(
      courses.map(async (course) => {
        const enrollment = student.enrollments.find((e) => e.courseRun?.courseId === course.id);
        let progress: CourseProgressDto = { completedVideos: 0, totalVideos: 0, percentage: 0 };
        if (enrollment) {
          const totalVideos = await prisma.unit.count({
            where: { type: UnitType.video, subsection: { section: { courseId: course.id } } },
          });
          const completedVideos = await prisma.videoProgress.count({
            where: {
              enrollmentId: enrollment.id,
              isCompleted: true,
              unit: { type: UnitType.video, subsection: { section: { courseId: course.id } } },
            },
          });
          progress = {
            completedVideos,
            totalVideos,
            percentage: totalVideos === 0 ? 0 : Math.round((completedVideos / totalVideos) * 100),
          };
        }
        return { ...toCourseDto(course), progress };
      }),
    );

    const totalWatchTime = (
      await prisma.videoProgress.aggregate({
        where: { enrollment: { studentId } },
        _sum: { totalWatchTime: true },
      })
    )._sum.totalWatchTime ?? 0;

    return {
      student: toStudentDto(student),
      enrolledCourses,
      totalWatchTime,
    };
  }
}

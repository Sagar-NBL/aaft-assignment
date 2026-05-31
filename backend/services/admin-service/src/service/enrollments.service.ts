import {
  prisma,
  Prisma,
  CourseRun,
  EnrollmentType,
  UnitType,
} from '@aaft/db-lib';
import { type CourseProgressDto, NotFoundException } from '@aaft/common-lib';

interface AdminEnrollmentDto {
  id: string;
  studentId: string;
  courseId: string;
  assignedAt: string;
  studentName: string;
  courseName: string;
  progress: CourseProgressDto;
}

/**
 * EnrollmentsService (admin) — bulk-assigns students to courses by way of the
 * implicit "default" course run per course. Part A's frontend treats courses as
 * the assignment target; we transparently keep enrollments scoped to a CourseRun
 * so Part B (multi-run scheduling) layers cleanly on top.
 */
export class EnrollmentsService {
  /**
   * Locate or create the per-course default CourseRun. Re-used by both bulk
   * enrollment and student self-enroll (Part B).
   */
  async ensureDefaultCourseRun(courseId: string): Promise<CourseRun> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);

    const existing = await prisma.courseRun.findFirst({
      where: { courseId, runName: 'Default Run', isActive: true },
    });
    if (existing) return existing;

    return prisma.courseRun.create({
      data: {
        courseId,
        runName: 'Default Run',
        enrollmentType: EnrollmentType.free,
        passThreshold: new Prisma.Decimal(60),
        isActive: true,
      },
    });
  }

  // ------------------------------------------------------------------
  // Bulk enroll
  // ------------------------------------------------------------------

  async bulkEnroll(input: { studentIds: string[]; courseIds: string[] }): Promise<{
    success: true;
    enrollments: Array<{ id: string; studentId: string; courseId: string; assignedAt: string }>;
  }> {
    // 1. Ensure a default run exists for each course
    const runsByCourse = new Map<string, CourseRun>();
    for (const courseId of input.courseIds) {
      const run = await this.ensureDefaultCourseRun(courseId);
      runsByCourse.set(courseId, run);
    }

    // 2. For each (student, course) pair create (or reactivate) an enrollment.
    const result: Array<{ id: string; studentId: string; courseId: string; assignedAt: string }> = [];
    for (const studentId of input.studentIds) {
      for (const courseId of input.courseIds) {
        const run = runsByCourse.get(courseId)!;
        const enrollment = await prisma.enrollment.upsert({
          where: { studentId_courseRunId: { studentId, courseRunId: run.id } },
          create: {
            studentId,
            courseRunId: run.id,
            isActive: true,
          },
          update: { isActive: true },
        });
        result.push({
          id: enrollment.id,
          studentId,
          courseId,
          assignedAt: enrollment.assignedAt.toISOString().slice(0, 10),
        });
      }
    }
    return { success: true, enrollments: result };
  }

  // ------------------------------------------------------------------
  // List
  // ------------------------------------------------------------------

  async listEnrollments(): Promise<{ items: AdminEnrollmentDto[] }> {
    const enrollments = await prisma.enrollment.findMany({
      where: { isActive: true },
      include: {
        student: true,
        courseRun: { include: { course: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const items: AdminEnrollmentDto[] = await Promise.all(
      enrollments.map(async (e) => {
        const progress = await this.computeCourseProgress(e.id, e.courseRun.courseId);
        return {
          id: e.id,
          studentId: e.studentId,
          courseId: e.courseRun.courseId,
          assignedAt: e.assignedAt.toISOString().slice(0, 10),
          studentName: e.student.name,
          courseName: e.courseRun.course.name,
          progress,
        };
      }),
    );

    return { items };
  }

  // ------------------------------------------------------------------
  // Progress helper
  // ------------------------------------------------------------------

  async computeCourseProgress(enrollmentId: string, courseId: string): Promise<CourseProgressDto> {
    const totalVideos = await prisma.unit.count({
      where: { type: UnitType.video, subsection: { section: { courseId } } },
    });
    if (totalVideos === 0) {
      return { completedVideos: 0, totalVideos: 0, percentage: 0 };
    }
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

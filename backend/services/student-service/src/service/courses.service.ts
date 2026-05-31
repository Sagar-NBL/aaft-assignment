import { prisma, UnitType } from '@aaft/db-lib';
import {
  toCourseDto,
  COURSE_INCLUDE,
  NotFoundException,
  type CourseProgressDto,
  type StudentCourseCardDto,
  type VideoProgressDto,
  type StudentCourseStatus,
} from '@aaft/common-lib';
import { EnrollmentLookupService, type EnrollmentWithCourse } from './enrollment-lookup.service';

interface ListParams {
  search?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'all';
}

interface CourseDetailLessonDto {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  progress: VideoProgressDto;
}

interface CourseDetailDto {
  course: { id: string; name: string; description: string; thumbnail: string };
  progress: CourseProgressDto;
  lessons: CourseDetailLessonDto[];
}

/**
 * StudentCoursesService — student-facing read views.
 *
 * Enforces enrollment scoping on every read so students cannot peek at content
 * they haven't been assigned. Progress aggregation is computed live from
 * `video_progress` rows rather than denormalized columns to keep the schema lean.
 */
export class StudentCoursesService {
  constructor(private readonly lookup: EnrollmentLookupService) {}

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private async computeProgress(enrollmentId: string, courseId: string): Promise<CourseProgressDto> {
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

  private deriveStatus(progress: CourseProgressDto): StudentCourseStatus {
    if (progress.totalVideos === 0) return 'not_started';
    if (progress.completedVideos === 0) return 'not_started';
    if (progress.completedVideos >= progress.totalVideos) return 'completed';
    return 'in_progress';
  }

  // ------------------------------------------------------------------
  // List
  // ------------------------------------------------------------------

  async listForStudent(studentId: string, params: ListParams): Promise<{ items: StudentCourseCardDto[] }> {
    const enrollments = await this.lookup.listForStudent(studentId);

    // Materialize each (enrollment, course) into the card shape, filtering by search/status.
    const cards: StudentCourseCardDto[] = [];
    for (const e of enrollments) {
      const course = await prisma.course.findUnique({
        where: { id: e.courseRun.courseId },
        include: COURSE_INCLUDE,
      });
      if (!course) continue;
      const progress = await this.computeProgress(e.id, course.id);
      const status = this.deriveStatus(progress);

      cards.push({ ...toCourseDto(course), progress, status });
    }

    const query = params.search?.trim().toLowerCase();
    return {
      items: cards.filter((c) => {
        if (params.status !== 'all' && c.status !== params.status) return false;
        if (query && !`${c.name} ${c.description}`.toLowerCase().includes(query)) return false;
        return true;
      }),
    };
  }

  // ------------------------------------------------------------------
  // Detail
  // ------------------------------------------------------------------

  async getCourseDetail(studentId: string, courseId: string): Promise<CourseDetailDto> {
    const enrollment = await this.lookup.requireEnrollment(studentId, courseId);
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: COURSE_INCLUDE,
    });
    if (!course) throw new NotFoundException('Course not found');

    const progressMap = await this.loadProgressMap(enrollment.id);

    const lessons: CourseDetailLessonDto[] = [];
    for (const section of [...course.sections].sort((a, b) => a.order - b.order)) {
      for (const sub of [...section.subsections].sort((a, b) => a.order - b.order)) {
        const units = [...sub.units]
          .filter((u) => u.type === UnitType.video)
          .sort((a, b) => a.order - b.order);
        for (const u of units) {
          const vp = progressMap.get(u.id);
          lessons.push({
            id: u.id,
            title: u.title,
            description: u.description ?? '',
            videoUrl: u.content?.videoUrl ?? '',
            duration: u.content?.duration ?? 0,
            progress: this.toVideoProgressDto(vp),
          });
        }
      }
    }

    const courseProgress = await this.computeProgress(enrollment.id, courseId);

    return {
      course: {
        id: course.id,
        name: course.name,
        description: course.description,
        thumbnail: course.thumbnail ?? '',
      },
      progress: courseProgress,
      lessons,
    };
  }

  private async loadProgressMap(enrollmentId: string) {
    const rows = await prisma.videoProgress.findMany({ where: { enrollmentId } });
    const map = new Map<string, (typeof rows)[number]>();
    for (const r of rows) map.set(r.unitId, r);
    return map;
  }

  private toVideoProgressDto(vp: {
    lastWatched: number;
    completionPercent: { toNumber(): number } | number;
    isCompleted: boolean;
    watchedSegments: unknown;
    totalWatchTime: number;
  } | undefined): VideoProgressDto {
    if (!vp) {
      return { lastWatched: 0, percentage: 0, isCompleted: false, watchedSegments: [], totalWatchTime: 0 };
    }
    return {
      lastWatched: vp.lastWatched,
      percentage:
        typeof vp.completionPercent === 'number' ? vp.completionPercent : vp.completionPercent.toNumber(),
      isCompleted: vp.isCompleted,
      watchedSegments: Array.isArray(vp.watchedSegments)
        ? (vp.watchedSegments as Array<[number, number]>)
        : [],
      totalWatchTime: vp.totalWatchTime,
    };
  }

  // ------------------------------------------------------------------
  // Course-level progress (lightweight)
  // ------------------------------------------------------------------

  async courseProgress(studentId: string, courseId: string): Promise<CourseProgressDto> {
    const enrollment = await this.lookup.requireEnrollment(studentId, courseId);
    return this.computeProgress(enrollment.id, courseId);
  }
}

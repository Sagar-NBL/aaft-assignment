import type { Course, Section, Subsection, Unit, UnitContent } from '@aaft/db-lib';
import { UnitType } from '@aaft/db-lib';
import type { CourseDto, LessonDto } from '../types';

export type CourseWithHierarchy = Course & {
  sections?: Array<
    Section & {
      subsections?: Array<
        Subsection & {
          units?: Array<Unit & { content?: UnitContent | null }>;
        }
      >;
    }
  >;
};

/**
 * Flatten the Course → Section → Subsection → Unit hierarchy into the flat
 * `lessons[]` array the Part A frontend expects. Only video units are surfaced
 * as lessons. Ordering: (section.order, subsection.order, unit.order).
 */
export function flattenLessons(course: CourseWithHierarchy): LessonDto[] {
  const lessons: LessonDto[] = [];
  let running = 0;
  const sections = [...(course.sections ?? [])].sort((a, b) => a.order - b.order);
  for (const section of sections) {
    const subsections = [...(section.subsections ?? [])].sort((a, b) => a.order - b.order);
    for (const sub of subsections) {
      const units = [...(sub.units ?? [])]
        .filter((u) => u.type === UnitType.video)
        .sort((a, b) => a.order - b.order);
      for (const unit of units) {
        lessons.push({
          id: unit.id,
          courseId: course.id,
          title: unit.title,
          description: unit.description ?? '',
          videoUrl: unit.content?.videoUrl ?? '',
          duration: unit.content?.duration ?? 0,
          order: running++,
        });
      }
    }
  }
  return lessons;
}

export function toCourseDto(course: CourseWithHierarchy): CourseDto {
  return {
    id: course.id,
    name: course.name,
    description: course.description,
    thumbnail: course.thumbnail ?? '',
    lessons: flattenLessons(course),
    createdAt: course.createdAt.toISOString(),
  };
}

/** Prisma `include` graph that loads the full course → unit hierarchy. */
export const COURSE_INCLUDE = {
  sections: {
    orderBy: { order: 'asc' as const },
    include: {
      subsections: {
        orderBy: { order: 'asc' as const },
        include: {
          units: {
            orderBy: { order: 'asc' as const },
            include: { content: true },
          },
        },
      },
    },
  },
};

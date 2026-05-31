import {
  BaseService,
  prisma,
  Prisma,
  Course,
  CourseStatus,
  UnitType,
} from '@aaft/db-lib';
import {
  NotFoundException,
  toCourseDto,
  COURSE_INCLUDE,
  type CourseDto,
} from '@aaft/common-lib';

const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';

/**
 * CoursesService — admin CRUD over courses with auto-managed default Section
 * and Subsection so Part A "lessons" can be inserted directly under a course
 * without the admin needing to know about the Part B hierarchy.
 */
export class CoursesService extends BaseService<
  Course,
  Prisma.CourseCreateInput,
  Prisma.CourseUpdateInput,
  Prisma.CourseWhereUniqueInput,
  Prisma.CourseWhereInput,
  Prisma.CourseOrderByWithRelationInput,
  Prisma.CourseInclude
> {
  protected get model() {
    return prisma.course;
  }
  protected get entityName(): string {
    return 'Course';
  }

  async listCourses(): Promise<{ items: CourseDto[] }> {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: COURSE_INCLUDE,
    });
    return { items: courses.map(toCourseDto) };
  }

  async getCourse(id: string): Promise<CourseDto> {
    const course = await prisma.course.findUnique({
      where: { id },
      include: COURSE_INCLUDE,
    });
    if (!course) throw new NotFoundException('Course not found');
    return toCourseDto(course);
  }

  async createCourse(input: {
    name: string;
    description: string;
    thumbnail?: string;
  }): Promise<CourseDto> {
    // Create course + default section + default subsection in one transaction so
    // lessons can be added immediately afterward (Part A flow).
    const created = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          name: input.name,
          description: input.description,
          thumbnail: input.thumbnail ?? DEFAULT_THUMBNAIL,
          status: CourseStatus.published,
        },
      });
      const section = await tx.section.create({
        data: { courseId: course.id, title: 'Lessons', order: 0 },
      });
      await tx.subsection.create({
        data: { sectionId: section.id, title: 'Default', order: 0 },
      });
      return course;
    });

    return this.getCourse(created.id);
  }

  async updateCourse(
    id: string,
    input: { name?: string; description?: string; thumbnail?: string },
  ): Promise<CourseDto> {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');

    const data: Prisma.CourseUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.thumbnail !== undefined) data.thumbnail = input.thumbnail;

    await prisma.course.update({ where: { id }, data });
    return this.getCourse(id);
  }

  async deleteCourse(id: string): Promise<void> {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');
    // Cascade deletes are wired in the Prisma schema (sections → subsections → units).
    await prisma.course.delete({ where: { id } });
  }

  /**
   * Locate (or auto-create) the default subsection that admin-flow lessons go into.
   * Idempotent — Part A keeps the hierarchy flat from the admin's perspective.
   */
  async ensureDefaultSubsection(courseId: string): Promise<string> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { sections: { include: { subsections: true }, orderBy: { order: 'asc' } } },
    });
    if (!course) throw new NotFoundException('Course not found');

    let section = course.sections[0];
    if (!section) {
      section = await prisma.section.create({
        data: { courseId, title: 'Lessons', order: 0 },
        include: { subsections: true },
      });
    }
    let subsection = section.subsections[0];
    if (!subsection) {
      subsection = await prisma.subsection.create({
        data: { sectionId: section.id, title: 'Default', order: 0 },
      });
    }
    return subsection.id;
  }

  /** Used by reports — counts video units (i.e. Part A lessons) per course. */
  async countVideoUnits(courseId: string): Promise<number> {
    return prisma.unit.count({
      where: {
        type: UnitType.video,
        subsection: { section: { courseId } },
      },
    });
  }
}

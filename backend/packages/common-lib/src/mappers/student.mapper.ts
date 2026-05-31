import type { User, Enrollment, CourseRun } from '@aaft/db-lib';
import { generateAvatar } from '../avatar';
import type { StudentDto } from '../types';

type UserWithEnrollments = User & {
  enrollments?: Array<Enrollment & { courseRun?: Pick<CourseRun, 'id' | 'courseId'> | null }>;
};

/**
 * Map a Prisma `User` (with optional enrollments → courseRun) into the
 * frontend-contract `StudentDto`. `enrolledCourseIds` is derived from the
 * active enrollments join.
 */
export function toStudentDto(user: UserWithEnrollments): StudentDto {
  const enrolledCourseIds = (user.enrollments ?? [])
    .filter((e) => e.isActive && e.courseRun)
    .map((e) => e.courseRun!.courseId)
    .filter((cid, i, arr) => arr.indexOf(cid) === i);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? generateAvatar(user.name),
    enrolledCourseIds,
    createdAt: user.createdAt.toISOString(),
  };
}

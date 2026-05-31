/* eslint-disable no-console */
/**
 * AAFT LMS — Database seed.
 *
 * Creates:
 *   - Demo accounts:  admin@aaft.com / Admin@123
 *                     instructor@aaft.com / Instructor@123
 *                     student@aaft.com / Student@123 (+ Priya, Liam)
 *   - 3 sample courses matching `src/mocks/seed.ts` in the reference frontend
 *   - Lessons (video units) inside auto-created default Section + Subsection per course
 *   - Default course runs per course
 *   - Enrollments per frontend mock
 *   - One in-progress video progress row for the demo student
 *
 * Re-runnable: every entity is upserted by a stable natural key.
 */

import bcrypt from 'bcrypt';
import {
  CourseStatus,
  EnrollmentType,
  PrismaClient,
  UnitType,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar: string;
}

const users: SeedUser[] = [
  {
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@aaft.com',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
    name: process.env.SEED_ADMIN_NAME ?? 'Avery Admin',
    role: UserRole.admin,
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  },
  {
    email: process.env.SEED_INSTRUCTOR_EMAIL ?? 'instructor@aaft.com',
    password: process.env.SEED_INSTRUCTOR_PASSWORD ?? 'Instructor@123',
    name: process.env.SEED_INSTRUCTOR_NAME ?? 'Ivy Instructor',
    role: UserRole.instructor,
    avatar:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop',
  },
  {
    email: process.env.SEED_STUDENT_EMAIL ?? 'student@aaft.com',
    password: process.env.SEED_STUDENT_PASSWORD ?? 'Student@123',
    name: process.env.SEED_STUDENT_NAME ?? 'Jordan Miles',
    role: UserRole.student,
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  },
  {
    email: 'priya.singh@example.com',
    password: 'Student@123',
    name: 'Priya Singh',
    role: UserRole.student,
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  {
    email: 'liam.chen@example.com',
    password: 'Student@123',
    name: 'Liam Chen',
    role: UserRole.student,
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  },
];

interface SeedCourse {
  name: string;
  description: string;
  thumbnail: string;
  lessons: Array<{ title: string; description: string; videoUrl: string; duration: number }>;
}

const courses: SeedCourse[] = [
  {
    name: 'Cinematic Storytelling Lab',
    description:
      'Master visual narrative, shot composition, and directorial vision for premium film production.',
    thumbnail:
      'https://images.unsplash.com/photo-1485846234544-eee5449bb73d?w=800&h=500&fit=crop',
    lessons: [
      {
        title: 'Introduction to Visual Storytelling',
        description: 'Foundations of cinematic language.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 720,
      },
      {
        title: 'Shot Composition Mastery',
        description: 'Framing techniques for emotional impact.',
        videoUrl: 'https://player.vimeo.com/video/76979871',
        duration: 540,
      },
      {
        title: 'Directing Actors',
        description: 'Guide performances with clarity and empathy.',
        videoUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 600,
      },
    ],
  },
  {
    name: 'Advanced Motion Design',
    description: 'Create kinetic typography, UI motion, and broadcast-ready animations.',
    thumbnail:
      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&h=500&fit=crop',
    lessons: [
      {
        title: 'Motion Principles',
        description: 'Timing, spacing, and easing fundamentals.',
        videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        duration: 480,
      },
      {
        title: 'After Effects Workflow',
        description: 'Professional compositing pipeline.',
        videoUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: 900,
      },
    ],
  },
  {
    name: 'Immersive Audio Workshop',
    description: 'Sound design, mixing, and spatial audio for film and digital media.',
    thumbnail:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=500&fit=crop',
    lessons: [
      {
        title: 'Sound Design Basics',
        description: 'Layering foley and ambience.',
        videoUrl: 'https://www.youtube.com/watch?v=EngW7tLk6R8',
        duration: 420,
      },
    ],
  },
];

interface EnrollSpec {
  studentEmail: string;
  courseName: string;
}

const enrollments: EnrollSpec[] = [
  { studentEmail: 'student@aaft.com',        courseName: 'Cinematic Storytelling Lab' },
  { studentEmail: 'student@aaft.com',        courseName: 'Advanced Motion Design' },
  { studentEmail: 'priya.singh@example.com', courseName: 'Cinematic Storytelling Lab' },
  { studentEmail: 'priya.singh@example.com', courseName: 'Immersive Audio Workshop' },
];

// ---------------------------------------------------------------------
// Seed routines
// ---------------------------------------------------------------------

async function seedUsers() {
  console.log('▶  Seeding users...');
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        avatar: u.avatar,
        isActive: true,
      },
      // Re-hash & overwrite the password on every run so the seed is fully
      // idempotent — operators don't have to wipe the DB just because the
      // SEED_*_PASSWORD env vars changed since the first boot.
      update: {
        passwordHash,
        name: u.name,
        role: u.role,
        avatar: u.avatar,
        isActive: true,
      },
    });
    console.log(`   ✓ ${u.role.padEnd(10)} ${u.email}`);
  }
}

async function seedCourses() {
  console.log('▶  Seeding courses...');
  const instructor = await prisma.user.findUnique({ where: { email: 'instructor@aaft.com' } });

  for (const c of courses) {
    // Upsert course
    let course = await prisma.course.findFirst({ where: { name: c.name } });
    if (!course) {
      course = await prisma.course.create({
        data: {
          name: c.name,
          description: c.description,
          thumbnail: c.thumbnail,
          status: CourseStatus.published,
          instructorId: instructor?.id ?? null,
        },
      });
    } else {
      course = await prisma.course.update({
        where: { id: course.id },
        data: {
          description: c.description,
          thumbnail: c.thumbnail,
          status: CourseStatus.published,
          instructorId: course.instructorId ?? instructor?.id ?? null,
        },
      });
    }

    // Default section + subsection
    let section = await prisma.section.findFirst({ where: { courseId: course.id, title: 'Lessons' } });
    if (!section) {
      section = await prisma.section.create({
        data: { courseId: course.id, title: 'Lessons', order: 0 },
      });
    }
    let subsection = await prisma.subsection.findFirst({
      where: { sectionId: section.id, title: 'Default' },
    });
    if (!subsection) {
      subsection = await prisma.subsection.create({
        data: { sectionId: section.id, title: 'Default', order: 0 },
      });
    }

    // Lessons (as video units)
    for (let i = 0; i < c.lessons.length; i++) {
      const l = c.lessons[i];
      const existing = await prisma.unit.findFirst({
        where: { subsectionId: subsection.id, title: l.title, type: UnitType.video },
        include: { content: true },
      });
      if (existing) {
        await prisma.unit.update({
          where: { id: existing.id },
          data: { description: l.description, order: i },
        });
        if (existing.content) {
          await prisma.unitContent.update({
            where: { id: existing.content.id },
            data: { videoUrl: l.videoUrl, duration: l.duration },
          });
        } else {
          await prisma.unitContent.create({
            data: { unitId: existing.id, videoUrl: l.videoUrl, duration: l.duration },
          });
        }
      } else {
        await prisma.unit.create({
          data: {
            subsectionId: subsection.id,
            title: l.title,
            description: l.description,
            type: UnitType.video,
            order: i,
            content: { create: { videoUrl: l.videoUrl, duration: l.duration } },
          },
        });
      }
    }

    // Default course run
    let run = await prisma.courseRun.findFirst({
      where: { courseId: course.id, runName: 'Default Run' },
    });
    if (!run) {
      run = await prisma.courseRun.create({
        data: {
          courseId: course.id,
          runName: 'Default Run',
          enrollmentType: EnrollmentType.free,
          isActive: true,
        },
      });
    }

    // Default grading config
    await prisma.gradingConfig.upsert({
      where: { courseRunId: run.id },
      create: {
        courseRunId: run.id,
        weights: { quizzes: 60, videoCompletion: 40 },
      },
      update: {},
    });

    console.log(`   ✓ ${c.name} (${c.lessons.length} lessons)`);
  }
}

async function seedEnrollments() {
  console.log('▶  Seeding enrollments...');
  for (const e of enrollments) {
    const student = await prisma.user.findUnique({ where: { email: e.studentEmail } });
    const course = await prisma.course.findFirst({ where: { name: e.courseName } });
    if (!student || !course) {
      console.warn(`   ✗ missing user or course for ${JSON.stringify(e)}`);
      continue;
    }
    const run = await prisma.courseRun.findFirst({
      where: { courseId: course.id, runName: 'Default Run' },
    });
    if (!run) continue;

    await prisma.enrollment.upsert({
      where: { studentId_courseRunId: { studentId: student.id, courseRunId: run.id } },
      create: { studentId: student.id, courseRunId: run.id, isActive: true },
      update: { isActive: true },
    });
    console.log(`   ✓ ${e.studentEmail.padEnd(28)} → ${e.courseName}`);
  }
}

async function seedDemoProgress() {
  console.log('▶  Seeding demo video progress...');
  const student = await prisma.user.findUnique({ where: { email: 'student@aaft.com' } });
  if (!student) return;

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, isActive: true },
    include: { courseRun: true },
  });
  if (!enrollment) return;

  // Pick the first video unit of the enrolled course
  const unit = await prisma.unit.findFirst({
    where: {
      type: UnitType.video,
      subsection: { section: { courseId: enrollment.courseRun.courseId } },
    },
    orderBy: { order: 'asc' },
  });
  if (!unit) return;

  await prisma.videoProgress.upsert({
    where: { enrollmentId_unitId: { enrollmentId: enrollment.id, unitId: unit.id } },
    create: {
      enrollmentId: enrollment.id,
      unitId: unit.id,
      lastWatched: 180,
      completionPercent: 25,
      isCompleted: false,
      watchedSegments: [[0, 180]],
      totalWatchTime: 180,
    },
    update: {},
  });

  console.log('   ✓ demo progress row (25% on first lesson)');
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  AAFT LMS — Seed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await seedUsers();
  await seedCourses();
  await seedEnrollments();
  await seedDemoProgress();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Seed complete ✔');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

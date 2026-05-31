import type { Course, Enrollment, Student, User, VideoProgress } from '@/types';

export const seedUsers: Record<string, { password: string; user: User }> = {
  'admin@aaft.com': {
    password: 'Admin@123',
    user: {
      id: 'admin_1',
      name: 'Avery Admin',
      email: 'admin@aaft.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    },
  },
  'student@aaft.com': {
    password: 'Student@123',
    user: {
      id: 'student_1',
      name: 'Jordan Miles',
      email: 'student@aaft.com',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    },
  },
};

export const seedCourses: Course[] = [
  {
    id: 'course_1',
    name: 'Cinematic Storytelling Lab',
    description: 'Master visual narrative, shot composition, and directorial vision for premium film production.',
    thumbnail: 'https://images.unsplash.com/photo-1485846234544-eee5449bb73d?w=800&h=500&fit=crop',
    createdAt: '2025-01-10',
    lessons: [
      {
        id: 'lesson_1_1',
        courseId: 'course_1',
        title: 'Introduction to Visual Storytelling',
        description: 'Foundations of cinematic language.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 720,
        order: 1,
      },
      {
        id: 'lesson_1_2',
        courseId: 'course_1',
        title: 'Shot Composition Mastery',
        description: 'Framing techniques for emotional impact.',
        videoUrl: 'https://player.vimeo.com/video/76979871',
        duration: 540,
        order: 2,
      },
      {
        id: 'lesson_1_3',
        courseId: 'course_1',
        title: 'Directing Actors',
        description: 'Guide performances with clarity and empathy.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 600,
        order: 3,
      },
    ],
  },
  {
    id: 'course_2',
    name: 'Advanced Motion Design',
    description: 'Create kinetic typography, UI motion, and broadcast-ready animations.',
    thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&h=500&fit=crop',
    createdAt: '2025-02-01',
    lessons: [
      {
        id: 'lesson_2_1',
        courseId: 'course_2',
        title: 'Motion Principles',
        description: 'Timing, spacing, and easing fundamentals.',
        videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        duration: 480,
        order: 1,
      },
      {
        id: 'lesson_2_2',
        courseId: 'course_2',
        title: 'After Effects Workflow',
        description: 'Professional compositing pipeline.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: 900,
        order: 2,
      },
    ],
  },
  {
    id: 'course_3',
    name: 'Immersive Audio Workshop',
    description: 'Sound design, mixing, and spatial audio for film and digital media.',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=500&fit=crop',
    createdAt: '2025-02-15',
    lessons: [
      {
        id: 'lesson_3_1',
        courseId: 'course_3',
        title: 'Sound Design Basics',
        description: 'Layering foley and ambience.',
        videoUrl: 'https://www.youtube.com/watch?v=EngW7tLk6R8',
        duration: 420,
        order: 1,
      },
    ],
  },
];

export const seedStudents: Student[] = [
  {
    id: 'student_1',
    name: 'Jordan Miles',
    email: 'student@aaft.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    enrolledCourseIds: ['course_1', 'course_2'],
    createdAt: '2025-01-05',
  },
  {
    id: 'student_2',
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    enrolledCourseIds: ['course_1', 'course_3'],
    createdAt: '2025-01-12',
  },
  {
    id: 'student_3',
    name: 'Liam Chen',
    email: 'liam.chen@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    enrolledCourseIds: [],
    createdAt: '2025-02-20',
  },
];

export const seedEnrollments: Enrollment[] = [
  { id: 'enr_1', studentId: 'student_1', courseId: 'course_1', assignedAt: '2025-01-06' },
  { id: 'enr_2', studentId: 'student_1', courseId: 'course_2', assignedAt: '2025-01-08' },
  { id: 'enr_3', studentId: 'student_2', courseId: 'course_1', assignedAt: '2025-01-14' },
  { id: 'enr_4', studentId: 'student_2', courseId: 'course_3', assignedAt: '2025-01-15' },
];

export const seedVideoProgress: Record<string, VideoProgress> = {
  lesson_1_1: {
    lastWatched: 180,
    percentage: 25,
    isCompleted: false,
    watchedSegments: [[0, 180]],
    totalWatchTime: 180,
  },
};

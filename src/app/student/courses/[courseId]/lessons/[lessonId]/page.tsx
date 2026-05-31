'use client';

import { use } from 'react';
import Link from 'next/link';
import { useGetStudentCourseDetailQuery } from '@/services/api';
import { useAppSelector } from '@/store/hooks';
import { VideoPlayer } from '@/components/student/VideoPlayer';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { isInitialQueryLoad } from '@/lib/query-utils';

export default function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  const { data, isLoading } = useGetStudentCourseDetailQuery(courseId);
  const storedProgress = useAppSelector((s) => s.progress.videoProgress[lessonId]);

  if (isInitialQueryLoad(isLoading, data)) return <Skeleton className="aspect-video w-full" />;
  if (!data) return <p>Lesson not found</p>;

  const lessons = data.lessons;
  const idx = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[idx];
  if (!lesson) return <p>Lesson not found</p>;

  const prev = idx > 0 ? lessons[idx - 1] : undefined;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : undefined;

  const initialProgress = storedProgress ?? lesson.progress;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/student/courses' },
          { label: data.course.name, href: `/student/courses/${courseId}` },
          { label: lesson.title },
        ]}
      />
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      <p className="text-[rgb(var(--muted-foreground))]">{lesson.description}</p>
      <VideoPlayer
        lesson={lesson}
        courseId={courseId}
        initialProgress={initialProgress}
        onPrev={prev ? () => (window.location.href = `/student/courses/${courseId}/lessons/${prev.id}`) : undefined}
        onNext={next ? () => (window.location.href = `/student/courses/${courseId}/lessons/${next.id}`) : undefined}
      />
      <div className="flex justify-between gap-4">
        {prev && (
          <Link href={`/student/courses/${courseId}/lessons/${prev.id}`} className="text-sm text-[rgb(var(--gold))] hover:underline">
            ← {prev.title}
          </Link>
        )}
        {next && (
          <Link href={`/student/courses/${courseId}/lessons/${next.id}`} className="text-sm text-[rgb(var(--gold))] hover:underline ml-auto">
            {next.title} →
          </Link>
        )}
      </div>
    </div>
  );
}

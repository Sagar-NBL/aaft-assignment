'use client';

import { use } from 'react';
import Link from 'next/link';
import { CheckCircle, Circle, Play } from 'lucide-react';
import { useGetStudentCourseDetailQuery } from '@/services/api';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { PageHeader } from '@/components/common/PageHeader';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isInitialQueryLoad } from '@/lib/query-utils';
import { formatDuration } from '@/lib/utils';

export default function StudentCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data, isLoading } = useGetStudentCourseDetailQuery(courseId);

  if (isInitialQueryLoad(isLoading, data)) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p>Course not found</p>;

  const { course, progress, lessons } = data;

  const nextLesson = lessons.find((l) => !l.progress.isCompleted) ?? lessons[0];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/student/courses' },
          { label: course.name },
        ]}
      />
      <PageHeader
        title={course.name}
        description={course.description}
        action={
          nextLesson && (
            <Link href={`/student/courses/${courseId}/lessons/${nextLesson.id}`}>
              <Button variant="gold">
                <Play className="h-4 w-4" /> {lessons.some((l) => l.progress.percentage > 0) ? 'Resume' : 'Start'}
              </Button>
            </Link>
          )
        }
      />
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Overall progress</span>
          <span className="font-semibold text-[rgb(var(--gold))]">{progress.percentage}%</span>
        </div>
        <Progress value={progress.percentage} />
      </div>
      <ul className="space-y-3">
        {lessons.map((lesson, i) => (
          <li key={lesson.id}>
            <Link
              href={`/student/courses/${courseId}/lessons/${lesson.id}`}
              className="flex items-center gap-4 rounded-xl border border-[rgb(var(--border))] p-4 transition hover:border-[rgb(var(--gold))]/50 hover:bg-[rgb(var(--secondary))]/30"
            >
              {lesson.progress.isCompleted ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-[rgb(var(--muted-foreground))] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {i + 1}. {lesson.title}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">{formatDuration(lesson.duration)}</p>
              </div>
              <span className="text-sm text-[rgb(var(--gold))]">{lesson.progress.percentage}%</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

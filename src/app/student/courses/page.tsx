'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { useGetStudentCoursesQuery } from '@/services/api';
import { CourseCard } from '@/components/student/CourseCard';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isInitialQueryLoad } from '@/lib/query-utils';
const filters = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
] as const;

export default function StudentCoursesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const { data, isLoading } = useGetStudentCoursesQuery({
    search: search || undefined,
    status: status === 'all' ? undefined : status,
  });

  const courses = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Your assigned learning paths" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted-foreground))]" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search courses"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={status === f.id ? 'gold' : 'outline'}
              onClick={() => setStatus(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      {isInitialQueryLoad(isLoading, data) ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" description="Try adjusting your filters or contact your administrator." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { use } from 'react';
import { SafeImage } from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useGetStudentReportQuery } from '@/services/api';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { isInitialQueryLoad } from '@/lib/query-utils';
import { formatWatchTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isFetching, error } = useGetStudentReportQuery(id);

  if (isInitialQueryLoad(isLoading, data)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-500">Failed to load student data. Please try refreshing the page.</p>
        <Link href="/admin/students">
          <Button variant="outline">Back to students</Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {isFetching && <p className="text-sm text-muted-foreground">Loading student data...</p>}
        {!isFetching && <p>Student not found.</p>}
        <Link href="/admin/students">
          <Button variant="outline">Back to students</Button>
        </Link>
      </div>
    );
  }

  const { student, enrolledCourses, totalWatchTime } = data;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Students', href: '/admin/students' },
          { label: student.name },
        ]}
      />
      <PageHeader title={student.name} description={student.email} />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <SafeImage
            src={student.avatar}
            alt=""
            width={96}
            height={96}
            className="rounded-full border-2 border-[rgb(var(--gold))]"
          />
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Learning summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatWatchTime(totalWatchTime)}</p>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">Total watch time</p>
          </CardContent>
        </Card>
      </div>
      <h2 className="text-lg font-semibold">Enrolled courses</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {enrolledCourses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="text-base">{course.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={course.progress.percentage} />
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                {course.progress.completedVideos}/{course.progress.totalVideos} lessons · {course.progress.percentage}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Link href="/admin/students">
        <Button variant="outline">Back to students</Button>
      </Link>
    </div>
  );
}

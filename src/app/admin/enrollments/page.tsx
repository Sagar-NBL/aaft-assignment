'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useGetStudentsQuery, useGetCoursesQuery, useGetEnrollmentsQuery, useAssignEnrollmentsMutation } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { isInitialQueryLoad } from '@/lib/query-utils';

export default function EnrollmentsPage() {
  const { data: studentsData, isLoading: sLoad } = useGetStudentsQuery({ page: 1, limit: 50 });
  const { data: coursesData, isLoading: cLoad } = useGetCoursesQuery();
  const { data: enrollData, isLoading: eLoad, refetch } = useGetEnrollmentsQuery();
  const [assign, { isLoading: assigning }] = useAssignEnrollmentsMutation();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const toggle = (id: string, list: string[], set: (v: string[]) => void) => {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleAssign = async () => {
    if (!selectedStudents.length || !selectedCourses.length) {
      toast.error('Select students and courses');
      return;
    }
    await assign({ studentIds: selectedStudents, courseIds: selectedCourses }).unwrap();
    toast.success('Courses assigned');
    setSelectedStudents([]);
    setSelectedCourses([]);
    refetch();
  };

  if (isInitialQueryLoad(sLoad, studentsData) || isInitialQueryLoad(cLoad, coursesData)) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Course Assignment" description="Bulk assign courses to students" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Students</CardTitle></CardHeader>
          <CardContent className="max-h-80 space-y-2 overflow-y-auto">
            {studentsData?.items.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id, selectedStudents, setSelectedStudents)}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left transition',
                  selectedStudents.includes(s.id) ? 'border-[rgb(var(--gold))] bg-[rgb(var(--gold))]/10' : 'border-[rgb(var(--border))]'
                )}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">{s.email}</p>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Courses</CardTitle></CardHeader>
          <CardContent className="max-h-80 space-y-2 overflow-y-auto">
            {coursesData?.items.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id, selectedCourses, setSelectedCourses)}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left transition',
                  selectedCourses.includes(c.id) ? 'border-[rgb(var(--gold))] bg-[rgb(var(--gold))]/10' : 'border-[rgb(var(--border))]'
                )}
              >
                <p className="font-medium">{c.name}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
      <Button variant="gold" onClick={handleAssign} disabled={assigning}>
        Assign selected ({selectedStudents.length} × {selectedCourses.length})
      </Button>
      <Card>
        <CardHeader><CardTitle>Current enrollments</CardTitle></CardHeader>
        <CardContent>
          {eLoad ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-[rgb(var(--border))] px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !enrollData?.items.length ? (
            <p className="text-sm text-[rgb(var(--muted-foreground))]">No enrollments yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.values(
                (enrollData.items).reduce<Record<string, { studentName: string; courses: { name: string; progress: number }[] }>>(
                  (acc, e) => {
                    if (!acc[e.studentName]) {
                      acc[e.studentName] = { studentName: e.studentName, courses: [] };
                    }
                    acc[e.studentName].courses.push({ name: e.courseName, progress: e.progress.percentage });
                    return acc;
                  },
                  {}
                )
              ).map((group) => (
                <Card key={group.studentName} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--secondary))] text-sm font-bold text-[rgb(var(--gold))]">
                        {group.studentName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-base font-semibold">{group.studentName}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {group.courses.map((c, idx) => (
                        <span
                          key={`${c.name}-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--gold))]/30 bg-[rgb(var(--gold))]/10 px-3 py-1 text-xs font-medium text-[rgb(var(--gold))] shadow-sm transition-colors hover:bg-[rgb(var(--gold))]/20"
                        >
                          {c.name}
                          <span className="opacity-70">· {c.progress}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

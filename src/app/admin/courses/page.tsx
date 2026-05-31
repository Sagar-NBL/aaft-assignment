'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grid, List, Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { api, useGetCoursesQuery } from '@/services/api';
import { useAppDispatch } from '@/store/hooks';
import { createCourseThunk, deleteCourseThunk, fetchCoursesThunk } from '@/store/thunks/coursesThunks';
import { PageHeader } from '@/components/common/PageHeader';
import { CourseFormModal } from '@/components/admin/CourseFormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/skeleton';
import { isInitialQueryLoad } from '@/lib/query-utils';
import type { Course } from '@/types';
import type { CourseFormValues } from '@/lib/validations';

export default function AdminCoursesPage() {
  const { data, isLoading, refetch } = useGetCoursesQuery();
  const dispatch = useAppDispatch();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const courses = data?.items ?? [];

  const invalidateCourses = async () => {
    dispatch(api.util.invalidateTags(['Courses', 'Enrollments', 'Reports']));
    await Promise.all([
      refetch(),
      dispatch(fetchCoursesThunk()).unwrap(),
    ]);
  };

  const handleCreate = async (values: CourseFormValues) => {
    await dispatch(createCourseThunk(values)).unwrap();
    await invalidateCourses();
    toast.success('Course created');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteCourseThunk(deleteTarget.id)).unwrap();
      toast.success('Course deleted');
      setDeleteTarget(null);
      invalidateCourses();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Management"
        description="Create and manage learning content"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setView('grid')} aria-pressed={view === 'grid'}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setView('table')} aria-pressed={view === 'table'}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="gold" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> New course
            </Button>
          </div>
        }
      />
      {isInitialQueryLoad(isLoading, data) ? (
        view === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full rounded-none" />
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--secondary))]">
                <tr>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-4 py-3 text-left">Lessons</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-[rgb(var(--border))]">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3 flex gap-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-8 w-16" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses" description="Create your first course." action={<Button variant="gold" onClick={() => setModalOpen(true)}>Create course</Button>} />
      ) : view === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <div className="relative h-40">
                <SafeImage
                  src={course.thumbnail}
                  alt=""
                  fill
                  className="object-cover"
                  fallback="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=500&fit=crop"
                />
              </div>
              <CardHeader>
                <p className="font-semibold line-clamp-1">{course.name}</p>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="gold" className="text-center">{course.lessons.length} lessons</Badge>
                <div className="flex gap-2">
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button size="sm" variant="outline">Manage</Button>
                  </Link>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(course)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--secondary))]">
              <tr>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Lessons</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t border-[rgb(var(--border))]">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.lessons.length}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link href={`/admin/courses/${c.id}`}><Button size="sm" variant="outline">Edit</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(c)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CourseFormModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleCreate} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete course?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.name}", its lessons, and related enrollments. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

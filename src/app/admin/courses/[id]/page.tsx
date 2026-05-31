'use client';

import { use, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  api,
  useGetCourseQuery,
  useCreateLessonMutation,
  useDeleteLessonMutation,
} from '@/services/api';
import { useAppDispatch } from '@/store/hooks';
import { lessonSchema, type LessonFormValues } from '@/lib/validations';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { isInitialQueryLoad } from '@/lib/query-utils';
import { formatDuration } from '@/lib/utils';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const { data: course, isLoading, refetch } = useGetCourseQuery(id);
  const [createLesson, { isLoading: isCreating }] = useCreateLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();
  const [lessonOpen, setLessonOpen] = useState(false);

  const invalidateCourse = async () => {
    dispatch(api.util.invalidateTags(['Courses', 'Reports', 'StudentCourses']));
    await refetch();
  };

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: '', description: '', videoUrl: '', duration: 300 },
  });

  const onAddLesson = async (values: LessonFormValues) => {
    await createLesson({ courseId: id, ...values }).unwrap();
    await invalidateCourse();
    toast.success('Lesson added');
    setLessonOpen(false);
    form.reset();
  };

  if (isInitialQueryLoad(isLoading, course)) return <Skeleton className="h-64 w-full" />;
  if (!course) return <p>Course not found</p>;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Courses', href: '/admin/courses' }, { label: course.name }]} />
      <PageHeader title={course.name} description={course.description} action={<Button variant="gold" onClick={() => setLessonOpen(true)}><Plus className="h-4 w-4" /> Add lesson</Button>} />
      <div className="space-y-4">
        {course.lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{lesson.title}</CardTitle>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">{formatDuration(lesson.duration)}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await deleteLesson({ courseId: id, lessonId: lesson.id }).unwrap();
                  toast.success('Lesson deleted');
                  invalidateCourse();
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{lesson.description}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))] truncate">{lesson.videoUrl}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add lesson</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onAddLesson)} className="space-y-4">
            <div><Label>Title</Label><Input {...form.register('title')} disabled={form.formState.isSubmitting} /></div>
            <div><Label>Description</Label><Input {...form.register('description')} disabled={form.formState.isSubmitting} /></div>
            <div><Label>Video URL</Label><Input {...form.register('videoUrl')} disabled={form.formState.isSubmitting} /></div>
            <div><Label>Duration (sec)</Label><Input type="number" {...form.register('duration')} disabled={form.formState.isSubmitting} /></div>
            <Button type="submit" variant="gold" className="w-full min-h-10" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-label="Adding lesson" />
              ) : (
                'Add'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

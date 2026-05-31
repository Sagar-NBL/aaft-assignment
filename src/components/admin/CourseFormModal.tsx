'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { courseSchema, type CourseFormValues } from '@/lib/validations';
import type { Course } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emptyValues: CourseFormValues = { name: '', description: '', thumbnail: '' };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSubmit: (values: CourseFormValues) => Promise<void>;
};

export function CourseFormModal({ open, onOpenChange, course, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      course
        ? { name: course.name, description: course.description, thumbnail: course.thumbnail }
        : emptyValues
    );
  }, [open, course, reset]);

  const submit = async (values: CourseFormValues) => {
    await onSubmit(values);
    reset(emptyValues);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? 'Edit course' : 'Create course'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register('name')} disabled={isSubmitting} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input {...register('description')} disabled={isSubmitting} />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Thumbnail URL</Label>
            <Input {...register('thumbnail')} placeholder="https://..." disabled={isSubmitting} />
          </div>
          <Button type="submit" variant="gold" disabled={isSubmitting} className="w-full min-h-10">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving course" />
            ) : (
              'Save'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

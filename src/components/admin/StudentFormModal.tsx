'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { studentSchema, type StudentFormValues } from '@/lib/validations';
import type { Student } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSubmit: (values: StudentFormValues) => Promise<void>;
};

export function StudentFormModal({ open, onOpenChange, student, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    values: student ? { name: student.name, email: student.email } : { name: '', email: '' },
  });

  const submit = async (values: StudentFormValues) => {
    try {
      await onSubmit(values);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save student');
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset({ name: '', email: '' });
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{student ? 'Edit student' : 'Create student'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} disabled={isSubmitting} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} disabled={isSubmitting} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <Button type="submit" variant="gold" disabled={isSubmitting} className="w-full min-h-10">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving student" />
            ) : student ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

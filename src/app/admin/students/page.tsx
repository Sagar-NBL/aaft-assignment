'use client';

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api, useGetStudentsQuery } from '@/services/api';
import { useAppDispatch } from '@/store/hooks';
import { createStudentThunk, deleteStudentThunk, fetchStudentsThunk, updateStudentThunk } from '@/store/thunks/studentsThunks';
import { PageHeader } from '@/components/common/PageHeader';
import { StudentsTable } from '@/components/admin/StudentsTable';
import { StudentFormModal } from '@/components/admin/StudentFormModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types';
import type { StudentFormValues } from '@/lib/validations';
import { isInitialQueryLoad } from '@/lib/query-utils';

export default function AdminStudentsPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading, refetch } = useGetStudentsQuery({ page: 1, limit: 50 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const invalidateStudents = async () => {
    dispatch(api.util.invalidateTags(['Students', 'Reports', 'StudentReport']));
    await Promise.all([
      refetch(),
      dispatch(fetchStudentsThunk({ page: 1, limit: 50 })).unwrap(),
    ]);
  };

  const handleCreate = async (values: StudentFormValues) => {
    await dispatch(createStudentThunk(values)).unwrap();
    await invalidateStudents();
    toast.success('Student created');
    setEditing(null);
  };

  const handleUpdate = async (values: StudentFormValues) => {
    if (!editing) return;
    await dispatch(updateStudentThunk({ id: editing.id, updates: values })).unwrap();
    await invalidateStudents();
    toast.success('Student updated');
    setEditing(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteStudentThunk(deleteTarget.id)).unwrap();
      toast.success('Student deleted');
      setDeleteTarget(null);
      invalidateStudents();
    } finally {
      setDeleting(false);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditing(null);
  };

  const students = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        description="Create, edit, and manage learners"
        action={
          <Button variant="gold" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add student
          </Button>
        }
      />
      {students.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Create your first student to get started."
          action={
            <Button variant="gold" onClick={() => { setEditing(null); setModalOpen(true); }}>
              Add student
            </Button>
          }
        />
      ) : (
        <StudentsTable
          data={students}
          loading={isInitialQueryLoad(isLoading, data)}
          onEdit={(s) => { setEditing(s); setModalOpen(true); }}
          onDelete={(id) => {
            const student = students.find((s) => s.id === id);
            if (student) setDeleteTarget(student);
          }}
        />
      )}
      <StudentFormModal
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        student={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete student?"
        description={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.name} and their enrollments. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

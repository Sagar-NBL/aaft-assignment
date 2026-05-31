'use client';

import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import type { Student } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  data: Student[];
  loading?: boolean;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
};

export function StudentsTable({ data, loading, onEdit, onDelete }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'enrolledCourseIds',
        header: 'Courses',
        cell: ({ row }) => row.original.enrolledCourseIds.length,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Link href={`/admin/students/${row.original.id}`}>
              <Button size="sm" variant="ghost" aria-label={`View ${row.original.name}`}>
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={() => onEdit(row.original)} aria-label={`Edit ${row.original.name}`}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(row.original.id)} aria-label={`Delete ${row.original.name}`}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search students..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
        aria-label="Search students"
      />
      <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
        <table className="w-full text-sm">
          <thead className="bg-[rgb(var(--secondary))]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-3 text-left font-medium cursor-pointer"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-[rgb(var(--border))] hover:bg-[rgb(var(--secondary))]/50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

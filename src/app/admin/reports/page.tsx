'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { useGetAdminOverviewQuery, useGetStudentsQuery, useGetStudentReportQuery } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartPanel } from '@/components/charts/ChartPanel';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { courseCompletionConfig } from '@/lib/chart-config';
import { isInitialQueryLoad } from '@/lib/query-utils';

export default function ReportsPage() {
  const { data: overview, isLoading } = useGetAdminOverviewQuery();
  const { data: students } = useGetStudentsQuery({ page: 1, limit: 50 });
  const [studentId, setStudentId] = useState('');
  const { data: report } = useGetStudentReportQuery(studentId, { skip: !studentId });

  if (isInitialQueryLoad(isLoading, overview)) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Student-wise and course-wise insights" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ChartPanel title="Course completion" description="Completed vs total enrollments">
          <ChartContainer config={courseCompletionConfig}>
            <BarChart
              data={overview?.courseCompletion ?? []}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="course"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={-10}
                textAnchor="end"
                height={52}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
              <ChartTooltip
                cursor={{ fill: 'rgb(var(--muted))', opacity: 0.35 }}
                content={<ChartTooltipContent />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="completed"
                fill="var(--color-completed)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ChartContainer>
        </ChartPanel>
      </motion.div>
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[rgb(var(--gold))] to-transparent" />
        <CardHeader>
          <CardTitle>Student-wise progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students?.items.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {report && (
            <div className="grid gap-4 md:grid-cols-2">
              {report.enrolledCourses.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--secondary))]/30 p-4 transition-colors hover:border-[rgb(var(--gold))]/40"
                >
                  <p className="font-medium">{c.name}</p>
                  <Progress value={c.progress.percentage} className="mt-3" />
                  <p className="mt-2 text-xs font-medium text-[rgb(var(--gold))]">
                    {c.progress.percentage}% complete
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

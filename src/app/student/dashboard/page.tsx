'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { useGetStudentDashboardQuery } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { ChartPanel } from '@/components/charts/ChartPanel';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { weeklyActivityConfig } from '@/lib/chart-config';
import { formatWatchTime } from '@/lib/utils';
import { isInitialQueryLoad } from '@/lib/query-utils';

export default function StudentDashboardPage() {
  const { data, isLoading } = useGetStudentDashboardQuery();

  if (isInitialQueryLoad(isLoading, data)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <p>Unable to load dashboard.</p>;

  return (
    <div className="space-y-8">
      <PageHeader title="My Progress" description="Personal learning statistics" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="In progress" value={data.inProgress} icon={PlayCircle} index={0} />
        <StatCard label="Completed" value={data.completed} icon={CheckCircle2} index={1} />
        <StatCard
          label="Total watch time"
          value={formatWatchTime(data.totalWatchTime)}
          icon={Clock}
          index={2}
          className="[&_p:nth-child(2)]:text-[rgb(var(--gold))]"
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
      >
        <ChartPanel title="Weekly activity" description="Minutes watched per day" height="h-[280px] w-full">
          <ChartContainer config={weeklyActivityConfig}>
            <BarChart
              data={data.weeklyProgress}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
              <ChartTooltip
                cursor={{ fill: 'rgb(var(--muted))', opacity: 0.35 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="minutes"
                fill="var(--color-minutes)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ChartContainer>
        </ChartPanel>
      </motion.div>
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Courses in progress</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data.courses
            .filter((c) => c.status !== 'completed')
            .map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <Card className="overflow-hidden border-[rgb(var(--border))] transition-shadow hover:shadow-md">
                  <div className="h-1 w-full bg-gradient-to-r from-[rgb(var(--gold))] via-[rgb(var(--cta))] to-transparent" />
                  <CardHeader>
                    <CardTitle className="text-base">{course.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={course.progress.percentage} />
                    <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">
                      {course.progress.percentage}% complete
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}

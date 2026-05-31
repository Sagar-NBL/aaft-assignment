'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { BookOpen, Clock, TrendingUp, Users } from 'lucide-react';
import { useGetAdminOverviewQuery } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { ChartPanel } from '@/components/charts/ChartPanel';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { completionTrendConfig, timeSpentConfig } from '@/lib/chart-config';
import { isInitialQueryLoad } from '@/lib/query-utils';

const metricIcons = [Users, BookOpen, TrendingUp, Clock] as const;

export function AdminOverview() {
  const { data, isLoading, isError } = useGetAdminOverviewQuery();

  if (isInitialQueryLoad(isLoading, data)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-red-500">Failed to load dashboard.</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics Overview" description="Platform-wide learning metrics" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.metrics.map((m, i) => {
          const Icon = metricIcons[i % metricIcons.length];
          return (
            <StatCard key={m.label} label={m.label} value={m.value} hint={m.change} icon={Icon} index={i} />
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <ChartPanel title="Completion trend" description="Monthly completion rate (%)">
          <ChartContainer config={completionTrendConfig}>
            <AreaChart
              data={data.completionTrend}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-rate)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-rate)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
              <ChartTooltip
                cursor={{ stroke: 'rgb(var(--border))', strokeWidth: 1 }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="var(--color-rate)"
                fill="url(#fillRate)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-rate)', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--card))' }}
              />
            </AreaChart>
          </ChartContainer>
        </ChartPanel>

        <ChartPanel title="Time spent by course" description="Learning hours per program">
          <ChartContainer config={timeSpentConfig}>
            <BarChart
              data={data.timeSpentByCourse}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="course"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={56}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
              <ChartTooltip
                cursor={{ fill: 'rgb(var(--muted))', opacity: 0.35 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="hours"
                fill="var(--color-hours)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        </ChartPanel>
      </motion.div>
    </div>
  );
}

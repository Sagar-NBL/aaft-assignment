import type { ChartConfig } from '@/components/ui/chart';

/** Shared shadcn chart configs — AAFT red / wine / black palette */
export const completionTrendConfig = {
  rate: {
    label: 'Completion rate',
    color: 'rgb(var(--chart-1))',
  },
} satisfies ChartConfig;

export const timeSpentConfig = {
  hours: {
    label: 'Hours',
    color: 'rgb(var(--chart-1))',
  },
} satisfies ChartConfig;

export const weeklyActivityConfig = {
  minutes: {
    label: 'Minutes watched',
    color: 'rgb(var(--chart-1))',
  },
} satisfies ChartConfig;

export const courseCompletionConfig = {
  completed: {
    label: 'Completed',
    color: 'rgb(var(--chart-1))',
  },
  total: {
    label: 'Total enrolled',
    color: 'rgb(var(--chart-3))',
  },
} satisfies ChartConfig;

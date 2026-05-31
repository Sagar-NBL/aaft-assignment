'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  index?: number;
  className?: string;
};

export function StatCard({ label, value, hint, icon: Icon, index = 0, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={cn('stat-card relative overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm', className)}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[rgb(var(--gold))]/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[rgb(var(--muted-foreground))]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          {hint && (
            <p className="mt-1.5 text-xs font-medium text-[rgb(var(--gold))]">{hint}</p>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--gold))]/10 text-[rgb(var(--gold))]">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>
    </motion.div>
  );
}

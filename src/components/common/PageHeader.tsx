'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, action, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div className="relative pl-4">
        <span className="page-header-accent absolute left-0 top-1 bottom-1 w-1 rounded-full" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">{description}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

export function Progress({ className, value, ...props }: { className?: string; value?: number }) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-[rgb(var(--muted))]', className)}
      {...props}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="progress-gradient h-full w-full flex-1 rounded-full transition-all duration-500 ease-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

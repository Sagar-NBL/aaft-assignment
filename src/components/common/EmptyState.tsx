import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgb(var(--border))] p-12 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--gold))]/10">
        <Icon className="h-7 w-7 text-[rgb(var(--gold))]" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[rgb(var(--muted-foreground))]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

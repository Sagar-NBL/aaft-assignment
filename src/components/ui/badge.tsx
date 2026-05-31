import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]',
        gold: 'border-[rgb(var(--gold))]/30 bg-[rgb(var(--gold))]/15 text-[rgb(var(--gold))]',
        outline: 'text-foreground border-[rgb(var(--border))]',
        success: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

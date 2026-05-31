import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 shadow-sm',
        gold:
          'bg-[rgb(var(--cta))] text-[rgb(var(--cta-foreground))] hover:bg-[rgb(var(--cta-hover))] font-semibold uppercase tracking-[0.14em] shadow-sm border border-[rgb(var(--cta))]/30',
        outline:
          'border border-[rgb(var(--border))] bg-transparent hover:bg-[rgb(var(--secondary))] hover:border-[rgb(var(--gold))]/35',
        ghost: 'hover:bg-[rgb(var(--secondary))]',
        destructive:
          'bg-[rgb(var(--destructive))] text-white hover:brightness-95 shadow-sm ring-1 ring-[rgb(var(--destructive))]/50',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
export { Button, buttonVariants };

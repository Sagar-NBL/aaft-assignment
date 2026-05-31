import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ChartPanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  height?: string;
};

export function ChartPanel({
  title,
  description,
  children,
  className,
  contentClassName,
  height = 'h-[300px] w-full',
}: ChartPanelProps) {
  return (
    <Card className={cn('chart-card overflow-hidden', className)}>
      <CardHeader className="border-b border-[rgb(var(--border))]/80 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn('pt-6', contentClassName)}>
        <div className={height}>{children}</div>
      </CardContent>
    </Card>
  );
}

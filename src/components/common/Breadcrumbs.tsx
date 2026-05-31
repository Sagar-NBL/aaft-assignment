'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-[rgb(var(--muted-foreground))]" suppressHydrationWarning>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
          {item.href ? (
            <Link href={item.href} className="hover:text-[rgb(var(--gold))] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[rgb(var(--foreground))] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

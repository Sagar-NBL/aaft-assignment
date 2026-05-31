import type { ReactNode } from 'react';

interface PageLoadingProps {
  heading?: string;
  message?: string;
  children?: ReactNode;
}

export function PageLoading({
  heading = 'Loading page content',
  message = 'Fetching the latest content from the server. This usually takes just a moment.',
  children,
}: PageLoadingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-[rgb(var(--background))] px-6 py-20 text-center text-[rgb(var(--foreground))]">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[rgb(var(--gold))] bg-[rgb(var(--muted))]/80 shadow-lg shadow-[rgba(0,0,0,0.12)]">
        <span className="inline-block h-12 w-12 rounded-full border-4 border-[rgb(var(--gold))]/20 border-t-[rgb(var(--gold))] animate-spin" />
      </div>
      <div className="max-w-xl space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-[rgb(var(--gold))]">Loading</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{heading}</h1>
        <p className="text-sm leading-7 text-[rgb(var(--muted-foreground))]">{message}</p>
      </div>
      {children ? <div className="w-full max-w-2xl">{children}</div> : null}
    </div>
  );
}

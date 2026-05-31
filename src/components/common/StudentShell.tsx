'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, LayoutDashboard, LogOut } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { logoutThunk } from '@/store/thunks/authThunks';
import { setLastRole } from '@/lib/last-role-storage';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const nav = [
  { href: '/student/courses', label: 'My Courses', icon: BookOpen },
  { href: '/student/dashboard', label: 'Progress', icon: LayoutDashboard },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--background))]" suppressHydrationWarning>
      <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]/90 backdrop-blur-md dark:border-[rgb(var(--gold))]/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/student/courses" prefetch className="flex items-center gap-3 text-lg font-bold">
            <Image src="/aaft-logo.png" alt="AAFT Logo" width={120} height={30} className="h-6 w-auto sm:h-7" />
            <span>Learn</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Student navigation">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    'text-sm font-medium transition-colors',
                    active ? 'text-[rgb(var(--gold))]' : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={async () => {
                setLastRole('student');
                await dispatch(logoutThunk());
                router.push('/login?role=student');
              }}
              className="rounded-lg p-2 hover:bg-[rgb(var(--secondary))]"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[rgb(var(--border))] bg-[rgb(var(--card))] md:hidden" aria-label="Mobile navigation">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs',
                active ? 'text-[rgb(var(--gold))]' : 'text-[rgb(var(--muted-foreground))]'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}

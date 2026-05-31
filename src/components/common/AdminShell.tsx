'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Menu,
  UserPlus,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar, setSidebarOpen } from '@/store/slices/uiSlice';
import { logoutThunk } from '@/store/thunks/authThunks';
import { setLastRole } from '@/lib/last-role-storage';
import { selectSidebarOpen, selectUser } from '@/store/selectors';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: GraduationCap },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/enrollments', label: 'Enrollments', icon: UserPlus },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3" aria-label="Admin navigation">
      {nav.map((item) => {
        const active =
          pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-[rgb(var(--gold))]/25 text-white shadow-sm shadow-[rgb(var(--gold))]/20'
                : 'text-neutral-300 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onSignOut }: { onSignOut: () => void }) {
  const user = useAppSelector(selectUser);
  return (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-xs text-slate-400">{user?.email}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full border-white/20 text-white hover:bg-white/10"
        onClick={onSignOut}
      >
        Sign out
      </Button>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectSidebarOpen);

  const signOut = async () => {
    setLastRole('admin');
    await dispatch(logoutThunk());
    router.push('/login?role=admin');
  };

  const closeMobile = () => dispatch(setSidebarOpen(false));

  return (
    <div className="flex min-h-screen bg-[rgb(var(--background))]" suppressHydrationWarning>
      {/* Desktop sidebar — always mounted for fast navigation */}
      <aside className="aaft-sidebar hidden w-64 shrink-0 flex-col border-r border-[rgb(var(--gold))]/20 text-white lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-4">
          <Link href="/admin" prefetch className="flex items-center gap-3 font-bold tracking-wide">
            <Image src="/aaft-logo.png" alt="AAFT Logo" width={120} height={30} className="h-6 w-auto sm:h-7" />
            <span>Admin</span>
          </Link>
        </div>
        <SidebarNav />
        <SidebarFooter onSignOut={signOut} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={closeMobile}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="aaft-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[rgb(var(--gold))]/20 text-white lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
                <Link href="/admin" prefetch className="flex items-center gap-3 font-bold tracking-wide" onClick={closeMobile}>
                  <Image src="/aaft-logo.png" alt="AAFT Logo" width={120} height={30} className="h-6 w-auto sm:h-7" />
                  <span>Admin</span>
                </Link>
                <button type="button" onClick={closeMobile} aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={closeMobile} />
              <SidebarFooter onSignOut={signOut} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]/80 px-4 backdrop-blur-md">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[rgb(var(--secondary))] lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

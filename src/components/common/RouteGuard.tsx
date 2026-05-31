'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated, selectUserRole } from '@/store/selectors';

type Props = {
  children: React.ReactNode;
  role: 'admin' | 'student';
};

export function RouteGuard({ children, role }: Props) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userRole = useAppSelector(selectUserRole);
  const ready = useAppSelector((s) => s.auth.ready);
  const loading = useAppSelector((s) => s.auth.loading);

  useEffect(() => {
    if (!ready || loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (userRole && userRole !== role) {
      router.replace(userRole === 'admin' ? '/admin' : '/student/courses');
    }
  }, [isAuthenticated, userRole, role, router, ready, loading]);

  if (!ready) return null;

  if (!isAuthenticated || (userRole && userRole !== role)) {
    return null;
  }

  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

export function ToastHydrator() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('aaft:pendingToast');
      if (!pending) return;

      if (pending === 'login-success') {
        // Wait a tick so the page can render fully before showing the toast
        const t = window.setTimeout(() => {
          toast.success('Welcome back!');
          sessionStorage.removeItem('aaft:pendingToast');
        }, 120);

        return () => window.clearTimeout(t);
      }

      // Unknown pending values: clear
      sessionStorage.removeItem('aaft:pendingToast');
    } catch {
      // ignore (sessionStorage may be unavailable in some contexts)
    }
  }, [pathname]);

  return null;
}

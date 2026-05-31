'use client';

import { useRef, Suspense } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { getStore, type AppStore } from '@/store/store';
import { AuthHydrator } from '@/components/common/AuthHydrator';
import { MockDbHydrator } from '@/components/common/MockDbHydrator';
import { RouteProgressBar } from '@/components/common/RouteProgressBar';
import { ToastHydrator } from '@/components/common/ToastHydrator';

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      richColors
      position="top-right"
      closeButton
      theme={(resolvedTheme as 'light' | 'dark') ?? 'dark'}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = getStore();
  }

  return (
    <Provider store={storeRef.current}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthHydrator />
        <MockDbHydrator />
        <Suspense>
          <RouteProgressBar />
        </Suspense>
        {children}
        <ToastHydrator />
        <ThemedToaster />
      </ThemeProvider>
    </Provider>
  );
}

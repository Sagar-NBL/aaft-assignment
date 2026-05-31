'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const IS_BROWSER = typeof window !== 'undefined';
const VISITED_ROUTES_KEY = 'aaft:visited-routes';

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function normalizePath(path: string): string {
  const p = path.split('?')[0] ?? '/';
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p || '/';
}

function loadVisitedRoutes(): Set<string> {
  if (!IS_BROWSER) return new Set();
  try {
    const raw = sessionStorage.getItem(VISITED_ROUTES_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveVisitedRoutes(routes: Set<string>): void {
  if (!IS_BROWSER) return;
  try {
    sessionStorage.setItem(VISITED_ROUTES_KEY, JSON.stringify([...routes]));
  } catch {
    /* ignore */
  }
}

/** Wait until a genuinely new route has painted (skip for already-visited pages). */
function waitForRouteReady(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(() => resolve(), { timeout: 400 });
        } else {
          setTimeout(resolve, 80);
        }
      });
    });
  });
}

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const isNavigatingRef = useRef(false);
  const visitedRoutesRef = useRef<Set<string>>(loadVisitedRoutes());
  const targetPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
  const previousPathRef = useRef(targetPath);
  const normalizedPath = normalizePath(pathname);

  const clearTimers = () => {
    window.clearInterval(intervalRef.current ?? 0);
    intervalRef.current = null;
    window.clearTimeout(safetyTimerRef.current ?? 0);
    safetyTimerRef.current = null;
  };

  const stopProgress = () => {
    clearTimers();
    setProgress(100);
    isNavigatingRef.current = false;

    window.setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 200);
  };

  const startProgress = () => {
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;
    setActive(true);
    setProgress(12);

    intervalRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return current;
        return clamp(current + Math.random() * 6, 0, 90);
      });
    }, 200);

    safetyTimerRef.current = window.setTimeout(() => {
      if (isNavigatingRef.current) stopProgress();
    }, 4000);
  };

  useEffect(() => {
    visitedRoutesRef.current.add(normalizedPath);
    saveVisitedRoutes(visitedRoutesRef.current);
  }, [normalizedPath]);

  useEffect(() => {
    if (!IS_BROWSER) return undefined;

    const handleClick = (event: MouseEvent) => {
      const element = event.target as Element | null;
      if (!element) return;

      const anchor = element.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) return;

      const dest = normalizePath(url.pathname);
      if (visitedRoutesRef.current.has(dest)) {
        return;
      }

      startProgress();
    };

    const handlePopState = () => {
      const dest = normalizePath(window.location.pathname);
      if (visitedRoutesRef.current.has(dest)) return;
      startProgress();
    };

    window.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (previousPathRef.current === targetPath) return;
    previousPathRef.current = targetPath;

    const wasAlreadyVisited = visitedRoutesRef.current.has(normalizedPath);
    visitedRoutesRef.current.add(normalizedPath);
    saveVisitedRoutes(visitedRoutesRef.current);

    if (!isNavigatingRef.current) return;

    if (wasAlreadyVisited) {
      stopProgress();
      return;
    }

    let cancelled = false;
    void waitForRouteReady().then(() => {
      if (!cancelled) stopProgress();
    });

    return () => {
      cancelled = true;
    };
  }, [targetPath, normalizedPath]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1 overflow-hidden transition-opacity duration-200 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
      suppressHydrationWarning
    >
      <div
        className="h-full rounded-b-full progress-gradient transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

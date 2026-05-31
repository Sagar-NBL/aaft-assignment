'use client';

import { useLayoutEffect } from 'react';
import { ensureMockDbHydrated } from '@/lib/mock-db-sync';

/** Ensures the in-memory mock API is hydrated from localStorage before data fetches. */
export function MockDbHydrator() {
  useLayoutEffect(() => {
    void ensureMockDbHydrated();
  }, []);

  return null;
}

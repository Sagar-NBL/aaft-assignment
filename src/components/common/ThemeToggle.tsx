'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setTheme } from '@/store/slices/uiSlice';

export function ThemeToggle() {
  const { theme, setTheme: setNextTheme } = useTheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      dispatch(setTheme(theme));
    }
  }, [theme, dispatch]);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setNextTheme(next);
    dispatch(setTheme(next));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg p-2 hover:bg-[rgb(var(--secondary))] transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      suppressHydrationWarning
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'flex items-center h-8 w-[142px] px-1 rounded-xl border border-border bg-card/60 backdrop-blur-md opacity-60',
          className
        )}
      >
        <div className="h-5 w-full rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color scheme selection"
      className={cn(
        'flex items-center p-1 rounded-xl border border-border bg-card/80 backdrop-blur-md shadow-xs select-none',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Switch to Light theme"
        aria-checked={theme === 'light'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer text-xs font-mono',
          theme === 'light'
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs border border-emerald-500/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        )}
      >
        <Sun className="size-3.5" />
        <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Switch to Dark theme"
        aria-checked={theme === 'dark'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer text-xs font-mono',
          theme === 'dark'
            ? 'bg-emerald-500/15 text-emerald-400 font-semibold shadow-xs border border-emerald-500/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        )}
      >
        <Moon className="size-3.5" />
        <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title="Follow System theme"
        aria-checked={theme === 'system'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer text-xs font-mono',
          theme === 'system'
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs border border-emerald-500/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        )}
      >
        <Monitor className="size-3.5" />
        <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">Auto</span>
      </button>
    </div>
  );
}

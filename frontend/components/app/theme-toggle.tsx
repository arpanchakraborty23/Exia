'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
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
          'border-border bg-card/60 flex h-8 w-[142px] items-center rounded-xl border px-1 opacity-60 backdrop-blur-md',
          className
        )}
      >
        <div className="bg-muted h-5 w-full animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color scheme selection"
      className={cn(
        'border-border bg-card/80 flex items-center rounded-xl border p-1 shadow-xs backdrop-blur-md select-none',
        className
      )}
    >
      <button
        type="button"
        role="radio"
        onClick={() => setTheme('light')}
        title="Switch to Light theme"
        aria-checked={theme === 'light'}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs transition-all duration-200',
          theme === 'light'
            ? 'border border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-600 shadow-xs dark:text-emerald-400'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        )}
      >
        <Sun className="size-3.5" />
        <span className="hidden text-[10px] font-bold tracking-wider uppercase sm:inline">
          Light
        </span>
      </button>

      <button
        type="button"
        role="radio"
        onClick={() => setTheme('dark')}
        title="Switch to Dark theme"
        aria-checked={theme === 'dark'}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs transition-all duration-200',
          theme === 'dark'
            ? 'border border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-400 shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        )}
      >
        <Moon className="size-3.5" />
        <span className="hidden text-[10px] font-bold tracking-wider uppercase sm:inline">
          Dark
        </span>
      </button>

      <button
        type="button"
        role="radio"
        onClick={() => setTheme('system')}
        title="Follow System theme"
        aria-checked={theme === 'system'}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs transition-all duration-200',
          theme === 'system'
            ? 'border border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-600 shadow-xs dark:text-emerald-400'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        )}
      >
        <Monitor className="size-3.5" />
        <span className="hidden text-[10px] font-bold tracking-wider uppercase sm:inline">
          Auto
        </span>
      </button>
    </div>
  );
}

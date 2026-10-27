'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-center"
      richColors
      expand={true}
      visibleToasts={4}
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-2xl border font-sans text-sm transition-all duration-300',
          title: 'font-semibold text-foreground text-sm tracking-tight',
          description: 'text-xs text-muted-foreground mt-0.5 leading-relaxed',
          actionButton:
            'bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm',
          cancelButton:
            'bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-lg',
          closeButton:
            '!bg-background/80 !border-border !text-muted-foreground hover:!text-foreground !rounded-full !shadow-md transition-all',
          success:
            '!bg-emerald-950/85 !border-emerald-500/40 !text-emerald-50 shadow-[0_12px_36px_rgba(16,185,129,0.25)]',
          error:
            '!bg-rose-950/85 !border-rose-500/40 !text-rose-50 shadow-[0_12px_36px_rgba(244,63,94,0.25)]',
          warning:
            '!bg-amber-950/85 !border-amber-500/40 !text-amber-50 shadow-[0_12px_36px_rgba(245,158,11,0.25)]',
          info:
            '!bg-cyan-950/85 !border-cyan-500/40 !text-cyan-50 shadow-[0_12px_36px_rgba(31,213,249,0.25)]',
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />,
        info: <Info className="size-5 text-cyan-400 shrink-0" />,
        warning: <AlertTriangle className="size-5 text-amber-400 shrink-0" />,
        error: <XCircle className="size-5 text-rose-400 shrink-0" />,
        loading: <Loader2 className="size-5 text-primary animate-spin shrink-0" />,
      }}
      {...props}
    />
  );
};

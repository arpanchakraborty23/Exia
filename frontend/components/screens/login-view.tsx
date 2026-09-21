'use client';

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, ShieldCheck, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useAuth } from '@/context/auth-context';

interface LoginViewProps {
  onSuccess?: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('admin@exia.local');
  const [password, setPassword] = useState('admin1234');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!emailOrUsername.trim() || !password.trim()) {
      setLocalError('Please enter both username/email and passkey.');
      return;
    }

    try {
      await login(emailOrUsername.trim(), password);
      onSuccess?.();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Authentication sequence failed.');
    }
  };

  const fillDemo = (role: 'admin' | 'guest') => {
    if (role === 'admin') {
      setEmailOrUsername('admin@exia.local');
      setPassword('admin1234');
    } else {
      setEmailOrUsername('guest@exia.local');
      setPassword('guest1234');
    }
    setLocalError(null);
  };

  const errorMessage = localError || error;

  return (
    <div className="bg-background text-foreground bg-tactical-grid relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden p-4 transition-colors">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Branding & Avatar */}
        <div className="space-y-3 text-center">
          <div className="relative inline-block">
            <div className="absolute -inset-2 animate-pulse rounded-3xl bg-gradient-to-tr from-emerald-500/40 via-teal-500/20 to-emerald-400/40 blur-xl" />
            <div className="relative mx-auto size-24 overflow-hidden rounded-2xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/exia-avatar.jpg"
                alt="Exia GN-001"
                className="size-full object-cover"
              />
            </div>
            <span className="border-background absolute -right-1 -bottom-1 size-4 rounded-full border-2 bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </div>

          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
              <Zap className="size-3" />
              <span>GN-001 EXIA COMMAND SYSTEM</span>
            </div>
            <h1 className="text-foreground font-mono text-2xl font-extrabold tracking-tight">
              TACTICAL ACCESS
            </h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              LiveKit Voice link & FastAPI REST Autonomous Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card/90 border-border relative space-y-6 overflow-hidden rounded-2xl border p-6 shadow-2xl backdrop-blur-2xl md:p-8">
          {/* Subtle top edge glow */}
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

          {/* Telemetry status ticker */}
          <div className="bg-muted/60 border-border text-muted-foreground flex items-center justify-between rounded-xl border p-2 font-mono text-[10px]">
            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 animate-ping rounded-full bg-emerald-400" />
              GN LINK: SYNCHRONIZED
            </span>
            <span>REST: 8000</span>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 font-mono text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 font-mono">
              <label className="text-foreground text-xs font-semibold">
                Operator Email / Username
              </label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="admin@exia.local"
                  required
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 w-full rounded-xl border py-2.5 pr-3 pl-9 text-xs transition-all focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.2)] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-foreground text-xs font-semibold">Security Passkey</label>
              </div>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 w-full rounded-xl border py-2.5 pr-3 pl-9 text-xs transition-all focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.2)] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-mono text-xs font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:bg-emerald-400 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin text-black" />
              ) : (
                <>
                  <span>Engage Exia Terminal</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="border-border space-y-2 border-t pt-2 font-mono">
            <span className="text-muted-foreground block text-center text-[10px]">
              Quick Test Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="bg-muted/50 hover:bg-muted border-border text-foreground cursor-pointer rounded-xl border px-3 py-1.5 text-[11px] transition-colors"
              >
                Commander (Admin)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('guest')}
                className="bg-muted/50 hover:bg-muted border-border text-muted-foreground hover:text-foreground cursor-pointer rounded-xl border px-3 py-1.5 text-[11px] transition-colors"
              >
                Guest Operator
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-muted-foreground flex items-center justify-center gap-2 font-mono text-[11px]">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>FastAPI REST Endpoints • LiveKit RTC • GN-001 Core</span>
        </div>
      </div>
    </div>
  );
}

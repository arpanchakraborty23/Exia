'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { Lock, Mail, ArrowRight, ShieldCheck, Zap, AlertCircle, Loader2 } from 'lucide-react';

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
    } catch (err: any) {
      setLocalError(err.message || 'Authentication sequence failed.');
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
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-background text-foreground bg-tactical-grid relative overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Branding & Avatar */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/40 via-teal-500/20 to-emerald-400/40 rounded-3xl blur-xl animate-pulse" />
            <div className="relative size-24 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/30 mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/exia-avatar.jpg"
                alt="Exia GN-001"
                className="size-full object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-400 border-2 border-background shadow-[0_0_8px_#10b981]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 border border-emerald-500/30">
              <Zap className="size-3" />
              <span>GN-001 EXIA COMMAND SYSTEM</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-mono">
              TACTICAL ACCESS
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              LiveKit Voice link & FastAPI REST Autonomous Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card/90 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          {/* Subtle top edge glow */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

          {/* Telemetry status ticker */}
          <div className="p-2 rounded-xl bg-muted/60 border border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
              GN LINK: SYNCHRONIZED
            </span>
            <span>REST: 8000</span>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-mono">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 font-mono">
              <label className="text-xs font-semibold text-foreground">
                Operator Email / Username
              </label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="admin@exia.local"
                  required
                  className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Security Passkey
                </label>
              </div>
              <div className="relative">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
          <div className="space-y-2 pt-2 border-t border-border font-mono">
            <span className="text-[10px] text-muted-foreground block text-center">
              Quick Test Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="py-1.5 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border text-[11px] text-foreground transition-colors cursor-pointer"
              >
                Commander (Admin)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('guest')}
                className="py-1.5 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Guest Operator
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>FastAPI REST Endpoints • LiveKit RTC • GN-001 Core</span>
        </div>
      </div>
    </div>
  );
}

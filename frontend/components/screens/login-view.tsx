'use client';

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Lock, User } from 'lucide-react';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useAuth } from '@/context/auth-context';

interface LoginViewProps {
  onSuccess?: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!emailOrUsername.trim() || !password.trim()) {
      setLocalError('Please enter your credentials.');
      return;
    }

    try {
      await login(emailOrUsername.trim(), password);
      onSuccess?.();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  const handleFillDemo = () => {
    setEmailOrUsername('admin@exia.local');
    setPassword('admin1234');
    setLocalError(null);
  };

  const errorMessage = localError || error;

  return (
    <div className="bg-background text-foreground relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Ambient glow — very subtle */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute top-1/4 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(31,213,249,0.04) 0%, transparent 65%)',
          }}
        />
      </div>

      {/* Top-right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / Identity */}
        <div className="mb-8 text-center">
          <div className="relative mb-5 inline-flex items-center justify-center">
            <div className="relative size-16 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/exia-avatar.jpg"
                alt="Exia"
                className="size-full object-cover"
              />
            </div>
            {/* Online status */}
            <span className="border-background absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 bg-emerald-500" />
          </div>

          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to your Exia workspace
          </p>
        </div>

        {/* Card */}
        <div className="border-border bg-card rounded-2xl border p-6 shadow-2xl shadow-black/20">
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/15 bg-red-500/8 p-3 text-sm text-red-500">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-foreground/80 text-xs font-medium">
                Email or username
              </label>
              <div className="relative">
                <User className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="admin@exia.local"
                  required
                  autoComplete="username"
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground/80 text-xs font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary-hover mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              style={{ boxShadow: '0 4px 20px rgba(31,213,249,0.25)' }}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>

            {/* Quick-fill helper for testing */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors hover:underline"
              >
                Auto-fill test credentials
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          LiveKit WebRTC · FastAPI · Exia Personal Assistant
        </p>
      </div>
    </div>
  );
}

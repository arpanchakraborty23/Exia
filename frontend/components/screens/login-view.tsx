'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { BackendStatus } from '@/components/app/backend-status';
import { useAuth } from '@/context/auth-context';

interface LoginViewProps {
  onSuccess?: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Sign In fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!emailOrUsername.trim() || !password.trim()) {
      const msg = 'Please enter both your email/username and password.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    try {
      await login(emailOrUsername.trim(), password);
      toast.success('Welcome back to Exia!');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setLocalError(msg);
      toast.error(msg);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      const msg = 'All fields are required to create an account.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (regPassword.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      const msg = 'Passwords do not match. Please re-enter.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    try {
      await register(regName.trim(), regEmail.trim(), regPassword);
      toast.success('Account created successfully! Welcome aboard.');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setLocalError(msg);
      toast.error(msg);
    }
  };

  const handleFillDemo = () => {
    setEmailOrUsername('admin@exia.local');
    setPassword('admin1234');
    setLocalError(null);
    toast.info('Loaded demo operator credentials');
  };

  const errorMessage = localError || error;

  return (
    <div className="bg-background text-foreground relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute top-1/4 left-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(31,213,249,0.06) 0%, transparent 65%)',
          }}
        />
      </div>

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <BackendStatus variant="minimal" />
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / Identity */}
        <div className="mb-6 text-center">
          <div className="relative mb-4 inline-flex items-center justify-center">
            <div className="relative size-16 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/exia-avatar.jpg"
                alt="Exia"
                className="size-full object-cover"
              />
            </div>
            {/* Online status indicator */}
            <span className="border-background absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 bg-emerald-500 shadow-xs" />
          </div>

          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create an Account'}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            {mode === 'signin'
              ? 'Sign in to access your Exia workspace'
              : 'Register a new operator profile for your system'}
          </p>

          <div className="mt-3 flex justify-center">
            <BackendStatus />
          </div>
        </div>

        {/* Card */}
        <div className="border-border bg-card/80 backdrop-blur-xl rounded-2xl border p-6 shadow-2xl shadow-black/25">
          {/* Mode Tabs Switcher */}
          <div className="border-border bg-muted/40 mb-5 grid grid-cols-2 rounded-xl border p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setLocalError(null);
                clearError();
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="size-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
                clearError();
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="size-3.5" />
              <span>Register</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                  Auto-fill demo credentials
                </button>
              </div>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-foreground/80 text-xs font-medium">
                  Full name
                </label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                    className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border py-2 pr-3 pl-9 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground/80 text-xs font-medium">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="alex@exia.local"
                    required
                    className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border py-2 pr-3 pl-9 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground/80 text-xs font-medium">
                  Password <span className="text-muted-foreground text-[10px]">(min 8 characters)</span>
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border py-2 pr-3 pl-9 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground/80 text-xs font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border py-2 pr-3 pl-9 text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary-hover mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                style={{ boxShadow: '0 4px 20px rgba(31,213,249,0.25)' }}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <CheckCircle2 className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          LiveKit WebRTC · FastAPI · Exia Personal Assistant
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Radio, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/app/theme-toggle';

interface LoginViewProps {
  onSuccess: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('admin@homeassistant.local');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      setErrorMessage('Please enter both email/username and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const ok = await login(emailOrUsername, password);
      if (ok) {
        onSuccess();
      } else {
        setErrorMessage('Invalid credentials or authentication failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'guest') => {
    if (role === 'admin') {
      setEmailOrUsername('admin@homeassistant.local');
      setPassword('adminpassword123');
    } else {
      setEmailOrUsername('guest@homeassistant.local');
      setPassword('guestpassword123');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-radial from-background via-muted/30 to-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-2">
            <Radio className="size-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Home Assistant
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your private LiveKit voice agent & control hub
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="e.g. admin@homeassistant.local"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground/80">
                  Password
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Min 8 chars
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 shadow-md shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Enter Assistant</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Helper */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
              <span>Fast Demo Pre-fill:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('admin')}
                  className="hover:text-primary underline cursor-pointer"
                >
                  Admin
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => fillDemo('guest')}
                  className="hover:text-primary underline cursor-pointer"
                >
                  Guest
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Calls POST /auth/login with JWT storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

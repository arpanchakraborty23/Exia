'use client';

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2, Zap, Activity } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/app/theme-toggle';

interface LoginViewProps {
  onSuccess: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('admin@exia.local');
  const [password, setPassword] = useState('adminpassword123');
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
      setErrorMessage(err.message || 'Login failed. Please verify FastAPI connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'guest') => {
    if (role === 'admin') {
      setEmailOrUsername('admin@exia.local');
      setPassword('adminpassword123');
    } else {
      setEmailOrUsername('guest@exia.local');
      setPassword('guestpassword123');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#07090e] bg-tactical-grid relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="absolute top-5 right-5 z-20">
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
            <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-400 border-2 border-[#07090e] shadow-[0_0_8px_#10b981]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 border border-emerald-500/30">
              <Zap className="size-3" />
              <span>GN-001 EXIA COMMAND SYSTEM</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono">
              TACTICAL ACCESS
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              LiveKit Voice link & FastAPI REST Autonomous Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0b0f19]/90 backdrop-blur-2xl border border-white/[0.09] rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          {/* Subtle top edge glow */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

          {/* Telemetry status ticker */}
          <div className="p-2 rounded-xl bg-black/60 border border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
              GN LINK: SYNCHRONIZED
            </span>
            <span>REST: 8000</span>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 font-mono">
              <label className="text-xs font-semibold text-zinc-300">
                Operator Email / Username
              </label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="admin@exia.local"
                  required
                  className="w-full bg-[#080b12] border border-white/[0.09] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Security Passkey
                </label>
              </div>
              <div className="relative">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#080b12] border border-white/[0.09] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all"
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
          <div className="space-y-2 pt-2 border-t border-white/[0.07] font-mono">
            <span className="text-[10px] text-zinc-500 block text-center">
              Quick Test Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] text-zinc-300 transition-colors"
              >
                Commander (Admin)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('guest')}
                className="py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] text-zinc-400 transition-colors"
              >
                Guest Operator
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>FastAPI REST Endpoints • LiveKit RTC • GN-001 Core</span>
        </div>
      </div>
    </div>
  );
}

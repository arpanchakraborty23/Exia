'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Cpu,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Mic,
  Monitor,
  Moon,
  Palette,
  Sparkles,
  Sun,
  User,
  Volume2,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  ACCENT_PALETTES,
  BASE_THEMES,
  GLASS_STYLES,
  type AccentColorId,
  type BaseThemeId,
  type GlassStyleId,
  useAppearance,
} from '@/hooks/useAppearance';

interface SettingsViewProps {
  visualizerType: string;
  onChangeVisualizerType: (type: string) => void;
}

const VISUALIZERS = [
  { id: 'aura', name: 'Aura Halo', desc: 'Luminescent ambient glowing core' },
  { id: 'wave', name: 'Waveform', desc: 'Smooth sine wave frequency response' },
  { id: 'bar', name: 'Spectrum Bars', desc: 'Classic audio equalizer bars' },
  { id: 'radial', name: 'Radial Pulse', desc: 'Expanding sound pressure ring' },
];

export function SettingsView({ visualizerType, onChangeVisualizerType }: SettingsViewProps) {
  const { user, changePassword, logout } = useAuth();
  const {
    accentId,
    glassId,
    baseId,
    activeAccent,
    activeGlass,
    activeBase,
    selectAccent,
    selectGlass,
    selectBase,
  } = useAppearance();

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Processing Options
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Password update failed. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalize interface themes, glassy finishes, color accents, and voice audio filters.
        </p>
      </div>

      {/* Account Profile Card */}
      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        <div className="border-border flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="border-border bg-muted/60 flex size-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner">
              <User className="text-foreground size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-foreground text-base font-semibold">
                  {user?.name || 'Administrator'}
                </h2>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                  Active
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {user?.email || 'admin@exia.local'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="border-border hover:bg-muted text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 self-start rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors sm:self-auto"
          >
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border-border bg-muted/30 rounded-xl border p-3.5">
            <span className="text-muted-foreground text-xs font-medium">Username</span>
            <p className="text-foreground mt-1 text-sm font-medium">
              {user?.name || 'admin'}
            </p>
          </div>
          <div className="border-border bg-muted/30 rounded-xl border p-3.5">
            <span className="text-muted-foreground text-xs font-medium">Email Address</span>
            <p className="text-foreground mt-1 truncate text-sm font-medium">
              {user?.email || 'admin@exia.local'}
            </p>
          </div>
          <div className="border-border bg-muted/30 rounded-xl border p-3.5">
            <span className="text-muted-foreground text-xs font-medium">Session Role</span>
            <p className="text-foreground mt-1 text-sm font-medium">Administrator</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          APPEARANCE & THEME CUSTOMIZATION SUITE
         ───────────────────────────────────────────────────────────── */}
      <section className="border-border bg-card space-y-6 rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="border-border bg-muted/60 flex size-9 items-center justify-center rounded-xl border">
            <Palette className="text-foreground size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold">Theme & Appearance</h2>
            <p className="text-muted-foreground text-xs">
              Choose your base canvas mode, glass finish, and primary accent palette.
            </p>
          </div>
        </div>

        {/* Live Interactive Preview Card */}
        <div
          className="glass relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all"
          style={{ borderColor: activeAccent.color + '40' }}
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor: activeAccent.color,
                    boxShadow: `0 0 10px ${activeAccent.color}`,
                  }}
                />
                <span className="text-foreground text-xs font-semibold">
                  Live Theme Preview
                </span>
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: activeAccent.color + '15',
                    borderColor: activeAccent.color + '40',
                    color: activeAccent.color,
                  }}
                >
                  {activeAccent.name}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Base: <span className="text-foreground font-medium">{activeBase.name}</span> · Finish:{' '}
                <span className="text-foreground font-medium">{activeGlass.name}</span>
              </p>
            </div>

            {/* Preview controls */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="text-primary-foreground flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-md transition-all active:scale-95"
                style={{
                  backgroundColor: activeAccent.color,
                  boxShadow: `0 4px 16px ${activeAccent.glow}`,
                }}
              >
                <Sparkles className="size-3.5" />
                <span>Primary CTA</span>
              </button>

              <div className="border-border bg-card/60 flex h-8 items-center gap-1 rounded-xl border px-2.5">
                {[40, 70, 100, 60, 85].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full transition-all duration-300"
                    style={{
                      height: `${h * 0.2}px`,
                      backgroundColor: activeAccent.color,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 1. Base Canvas Theme Mode */}
        <div className="space-y-3">
          <label className="text-foreground text-xs font-medium">
            1. Base Surface & Contrast
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {BASE_THEMES.map((theme) => {
              const isSelected = baseId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => selectBase(theme.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/30'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-foreground text-xs font-semibold">{theme.name}</span>
                    {isSelected && <Check className="text-primary size-3.5" />}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-[11px] leading-tight">
                    {theme.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Glassy & Surface Finish */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="text-primary size-3.5" />
            <label className="text-foreground text-xs font-medium">
              2. Glassy & Surface Finish
            </label>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {GLASS_STYLES.map((glass) => {
              const isSelected = glassId === glass.id;
              return (
                <button
                  key={glass.id}
                  type="button"
                  onClick={() => selectGlass(glass.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/30'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-foreground text-xs font-semibold">{glass.name}</span>
                    {isSelected && <Check className="text-primary size-3.5" />}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-[11px] leading-tight">
                    {glass.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Theme Accent Color Palettes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: activeAccent.color }}
              />
              <label className="text-foreground text-xs font-medium">
                3. Accent Highlight Color ({ACCENT_PALETTES.length} Curated Options)
              </label>
            </div>
            <span className="text-muted-foreground text-xs">
              Selected: <strong className="text-foreground">{activeAccent.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {ACCENT_PALETTES.map((accent) => {
              const isSelected = accentId === accent.id;
              return (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() => selectAccent(accent.id)}
                  className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/30'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="size-4 shrink-0 rounded-full shadow-sm"
                        style={{
                          backgroundColor: accent.color,
                          boxShadow: isSelected ? `0 0 10px ${accent.color}` : 'none',
                        }}
                      />
                      <div>
                        <div className="text-foreground text-xs font-semibold">{accent.name}</div>
                        <div className="text-muted-foreground text-[10px] leading-tight">
                          {accent.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="text-primary size-3.5 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audio Visualizer & DSP Filtering */}
      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="border-border bg-muted/60 flex size-9 items-center justify-center rounded-xl border">
            <Volume2 className="text-foreground size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold">Audio & Visualizer</h2>
            <p className="text-muted-foreground text-xs">
              Browser-side WebRTC digital signal processing and soundstage visualization.
            </p>
          </div>
        </div>

        {/* Visualizer Type Grid */}
        <div className="space-y-2.5">
          <label className="text-foreground text-xs font-medium">
            Active Visualizer Style
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {VISUALIZERS.map((v) => {
              const isSelected = visualizerType === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChangeVisualizerType(v.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-primary/40 bg-primary/8 shadow-sm ring-1 ring-primary/20'
                      : 'border-border bg-muted/20 hover:bg-muted/50'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-foreground text-xs font-semibold">{v.name}</span>
                    {isSelected && <span className="bg-primary size-2 rounded-full" />}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">{v.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* DSP Filter Switches */}
        <div className="mt-6 space-y-3">
          <label className="text-foreground text-xs font-medium">
            Signal Processing Filters
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setEchoCancellation(!echoCancellation)}
              className="border-border bg-muted/20 hover:bg-muted/40 flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-colors"
            >
              <div>
                <div className="text-foreground text-xs font-medium">Echo Cancellation</div>
                <div className="text-muted-foreground text-[11px]">Eliminate speaker feedback</div>
              </div>
              <div
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  echoCancellation ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${
                    echoCancellation ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setNoiseSuppression(!noiseSuppression)}
              className="border-border bg-muted/20 hover:bg-muted/40 flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-colors"
            >
              <div>
                <div className="text-foreground text-xs font-medium">Noise Suppression</div>
                <div className="text-muted-foreground text-[11px]">Reduce room background hum</div>
              </div>
              <div
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  noiseSuppression ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${
                    noiseSuppression ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAutoGainControl(!autoGainControl)}
              className="border-border bg-muted/20 hover:bg-muted/40 flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-colors"
            >
              <div>
                <div className="text-foreground text-xs font-medium">Auto Gain Control</div>
                <div className="text-muted-foreground text-[11px]">Normalize microphone levels</div>
              </div>
              <div
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  autoGainControl ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${
                    autoGainControl ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Password & Security Card */}
      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="border-border bg-muted/60 flex size-9 items-center justify-center rounded-xl border">
            <Lock className="text-foreground size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold">Security & Password</h2>
            <p className="text-muted-foreground text-xs">
              Change the password used to access your Exia workspace.
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-500">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-500">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-medium">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-sm transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-medium">New Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-sm transition-all"
              required
            />

            {/* Password strength meter */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength <= 25
                        ? 'w-1/4 bg-rose-500'
                        : strength <= 50
                          ? 'w-2/4 bg-amber-500'
                          : strength <= 75
                            ? 'w-3/4 bg-primary'
                            : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>
                <div className="text-muted-foreground flex justify-between text-[11px]">
                  <span>Strength</span>
                  <span>
                    {strength <= 25
                      ? 'Weak'
                      : strength <= 50
                        ? 'Fair'
                        : strength <= 75
                          ? 'Good'
                          : 'Strong'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-medium">Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary-hover flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            style={{ boxShadow: `0 4px 16px ${activeAccent.glow}` }}
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </section>
    </div>
  );
}

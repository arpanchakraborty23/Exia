'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Sun,
  User,
  Volume2,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface SettingsViewProps {
  visualizerType: string;
  onChangeVisualizerType: (type: string) => void;
}

const GN_THEME_ACCENTS = [
  { id: 'emerald', name: ' Emerald', color: '#10b981', desc: 'Default GN Particle Conduit' },
  { id: 'crimson', name: 'Trans-Am Crimson', color: '#f43f5e', desc: 'Overload Performance Mode' },
  { id: 'cyan', name: 'Celestial Azure', color: '#06b6d4', desc: 'Quantum Burst High Bandwidth' },
  { id: 'stealth', name: 'Obsidian Stealth', color: '#a1a1aa', desc: 'Pure Monochromatic Minimal' },
];

const VISUALIZERS = [
  { id: 'aura', name: 'Aura Halo', desc: 'Luminescent ambient glowing core' },
  { id: 'wave', name: 'Quantum Wave', desc: 'Smooth sine wave frequency response' },
  { id: 'bar', name: 'Spectrum Bars', desc: 'Classic audio equalizer bars' },
  { id: 'radial', name: 'Radial Pulse', desc: 'Expanding sound pressure ring' },
];

export function SettingsView({ visualizerType, onChangeVisualizerType }: SettingsViewProps) {
  const { user, changePassword, logout } = useAuth();
  const { theme, setTheme } = useTheme();

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

  // Theme Accent selection
  const [selectedAccent, setSelectedAccent] = useState('cyan');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage('Access passkey updated successfully. Synchronized across nodes.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Passkey update failed. Verify current credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate password strength
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
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-foreground font-mono text-xl font-extrabold tracking-tight md:text-2xl">
            SETTINGS & SYSTEM CONFIGURATION
          </h1>
          <span className="rounded border border-primary/25 bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary dark:text-primary">
            SYSTEM CONTROL
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">
          Configure security credentials, audio input/output filters, and visual theme
          customization.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-card/80 border-border space-y-5 rounded-2xl border p-6 shadow-xs backdrop-blur-xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-primary dark:text-primary">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-foreground font-mono text-sm font-bold">
                Authenticated Operator Identity
              </h2>
              <p className="text-muted-foreground font-mono text-xs">
                Active token session verified with FastAPI
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-mono text-xs text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-300"
          >
            <LogOut className="size-3.5" />
            <span>End Session</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-3">
          <div className="bg-card border-border rounded-xl border p-3.5 shadow-xs">
            <span className="text-muted-foreground text-[10px] font-bold uppercase">
              Operator Handle
            </span>
            <p className="text-foreground mt-1 text-sm font-bold">{user?.name || 'Commander'}</p>
          </div>
          <div className="bg-card border-border rounded-xl border p-3.5 shadow-xs">
            <span className="text-muted-foreground text-[10px] font-bold uppercase">
              Security Email
            </span>
            <p className="text-foreground mt-1 truncate text-sm font-bold">
              {user?.email || 'admin@exia.local'}
            </p>
          </div>
          <div className="bg-card border-border rounded-xl border p-3.5 shadow-xs">
            <span className="text-muted-foreground text-[10px] font-bold uppercase">
              Access Privilege
            </span>
            <p className="mt-1 text-sm font-bold text-primary dark:text-primary">
              SUPERUSER (Level 5)
            </p>
          </div>
        </div>
      </div>

      {/* Voice Audio Stage & DSP Filtering */}
      <div className="bg-card/80 border-border space-y-6 rounded-2xl border p-6 shadow-xs backdrop-blur-xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/12 text-primary dark:text-primary">
              <Volume2 className="size-4.5" />
            </div>
            <div>
              <h2 className="text-foreground font-mono text-sm font-bold">
                Audio Visualizer & DSP Filters
              </h2>
              <p className="text-muted-foreground font-mono text-xs">
                Real-time WebRTC browser processing
              </p>
            </div>
          </div>
        </div>

        {/* Visualizer Type Grid */}
        <div className="space-y-2">
          <label className="text-muted-foreground block font-mono text-xs font-bold uppercase">
            Select Active Audio Visualizer
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {VISUALIZERS.map((v) => (
              <button
                key={v.id}
                onClick={() => onChangeVisualizerType(v.id)}
                className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all duration-200 ${visualizerType === v.id
                    ? 'text-foreground border-primary/35 bg-primary/15 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-foreground font-mono text-xs font-bold">{v.name}</span>
                  {visualizerType === v.id && (
                    <span className="size-2 rounded-full bg-primary shadow-[0_0_6px_#10b981]" />
                  )}
                </div>
                <p className="text-muted-foreground line-clamp-2 text-[10px]">{v.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* DSP Toggles */}
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
          <div
            onClick={() => setEchoCancellation(!echoCancellation)}
            className="bg-card border-border hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-xl border p-3.5 shadow-xs transition-colors"
          >
            <div>
              <div className="text-foreground font-mono text-xs font-bold">
                Acoustic Echo Cancel
              </div>
              <div className="text-muted-foreground font-mono text-[10px]">
                Eliminate speaker feedback
              </div>
            </div>
            <span
              className={`size-2.5 rounded-full ${echoCancellation
                  ? 'bg-primary shadow-[0_0_6px_#10b981]'
                  : 'bg-muted-foreground/40'
                }`}
            />
          </div>

          <div
            onClick={() => setNoiseSuppression(!noiseSuppression)}
            className="bg-card border-border hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-xl border p-3.5 shadow-xs transition-colors"
          >
            <div>
              <div className="text-foreground font-mono text-xs font-bold">
                AI Noise Suppression
              </div>
              <div className="text-muted-foreground font-mono text-[10px]">
                Filter background hum
              </div>
            </div>
            <span
              className={`size-2.5 rounded-full ${noiseSuppression
                  ? 'bg-primary shadow-[0_0_6px_#10b981]'
                  : 'bg-muted-foreground/40'
                }`}
            />
          </div>

          <div
            onClick={() => setAutoGainControl(!autoGainControl)}
            className="bg-card border-border hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-xl border p-3.5 shadow-xs transition-colors"
          >
            <div>
              <div className="text-foreground font-mono text-xs font-bold">Auto Gain Control</div>
              <div className="text-muted-foreground font-mono text-[10px]">
                Normalize voice volume
              </div>
            </div>
            <span
              className={`size-2.5 rounded-full ${autoGainControl
                  ? 'bg-primary shadow-[0_0_6px_#10b981]'
                  : 'bg-muted-foreground/40'
                }`}
            />
          </div>
        </div>
      </div>

      {/* Interface Theme & Display Mode */}
      <div className="bg-card/80 border-border space-y-4 rounded-2xl border p-6 shadow-xs backdrop-blur-xl">
        <div className="border-border flex items-center gap-2.5 border-b pb-4">
          <div className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-primary dark:text-primary">
            <Sun className="size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground font-mono text-sm font-bold">
              Interface Theme & Display Mode
            </h2>
            <p className="text-muted-foreground font-mono text-xs">
              Switch between solar light, tactical dark, or system preference
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${theme === 'light'
                ? 'text-foreground border-primary/35 bg-primary/15 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/15 p-2 text-amber-500">
                <Sun className="size-4" />
              </div>
              {theme === 'light' && (
                <Check className="size-4 text-primary dark:text-primary" />
              )}
            </div>
            <div className="text-foreground font-mono text-xs font-bold">Solar Light Mode</div>
            <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">
              High-contrast daytime clarity
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${theme === 'dark'
                ? 'text-foreground border-primary/35 bg-primary/15 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-lg border border-primary/25 bg-primary/12 p-2 text-primary">
                <Moon className="size-4" />
              </div>
              {theme === 'dark' && (
                <Check className="size-4 text-primary dark:text-primary" />
              )}
            </div>
            <div className="text-foreground font-mono text-xs font-bold">GN Tactical Dark Mode</div>
            <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">
              Stealth nighttime command operations
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${theme === 'system'
                ? 'text-foreground border-primary/35 bg-primary/15 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-lg border border-primary/25 bg-primary/12 p-2 text-primary">
                <Monitor className="size-4" />
              </div>
              {theme === 'system' && (
                <Check className="size-4 text-primary dark:text-primary" />
              )}
            </div>
            <div className="text-foreground font-mono text-xs font-bold">OS Auto Sync</div>
            <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">
              Synchronize with device system settings
            </div>
          </button>
        </div>
      </div>

      {/* GN Drive Accent Color Customization */}
      <div className="bg-card/80 border-border space-y-4 rounded-2xl border p-6 shadow-xs backdrop-blur-xl">
        <div className="border-border flex items-center gap-2.5 border-b pb-4">
          <div className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-primary dark:text-primary">
            <Palette className="size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground font-mono text-sm font-bold">
              GN Particle Accent Scheme
            </h2>
            <p className="text-muted-foreground font-mono text-xs">
              Customize tactical HUD glow highlights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GN_THEME_ACCENTS.map((accent) => (
            <div
              key={accent.id}
              onClick={() => setSelectedAccent(accent.id)}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${selectedAccent === accent.id
                  ? 'bg-muted border-primary/40 shadow-xs'
                  : 'bg-card border-border hover:bg-muted/50'
                }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div
                  className="border-border size-4 rounded-full border shadow-xs"
                  style={{ backgroundColor: accent.color }}
                />
                {selectedAccent === accent.id && (
                  <Check className="size-3.5 text-primary dark:text-primary" />
                )}
              </div>
              <div className="text-foreground font-mono text-xs font-bold">{accent.name}</div>
              <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                {accent.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Password & Security Card */}
      <div className="bg-card/80 border-border space-y-5 rounded-2xl border p-6 shadow-xs backdrop-blur-xl">
        <div className="border-border flex items-center gap-2.5 border-b pb-4">
          <div className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-primary dark:text-primary">
            <Lock className="size-4.5" />
          </div>
          <div>
            <h2 className="text-foreground font-mono text-sm font-bold">
              Operator Password & Security
            </h2>
            <p className="text-muted-foreground font-mono text-xs">
              Update login authentication credentials
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/15 p-3.5 font-mono text-xs text-primary dark:text-primary">
            <CheckCircle2 className="size-4 shrink-0 text-primary dark:text-primary" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 font-mono text-xs text-rose-600 dark:text-rose-300">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4 font-mono text-xs">
          <div>
            <label className="text-foreground mb-1 block font-semibold">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 w-full rounded-xl border px-3 py-2 focus:border-primary/50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-foreground mb-1 block font-semibold">New Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 w-full rounded-xl border px-3 py-2 focus:border-primary/50 focus:outline-none"
              required
            />

            {/* Password strength meter */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all duration-300 ${strength <= 25
                        ? 'w-1/4 bg-rose-500'
                        : strength <= 50
                          ? 'w-2/4 bg-amber-500'
                          : strength <= 75
                            ? 'w-3/4 bg-primary'
                            : 'w-full bg-primary'
                      }`}
                  />
                </div>
                <div className="text-muted-foreground flex justify-between text-[10px]">
                  <span>Strength</span>
                  <span>
                    {strength <= 25
                      ? 'Weak'
                      : strength <= 50
                        ? 'Medium'
                        : strength <= 75
                          ? 'Strong'
                          : 'Military Grade'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-foreground mb-1 block font-semibold">Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 w-full rounded-xl border px-3 py-2 focus:border-primary/50 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-black shadow-[0_0_15px_rgba(31,213,249,0.25)] transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Settings,
  Lock,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Server,
  LogOut,
  Palette,
  Volume2,
  Mic,
  Zap,
  Activity,
  Sliders,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface SettingsViewProps {
  visualizerType: string;
  onChangeVisualizerType: (type: string) => void;
}

const GN_THEME_ACCENTS = [
  { id: 'emerald', name: 'GN-001 Emerald', color: '#10b981', desc: 'Default GN Particle Conduit' },
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
  const [selectedAccent, setSelectedAccent] = useState('emerald');

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
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccessMessage(res.message || 'Password successfully updated');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.length >= 12) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-mono">
            SETTINGS & SYSTEM CONFIGURATION
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30">
            SYSTEM CONTROL
          </span>
        </div>
        <p className="text-xs md:text-sm text-zinc-400 mt-1">
          Configure security credentials, audio input/output filters, and visual theme customization.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-white">Authenticated Operator Identity</h2>
              <p className="text-xs text-zinc-400 font-mono">Active token session verified with FastAPI</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono border border-rose-500/30 transition-colors"
          >
            <LogOut className="size-3.5" />
            <span>End Session</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Operator Handle</span>
            <p className="text-sm font-bold text-white mt-1">{user?.name || 'Commander'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Security Email</span>
            <p className="text-sm font-bold text-white mt-1 truncate">{user?.email || 'admin@exia.local'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Access Privilege</span>
            <p className="text-sm font-bold text-emerald-400 mt-1">SUPERUSER (Level 5)</p>
          </div>
        </div>
      </div>

      {/* Voice Audio Stage & DSP Filtering */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Volume2 className="size-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-white">
                Audio Visualizer & DSP Filters
              </h2>
              <p className="text-xs text-zinc-400 font-mono">Real-time WebRTC browser processing</p>
            </div>
          </div>
        </div>

        {/* Visualizer Type Grid */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-zinc-400 font-bold block">
            Select Active Audio Visualizer
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VISUALIZERS.map((v) => (
              <button
                key={v.id}
                onClick={() => onChangeVisualizerType(v.id)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  visualizerType === v.id
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-white">{v.name}</span>
                  {visualizerType === v.id && (
                    <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-2">{v.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* DSP Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div
            onClick={() => setEchoCancellation(!echoCancellation)}
            className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between cursor-pointer hover:border-white/[0.12] transition-colors"
          >
            <div>
              <div className="text-xs font-mono font-bold text-white">Acoustic Echo Cancel</div>
              <div className="text-[10px] font-mono text-zinc-500">Eliminate speaker feedback</div>
            </div>
            <span
              className={`size-2.5 rounded-full ${
                echoCancellation ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-zinc-700'
              }`}
            />
          </div>

          <div
            onClick={() => setNoiseSuppression(!noiseSuppression)}
            className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between cursor-pointer hover:border-white/[0.12] transition-colors"
          >
            <div>
              <div className="text-xs font-mono font-bold text-white">AI Noise Suppression</div>
              <div className="text-[10px] font-mono text-zinc-500">Filter background hum</div>
            </div>
            <span
              className={`size-2.5 rounded-full ${
                noiseSuppression ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-zinc-700'
              }`}
            />
          </div>

          <div
            onClick={() => setAutoGainControl(!autoGainControl)}
            className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between cursor-pointer hover:border-white/[0.12] transition-colors"
          >
            <div>
              <div className="text-xs font-mono font-bold text-white">Auto Gain Control</div>
              <div className="text-[10px] font-mono text-zinc-500">Normalize voice volume</div>
            </div>
            <span
              className={`size-2.5 rounded-full ${
                autoGainControl ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-zinc-700'
              }`}
            />
          </div>
        </div>
      </div>

      {/* GN Drive Accent Color Customization */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.08]">
          <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Palette className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-white">GN Particle Accent Scheme</h2>
            <p className="text-xs text-zinc-400 font-mono">Customize tactical HUD glow highlights</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GN_THEME_ACCENTS.map((accent) => (
            <div
              key={accent.id}
              onClick={() => setSelectedAccent(accent.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                selectedAccent === accent.id
                  ? 'bg-white/[0.05] border-emerald-500/50 shadow-md'
                  : 'bg-black/30 border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="size-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: accent.color }}
                />
                {selectedAccent === accent.id && <Check className="size-3.5 text-emerald-400" />}
              </div>
              <div className="text-xs font-bold font-mono text-white">{accent.name}</div>
              <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{accent.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Password & Security Card */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.08]">
          <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Lock className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-white">Operator Password & Security</h2>
            <p className="text-xs text-zinc-400 font-mono">Update login authentication credentials</p>
          </div>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md font-mono text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
              required
            />

            {/* Password strength meter */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength <= 25
                        ? 'bg-rose-500 w-1/4'
                        : strength <= 50
                        ? 'bg-amber-500 w-2/4'
                        : strength <= 75
                        ? 'bg-teal-400 w-3/4'
                        : 'bg-emerald-400 w-full'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Strength</span>
                  <span>
                    {strength <= 25 ? 'Weak' : strength <= 50 ? 'Medium' : strength <= 75 ? 'Strong' : 'Military Grade'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

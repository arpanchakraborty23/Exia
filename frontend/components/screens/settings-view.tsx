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
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface SettingsViewProps {
  visualizerType: string;
  onChangeVisualizerType: (type: string) => void;
}

export function SettingsView({ visualizerType, onChangeVisualizerType }: SettingsViewProps) {
  const { user, changePassword, logout } = useAuth();

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Settings & Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage credentials, security, and voice stage preferences
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border/80">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <User className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">User Profile</h2>
            <p className="text-xs text-muted-foreground">Active authenticated session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Display Name</span>
            <p className="text-sm font-medium text-foreground mt-0.5">{user?.name || 'Home Owner'}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</span>
            <p className="text-sm font-medium text-foreground mt-0.5">{user?.email || 'admin@homeassistant.local'}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">User ID</span>
            <p className="text-sm font-mono font-medium text-foreground mt-0.5">{user?.id || 'usr_admin'}</p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/80">
          <div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Lock className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
            <p className="text-xs text-muted-foreground">Update your account login credentials</p>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">Current Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">New Password</label>
              <input
                type="password"
                required
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* Voice Visualizer Preference Card */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border/80">
          <div className="size-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
            <Palette className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Audio Visualizer Preset</h2>
            <p className="text-xs text-muted-foreground">Select how audio frequencies animate on the stage</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['aura', 'wave', 'bar', 'radial'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChangeVisualizerType(type)}
              className={`p-3 rounded-xl border text-xs font-medium capitalize text-center transition-all ${
                visualizerType === type
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Backend Connection Information Card */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-border/80">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Server className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Backend Architecture</h2>
            <p className="text-xs text-muted-foreground">REST API and WebRTC integration</p>
          </div>
        </div>

        <div className="space-y-2 text-xs font-mono text-muted-foreground bg-muted/40 p-3.5 rounded-xl border border-border/60">
          <div>REST Base URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}</div>
          <div>LiveKit Token Source: Backend POST /livekit/token</div>
          <div>Session Lifecycle: POST /sessions/{`{id}`}/end on disconnect</div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <button
          onClick={() => logout()}
          className="px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium hover:bg-destructive/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>Sign Out of Home Assistant</span>
        </button>
      </div>
    </div>
  );
}

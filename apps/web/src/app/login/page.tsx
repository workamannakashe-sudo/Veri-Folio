'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShieldCheck, GraduationCap, UserCheck, Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, setStoredToken, setStoredUser } from '@/lib/api';

export default function LoginPage() {
  const { loginAsDemoRole, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const demoRoles = [
    { role: 'STUDENT' as const, label: 'Student', name: 'Rohan Sharma', icon: GraduationCap, email: 'alice.student@school1.edu' },
    { role: 'MENTOR' as const, label: 'Mentor', name: 'Dr. Anand Verma', icon: UserCheck, email: 'bob.mentor@school1.edu' },
    { role: 'ADMIN' as const, label: 'School Admin', name: 'Clara Oswald', icon: ShieldCheck, email: 'clara.admin@school1.edu' },
    { role: 'VIEWER' as const, label: 'Org Viewer', name: 'Verified Partner', icon: Building2, email: 'david.viewer@enterprise.org' },
  ];

  const handleQuickLogin = async (role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER') => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await loginAsDemoRole(role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await apiFetch('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setStep('OTP');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<{ accessToken: string; user: any }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code: otp })
      });
      setStoredToken(data.accessToken);
      setStoredUser(data.user);

      if (data.user.role === 'STUDENT') window.location.href = '/dashboard/student';
      else if (data.user.role === 'MENTOR') window.location.href = '/dashboard/mentor';
      else if (data.user.role === 'ADMIN') window.location.href = '/dashboard/admin';
      else window.location.href = '/dashboard/viewer';
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
      </div>

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--cyan)]">VeriFolio Sign In</h1>
          <p className="text-sm text-[var(--muted)]">
            Select a verified persona to explore the mentor-verified skill ecosystem.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Quick Demo Role Switcher */}
        <GlassCard isTextPanel className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Instant 1-Click Persona Sign In
            </p>
            {isSubmitting && <Loader2 className="w-4 h-4 text-[var(--cyan)] animate-spin" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {demoRoles.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.role}
                  disabled={isSubmitting || isLoading}
                  onClick={() => handleQuickLogin(r.role)}
                  className="flex flex-col items-center p-3 rounded-2xl glass hover:border-[var(--cyan)] hover:bg-[var(--glass)] transition-all text-center focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] disabled:opacity-50 group"
                >
                  <Icon className="w-6 h-6 text-[var(--cyan)] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-[var(--text)]">{r.label}</span>
                  <span className="text-[11px] text-[var(--muted)]">{r.name}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* One-Time Code Form */}
        <GlassCard isTextPanel>
          {step === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block text-sm font-medium text-[var(--text)]">
                School Email Code Sign In
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice.student@school1.edu"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Send One-Time Code</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <label className="block text-sm font-medium text-[var(--text)]">
                Enter 6-Digit Code for {email}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text)] text-center tracking-widest text-lg font-mono focus:border-[var(--cyan)] focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('EMAIL')}
                  className="px-4 py-2.5 rounded-xl border border-[var(--glass-border)] text-xs text-[var(--muted)] hover:text-white"
                >
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Verify & Sign In</span>
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}

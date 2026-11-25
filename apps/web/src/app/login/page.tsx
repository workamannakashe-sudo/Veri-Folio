'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppFrame, Button, StatusBadge } from '@verifolio/ui';
import { ShieldCheck, GraduationCap, UserCheck, Building2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, setStoredToken, setStoredUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsDemoRole, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const demoRoles = [
    { role: 'STUDENT' as const, label: 'Student', name: 'Rohan Sharma', icon: GraduationCap, email: 'alice.student@school1.edu', color: 'bg-[#7E7AE6]' },
    { role: 'MENTOR' as const, label: 'Mentor', name: 'Dr. Anand Verma', icon: UserCheck, email: 'bob.mentor@school1.edu', color: 'bg-[#FFA172]' },
    { role: 'ADMIN' as const, label: 'School Admin', name: 'Clara Oswald', icon: ShieldCheck, email: 'clara.admin@school1.edu', color: 'bg-[#38BDF8]' },
    { role: 'VIEWER' as const, label: 'Org Viewer', name: 'Verified Partner', icon: Building2, email: 'david.viewer@enterprise.org', color: 'bg-[#FEF3C7]' },
  ];

  const handleQuickLogin = async (role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER') => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await loginAsDemoRole(role);
      router.push(`/dashboard/${role.toLowerCase()}`);
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
    if (!otp) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<{ token: string; user: any }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
      if (data.token) {
        setStoredToken(data.token);
        setStoredUser(data.user);
        router.push(`/dashboard/${data.user.role.toLowerCase()}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid OTP code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppFrame
      topBarProps={{
        userName: 'Guest',
        progressPercent: 0,
        activePath: '/login',
        onNavigate: (path) => router.push(path),
      }}
    >
      <div className="max-w-4xl mx-auto py-6 sm:py-10">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F1F0FE] text-xs font-bold text-[#7E7AE6] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EduView Institutional Access</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#191A23]">
            Welcome to VeriFolio
          </h1>
          <p className="text-sm text-[#6B6F76] mt-2 max-w-md mx-auto">
            Sign in to access your verified skills, mentor verification queues, and audit credentials.
          </p>
        </div>

        {errorMsg && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#DC2626] text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* 2-Column: Quick Demo Roles + OTP Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Quick Demo Personas */}
          <div className="rounded-[32px] bg-[#F4F5FB] p-6 border border-[#E7E8EB] flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[#191A23] mb-1">
                Instant Demo Access
              </h2>
              <p className="text-xs text-[#6B6F76] mb-4">
                Select a role to inspect pre-seeded institutional portfolios immediately.
              </p>

              <div className="flex flex-col gap-2.5">
                {demoRoles.map((dr) => {
                  const Icon = dr.icon;
                  return (
                    <button
                      key={dr.role}
                      onClick={() => handleQuickLogin(dr.role)}
                      disabled={isSubmitting}
                      className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#F1F0FE] border border-[#E7E8EB] hover:border-[#B5B0F4] transition-all flex items-center justify-between group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${dr.color} text-[#191A23] flex items-center justify-center font-bold shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#191A23] group-hover:text-[#7E7AE6] transition-colors block">
                            {dr.name}
                          </span>
                          <span className="text-[11px] text-[#6B6F76]">
                            {dr.label} ({dr.email})
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#6B6F76] group-hover:text-[#7E7AE6] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Institutional Passwordless OTP Form */}
          <div className="rounded-[32px] bg-[#F4F5FB] p-6 border border-[#E7E8EB]">
            <h2 className="text-base font-bold text-[#191A23] mb-1">
              Institutional Email OTP
            </h2>
            <p className="text-xs text-[#6B6F76] mb-4">
              Enter your registered school or employer email to receive a login code.
            </p>

            {step === 'EMAIL' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-[#191A23] mb-1.5">
                    School Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.edu"
                    className="w-full h-11 px-4 rounded-xl bg-white border border-[#E7E8EB] text-xs font-medium text-[#191A23] placeholder:text-[#9A9EA6] focus:outline-none focus:ring-2 focus:ring-[#B5B0F4]"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="w-full"
                >
                  Request OTP Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-xs font-bold text-[#191A23] mb-1.5">
                    Enter Verification Code sent to {email}
                  </label>
                  <input
                    id="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full h-11 px-4 rounded-xl bg-white border border-[#E7E8EB] text-xs font-extrabold text-[#191A23] tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#B5B0F4]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep('EMAIL')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    size="md"
                    isLoading={isSubmitting}
                    className="flex-2"
                  >
                    Verify & Enter
                  </Button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </AppFrame>
  );
}

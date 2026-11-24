'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowRight, Loader2, UserCheck, GraduationCap, ShieldCheck, Building2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: Array<'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER'>;
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isLoading, switchRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0E101D] text-white">
        <Loader2 className="w-8 h-8 text-[var(--cyan)] animate-spin mb-3" />
        <p className="text-xs text-[var(--muted)] font-medium">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0E101D] text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#161724] border border-[#2B2D3A] text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Sign In Required</h2>
            <p className="text-xs text-[#8C90A8] leading-relaxed">
              Please sign in with your school account to access this verified portal.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold text-sm flex items-center justify-center gap-2"
          >
            <span>Go to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    const requiredRole = allowedRoles[0];
    const roleIcons = {
      STUDENT: GraduationCap,
      MENTOR: UserCheck,
      ADMIN: ShieldCheck,
      VIEWER: Building2
    };
    const TargetIcon = roleIcons[requiredRole] || ShieldCheck;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0E101D] text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#161724] border border-[#2B2D3A] text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Role Access Restricted</h2>
            <p className="text-xs text-[#8C90A8] leading-relaxed">
              You are currently signed in as <strong className="text-white">{user.fullName || user.email}</strong> (<span className="text-[var(--cyan)] font-semibold">{user.role}</span>).
              This area requires <strong className="text-amber-300">{requiredRole}</strong> credentials.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => switchRole(requiredRole)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8C85FF] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-md"
            >
              <TargetIcon className="w-4 h-4" />
              <span>Switch to {requiredRole} Persona</span>
            </button>

            <Link
              href={user.role === 'STUDENT' ? '/dashboard/student' : user.role === 'MENTOR' ? '/dashboard/mentor' : user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/viewer'}
              className="block w-full py-2 rounded-xl border border-[#2B2D3A] text-xs text-[#8C90A8] hover:text-white"
            >
              Return to My {user.role} Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

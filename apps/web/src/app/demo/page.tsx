'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Building2, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { GlassNav } from '@/components/GlassNav';
import { useAuth } from '@/context/AuthContext';

export default function DemoPage() {
  const router = useRouter();
  const { loginAsDemoRole } = useAuth();
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [activeRole, setActiveRole] = useState<'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER'>('STUDENT');
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [tourStep, setTourStep] = useState<number>(1);
  const [showTour, setShowTour] = useState<boolean>(true);

  useEffect(() => {
    async function loadSnapshot() {
      try {
        const res = await fetch('/demo-snapshot.json');
        if (res.ok) {
          const data = await res.json();
          setSnapshot(data);
        }
      } catch {
        // static fallback
      }
    }
    loadSnapshot();
  }, []);

  const handleRoleSelect = async (role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER') => {
    setActiveRole(role);
    try {
      await loginAsDemoRole(role);
    } catch {
      // offline demo mode uses state
    }
  };

  const demoTourSteps = [
    {
      step: 1,
      role: 'STUDENT',
      title: 'Student Portfolio Claim',
      desc: 'Students document projects (e.g. Campus Waste-Sorting Rover) and submit evidence to roster-linked mentors.',
      link: '/dashboard/student'
    },
    {
      step: 2,
      role: 'MENTOR',
      title: 'Mentor Mobile Attestation',
      desc: 'Mentors evaluate evidence, select rubric levels, input authentic evaluation notes, and sign with Ed25519.',
      link: '/dashboard/mentor'
    },
    {
      step: 3,
      role: 'VIEWER',
      title: 'Public Check Verification',
      desc: 'Inspect the cryptographic seal on the public check page with zero login and instant QR code.',
      link: '/check/ent-stu-1-1'
    },
    {
      step: 4,
      role: 'ADMIN',
      title: 'Tamper Evidence Detection',
      desc: 'Simulate database modification: observe how SHA-256 hash divergence flips state to Changed.',
      link: '/check/ent-stu-1-2'
    },
    {
      step: 5,
      role: 'VIEWER',
      title: 'Employer & University Search',
      desc: 'Search verified competencies across 50 students and inspect authentic verified achievements.',
      link: '/dashboard/viewer'
    }
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0B1030,#1B1650_55%,#0E2A4A)] text-[#F4F6FF] selection:bg-[#5EEAD4] selection:text-black">
      
      {/* Persistent Demo Mode Banner */}
      <div className="bg-[#1B1650]/90 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse" />
          <span className="font-bold text-[#5EEAD4]">Demo Mode:</span>
          <span className="text-[#B6BCD6] hidden sm:inline">50 Seeded Students &bull; Deterministic Ed25519 Seals &bull; VeriFolio Demo School</span>
        </div>

        {/* Global Role Switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full border border-white/10 text-xs">
          {[
            { role: 'STUDENT' as const, label: 'Student', name: 'Aarav (10A)' },
            { role: 'MENTOR' as const, label: 'Mentor', name: 'Ms. Kulkarni' },
            { role: 'ADMIN' as const, label: 'Admin', name: 'Principal Office' },
            { role: 'VIEWER' as const, label: 'Viewer', name: 'Horizon College' }
          ].map((item) => (
            <button
              key={item.role}
              onClick={() => handleRoleSelect(item.role)}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                activeRole === item.role
                  ? 'bg-[#5EEAD4] text-black shadow-xs'
                  : 'text-[#B6BCD6] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/"
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
          >
            Exit Demo
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-8">
        
        {/* Guided 5-Step Tour Card */}
        {showTour && (
          <GlassCard className="p-5 sm:p-6 border-[#5EEAD4]/30 bg-[rgba(14,18,40,0.85)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#5EEAD4]" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  3-Minute Judge Guided Tour (Step {tourStep} of 5)
                </h2>
              </div>
              <button
                onClick={() => setShowTour(false)}
                className="text-xs text-[#B6BCD6] hover:text-white"
              >
                Dismiss Tour
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {demoTourSteps.map((s) => (
                <div
                  key={s.step}
                  onClick={() => {
                    setTourStep(s.step);
                    handleRoleSelect(s.role as any);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    tourStep === s.step
                      ? 'bg-[#5EEAD4]/15 border-[#5EEAD4] text-white'
                      : 'bg-white/5 border-white/10 text-[#B6BCD6] hover:border-white/30'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#5EEAD4] inline-block mb-1.5">
                      Step {s.step}
                    </span>
                    <h3 className="text-xs font-bold text-white leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-[11px] text-[#B6BCD6] mt-1 line-clamp-3">
                      {s.desc}
                    </p>
                  </div>
                  <Link
                    href={s.link}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#5EEAD4] hover:underline"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Role Content Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5EEAD4]">
                Active Sandbox View
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {activeRole === 'STUDENT' && 'Aarav Sharma — Student Portfolio (Class 10A)'}
                {activeRole === 'MENTOR' && 'Ms. Sunita Kulkarni — Mentor Review Inbox'}
                {activeRole === 'ADMIN' && 'Principal Office — Roster & Cryptographic Ledger'}
                {activeRole === 'VIEWER' && 'Horizon College Admissions — Talent Search'}
              </h2>
            </div>

            <Link
              href={
                activeRole === 'STUDENT' ? '/dashboard/student' :
                activeRole === 'MENTOR' ? '/dashboard/mentor' :
                activeRole === 'ADMIN' ? '/dashboard/admin' : '/dashboard/viewer'
              }
              className="px-4 py-2 rounded-full bg-[#5EEAD4] text-black font-bold text-xs hover:bg-[#34D399] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Open Dedicated {activeRole} Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Snapshot Showcase Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <GlassCard className="p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] inline-block mb-2">
                  Verified Seal Showcase
                </span>
                <h3 className="text-base font-bold text-white">
                  Autonomous Campus Waste-Sorting Rover
                </h3>
                <p className="text-xs text-[#B6BCD6] mt-1.5 leading-relaxed">
                  Engineered obstacle-avoidance lidar rover using Arduino and pathfinding algorithms. Sealed with Ed25519 digital signature.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-[#B6BCD6]">By Aarav Sharma</span>
                <Link
                  href="/check/ent-stu-1-1"
                  className="text-xs font-bold text-[#5EEAD4] hover:underline flex items-center gap-1"
                >
                  <span>Verify Seal</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-between border-[#F87171]/40">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#F87171]/20 text-[#F87171] inline-block mb-2">
                  Tamper Detection Showcase
                </span>
                <h3 className="text-base font-bold text-white">
                  Autonomous Rover [TAMPERED]
                </h3>
                <p className="text-xs text-[#B6BCD6] mt-1.5 leading-relaxed">
                  Simulated database manipulation: title was altered after sealing. The check page immediately flags hash divergence.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-[#F87171] font-bold">Tamper Evident</span>
                <Link
                  href="/check/ent-stu-1-2"
                  className="text-xs font-bold text-[#F87171] hover:underline flex items-center gap-1"
                >
                  <span>Inspect Detection</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#A78BFA]/20 text-[#A78BFA] inline-block mb-2">
                  50-Student Dataset
                </span>
                <h3 className="text-base font-bold text-white">
                  Pre-Loaded Institutional Cohort
                </h3>
                <p className="text-xs text-[#B6BCD6] mt-1.5 leading-relaxed">
                  50 students across 6 classes, 12 mentors, 10 clubs/teams, 6 minor consent forms, and 125+ verified and pending claims.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-[#B6BCD6]">Zero Login Required</span>
                <Link
                  href="/dashboard/viewer"
                  className="text-xs font-bold text-[#5EEAD4] hover:underline flex items-center gap-1"
                >
                  <span>Explore All 50</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>

      </div>
    </div>
  );
}

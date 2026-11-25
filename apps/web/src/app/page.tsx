'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EduViewDashboard } from '@/components/EduViewDashboard';
import { ShieldCheck, GraduationCap, UserCheck, Building2, ExternalLink, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'bento' | 'roles'>('bento');

  return (
    <div className="min-h-screen bg-[#0E101D] text-[#F3F4F8] flex flex-col justify-between p-2 sm:p-4 md:p-6 selection:bg-[#6C63FF] selection:text-white">
      {/* Top Banner Navigation Bar */}
      <header className="max-w-[1440px] w-full mx-auto flex items-center justify-between py-3 px-4 rounded-2xl bg-[#161722]/80 backdrop-blur-md border border-[#2B2D3A] shadow-md mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#A5B4FC] flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              VeriFolio
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#6C63FF]/20 text-[#A5B4FC] border border-[#6C63FF]/30 hidden sm:inline-block">
                EduView Theme
              </span>
            </span>
          </div>
        </div>

        {/* View Switcher / Quick Roles */}
        <div className="flex items-center gap-2">
          <Link
            href="/demo"
            className="px-4 py-1.5 rounded-full bg-[#5EEAD4] text-black font-extrabold text-xs hover:bg-[#34D399] transition-all shadow-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Enter Demo Mode</span>
          </Link>

          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all border border-white/10"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center">
        {viewMode === 'bento' ? (
          <EduViewDashboard />
        ) : (
          <div className="max-w-4xl w-full mx-auto my-8 space-y-8 text-center px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181926] border border-[#2B2D3A] text-xs text-[#A5B4FC] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#6C63FF] animate-pulse" />
              Cryptographically Sealed Skill Records
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Mentor-Verified Skill Portfolios <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A5B4FC] via-[#FFA172] to-[#7E7AE6]">
                That Anyone Can Check
              </span>
            </h1>

            <p className="text-sm md:text-base text-[#8C90A8] max-w-xl mx-auto leading-relaxed">
              The teacher or coach who supervised the work confirms it in two minutes on a phone, producing an Ed25519-sealed record verifiable on a public check page.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
              {[
                { title: 'Student Portfolio', href: '/dashboard/student', desc: 'Add project entries, evidence, and view verification seals.', icon: GraduationCap, color: '#7E7AE6' },
                { title: 'Mentor Inbox', href: '/dashboard/mentor', desc: 'Mobile-first review of student evidence and 1-click Ed25519 signing.', icon: UserCheck, color: '#FFA172' },
                { title: 'School Administration', href: '/dashboard/admin', desc: 'Roster CSV import, group mapping, and hash-chain audit integrity.', icon: ShieldCheck, color: '#38BDF8' },
                { title: 'Public Organization Viewer', href: '/dashboard/viewer', desc: 'Search published student skill portfolios and cryptographic proof.', icon: Building2, color: '#FEF3C7' }
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <Link
                    key={r.title}
                    href={r.href}
                    className="p-5 rounded-3xl bg-[#181926] border border-[#2B2D3A] hover:border-[#6C63FF] transition-all hover:-translate-y-1 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 text-white" style={{ backgroundColor: `${r.color}25`, color: r.color }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#A5B4FC] transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-xs text-[#8C90A8] mt-1.5 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#A5B4FC]">
                      <span>Open portal</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1440px] w-full mx-auto text-center py-4 text-xs text-[#62667E] mt-4 border-t border-[#1C1E2B]">
        VeriFolio &bull; Mentor-verified skill portfolios &bull; Designed with EduView Bento System
      </footer>
    </div>
  );
}

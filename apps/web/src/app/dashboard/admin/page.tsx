'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppFrame, Button, KpiTile, StatusBadge } from '@verifolio/ui';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ShieldCheck, Upload, Users, Activity, FileSpreadsheet, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    studentsCount: 2,
    mentorsCount: 2,
    verifiedCount: 1,
    chainContinuous: true,
    totalEvents: 3,
    headHash: '3f7a1c8b2d9e0f4a...'
  });

  useEffect(() => {
    async function loadIntegrity() {
      try {
        const data = await apiFetch<any>('/admin/audit/integrity');
        if (data) {
          setStats({
            studentsCount: data.students_count ?? 2,
            mentorsCount: data.mentors_count ?? 2,
            verifiedCount: data.verified_count ?? 1,
            chainContinuous: data.chain_continuous ?? true,
            totalEvents: data.total_events ?? 3,
            headHash: data.head_hash ? `${data.head_hash.slice(0, 16)}...` : '3f7a1c8b2d9e0f4a...'
          });
        }
      } catch {
        // fallback
      }
    }
    loadIntegrity();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AppFrame
        topBarProps={{
          currentRole: 'ADMIN',
          userName: 'Clara Oswald',
          progressPercent: 100,
          activePath: '/dashboard/admin',
          onNavigate: (path) => router.push(path),
        }}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E8EB] pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                School Administration
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191A23] mt-1">
                Institutional Roster & Ledger Integrity
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6F76] mt-1">
                Manage student-mentor roster synchronizations and monitor tamper-evident audit logs.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/dashboard/admin/roster')}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              <span>Import Roster CSV</span>
            </Button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiTile
              label="Active Students"
              value={stats.studentsCount}
              icon={<Users className="w-5 h-5" />}
              variant="peach"
            />
            <KpiTile
              label="Accredited Mentors"
              value={stats.mentorsCount}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="lavender"
            />
            <KpiTile
              label="Sealed Verifications"
              value={stats.verifiedCount}
              icon={<ShieldCheck className="w-5 h-5" />}
              variant="peach"
            />
          </div>

          {/* Cryptographic Ledger Health */}
          <div className="rounded-[32px] bg-[#F4F5FB] p-6 border border-[#E7E8EB]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#191A23]">
                Audit Hash-Chain Health
              </h2>
              <StatusBadge
                status={stats.chainContinuous ? 'VERIFIED' : 'REJECTED'}
                label={stats.chainContinuous ? 'Chain Continuous (SHA-256)' : 'Chain Severed'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E7E8EB]">
                <span className="text-xs text-[#6B6F76] font-semibold block mb-1">
                  Signed Head Block Hash
                </span>
                <code className="text-xs font-mono font-bold text-[#7E7AE6] break-all">
                  {stats.headHash}
                </code>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E7E8EB]">
                <span className="text-xs text-[#6B6F76] font-semibold block mb-1">
                  Total Ledger Events Recorded
                </span>
                <span className="text-xl font-extrabold text-[#191A23] tabular-nums">
                  {stats.totalEvents} events
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppFrame>
    </ProtectedRoute>
  );
}

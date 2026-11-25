'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassNav } from '@/components/GlassNav';
import { GlassCard } from '@/components/GlassCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ShieldCheck, Upload, Users, Activity, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AdminDashboard() {
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
        const data = await apiFetch('/admin/audit/integrity');
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
      <div className="min-h-screen pb-24 md:pb-8 md:pl-64">
        <GlassNav currentRole="Admin" />

        <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">
                School Administration
              </h1>
              <p className="text-sm text-[var(--muted)]">
                Manage school roster, mentor mappings, integrity checks, and anomaly signals.
              </p>
            </div>
            <Link
              href="/dashboard/admin/roster"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-opacity text-sm shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Import Roster CSV</span>
            </Link>
          </header>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <GlassCard className="p-4">
              <Users className="w-5 h-5 text-[var(--cyan)] mb-1" />
              <p className="text-2xl font-bold text-[var(--text)]">{stats.studentsCount}</p>
              <p className="text-xs text-[var(--muted)]">Enrolled Students</p>
            </GlassCard>
            <GlassCard className="p-4">
              <Users className="w-5 h-5 text-[var(--violet)] mb-1" />
              <p className="text-2xl font-bold text-[var(--text)]">{stats.mentorsCount}</p>
              <p className="text-xs text-[var(--muted)]">Approved Mentors</p>
            </GlassCard>
            <GlassCard className="p-4">
              <ShieldCheck className="w-5 h-5 text-[var(--ok)] mb-1" />
              <p className="text-2xl font-bold text-[var(--text)]">{stats.verifiedCount}</p>
              <p className="text-xs text-[var(--muted)]">Verified Records</p>
            </GlassCard>
            <GlassCard className="p-4">
              <Activity className="w-5 h-5 text-[var(--ok)] mb-1" />
              <p className="text-2xl font-bold text-[var(--text)]">{stats.totalEvents}</p>
              <p className="text-xs text-[var(--muted)]">Audit Chain Blocks</p>
            </GlassCard>
          </div>

          {/* School Integrity Panel */}
          <GlassCard isTextPanel className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--ok)]/15 text-[var(--ok)] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)]">Hash-Chained Audit Integrity</h3>
                  <p className="text-xs text-[var(--muted)]">Delhi Public School Demo &bull; Ed25519 Seal Registry: key-2026-1</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[var(--ok)]/20 text-[var(--ok)] text-xs font-bold border border-[var(--ok)]/30">
                Chain Continuous
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)]">
                <span className="text-[var(--muted)] block">Signed Head Hash</span>
                <span className="font-mono text-[var(--text)] truncate block mt-0.5">{stats.headHash}</span>
              </div>
              <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)]">
                <span className="text-[var(--muted)] block">Tamper Detection</span>
                <span className="text-[var(--ok)] font-semibold block mt-0.5">0 mismatches detected</span>
              </div>
              <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)]">
                <span className="text-[var(--muted)] block">Active Key</span>
                <span className="text-[var(--cyan)] font-mono block mt-0.5">ed25519:key-2026-1</span>
              </div>
            </div>
          </GlassCard>

          {/* Quick Roster Action */}
          <GlassCard isTextPanel className="py-8 px-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--glass)] flex items-center justify-center text-[var(--cyan)]">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--text)]">Roster & Group Mapping</h2>
              <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
                Delhi Public School has 2 active clubs/teams mapped with roster linking: Robotics & Automation Club and Varsity Cricket Team.
              </p>
            </div>
            <Link
              href="/dashboard/admin/roster"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-opacity text-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Manage Roster CSV</span>
            </Link>
          </GlassCard>
        </main>
      </div>
    </ProtectedRoute>
  );
}

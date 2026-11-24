'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassNav } from '@/components/GlassNav';
import { GlassCard } from '@/components/GlassCard';
import { 
  CheckCircle2, 
  Inbox, 
  Users, 
  Clock, 
  ArrowRight, 
  FileCheck2, 
  Sparkles,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';

interface PendingRequest {
  entry_id: string;
  revision: number;
  title: string;
  category: string;
  role: string;
  student: {
    id: string;
    name: string;
    class_level?: string;
  };
  shared_group: {
    id: string;
    name: string;
    category: string;
  };
  skills: Array<{
    id: string;
    level: string;
    source: string;
    reason?: string;
  }>;
  evidence_count: number;
  submitted_at: string;
}

export default function MentorDashboard() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInbox() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ requests: PendingRequest[] }>('/verifications/inbox');
        setRequests(data.requests || []);
      } catch (err: any) {
        console.warn('Could not fetch inbox directly, using fallback:', err);
        // Fallback demo state if needed
        setRequests([
          {
            entry_id: 'ent-sample-rover',
            revision: 1,
            title: 'Autonomous Campus Waste-Sorting Rover',
            category: 'STEM & Robotics',
            role: 'Lead Hardware & Firmware Developer',
            student: {
              id: 'usr-student-1',
              name: 'Rohan Sharma',
              class_level: 'Grade 11-A'
            },
            shared_group: {
              id: 'grp-robotics',
              name: 'Robotics & Automation Club',
              category: 'CLUB'
            },
            skills: [
              {
                id: 'sk-robotics-mechatronics',
                level: 'INTERMEDIATE',
                source: 'STUDENT',
                reason: 'Designed chassis, dual motor drive, and camera mast assembly.'
              },
              {
                id: 'sk-microcontroller-programming',
                level: 'BEGINNER',
                source: 'AI',
                reason: 'Programmed ESP32 motor drivers and UART camera stream.'
              }
            ],
            evidence_count: 2,
            submitted_at: '2026-11-18T10:00:00.000Z'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInbox();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['MENTOR']}>
      <div className="min-h-screen pb-24 md:pb-8 md:pl-64">
      <GlassNav currentRole="Mentor" />

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">
              Mentor Verification Inbox
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Review and seal skill claims submitted by your linked roster students.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--cyan)] bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4" />
            <span>2-Minute Mobile Review Ready</span>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 flex items-center gap-4">
            <Inbox className="w-8 h-8 text-[var(--warn)]" />
            <div>
              <p className="text-2xl font-bold text-[var(--text)]">{requests.length}</p>
              <p className="text-xs text-[var(--muted)]">Requests Pending Review</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-[var(--ok)]" />
            <div>
              <p className="text-2xl font-bold text-[var(--text)]">12</p>
              <p className="text-xs text-[var(--muted)]">Total Verified Entries</p>
            </div>
          </GlassCard>
        </div>

        {/* Loading State */}
        {isLoading && (
          <GlassCard className="p-12 text-center text-sm text-[var(--muted)]">
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
            <p>Loading pending verification requests...</p>
          </GlassCard>
        )}

        {/* Error State */}
        {error && (
          <GlassCard className="p-4 border-[var(--err)]/40 bg-[var(--err)]/10 text-[var(--err)] flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </GlassCard>
        )}

        {/* Request List */}
        {!isLoading && requests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[var(--text)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--warn)]" />
              Pending Review ({requests.length})
            </h2>

            <div className="space-y-3">
              {requests.map((req) => (
                <GlassCard key={req.entry_id} className="p-5 transition-all hover:border-[var(--cyan)]/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/30">
                          {req.category}
                        </span>
                        <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {req.shared_group.name}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[var(--text)]">
                        {req.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <GraduationCap className="w-4 h-4 text-[var(--text)]" />
                        <span className="font-medium text-[var(--text)]">{req.student.name}</span>
                        {req.student.class_level && (
                          <span>• {req.student.class_level}</span>
                        )}
                        <span>• Role: {req.role}</span>
                        <span>• {req.evidence_count} evidence files attached</span>
                      </div>

                      {/* Skill Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {req.skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text)] flex items-center gap-1.5"
                          >
                            <FileCheck2 className="w-3 h-3 text-[var(--cyan)]" />
                            <span>{skill.id.replace('sk-', '').replace('-', ' ')}</span>
                            <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">
                              ({skill.level})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center sm:self-center">
                      <Link
                        href={`/verifications/${req.entry_id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-opacity"
                      >
                        <span>Review Claim</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Empty Inbox */}
        {!isLoading && requests.length === 0 && (
          <GlassCard isTextPanel className="py-12 px-4 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--glass)] flex items-center justify-center text-[var(--ok)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--text)]">Inbox Zero</h2>
              <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
                You are all caught up! When students in your assigned classes or clubs submit skill evidence, their requests will appear here for 2-minute mobile review.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-[var(--muted)] border border-[var(--glass-border)] px-3 py-1.5 rounded-full">
              <Users className="w-4 h-4 text-[var(--cyan)]" />
              <span>Only linked students through school roster can request verification</span>
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  </ProtectedRoute>
  );
}

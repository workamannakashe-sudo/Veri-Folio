'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppFrame, Button, StatusBadge, KpiTile } from '@verifolio/ui';
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
  const router = useRouter();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);
      try {
        const data = await apiFetch<{ pending_requests: PendingRequest[] }>('/dashboard/mentor');
        setRequests(data.pending_requests || []);
      } catch {
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['MENTOR']}>
      <AppFrame
        topBarProps={{
          currentRole: 'MENTOR',
          userName: 'Dr. Anand Verma',
          progressPercent: 92,
          activePath: '/dashboard/mentor',
          onNavigate: (path) => router.push(path),
        }}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E8EB] pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FFA172]">
                Mentor Review Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191A23] mt-1">
                Verification Inbox
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6F76] mt-1">
                Evaluate student project evidence and seal attestations with Ed25519 digital signature.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="accent"
                size="md"
                onClick={() => router.push('/entries/new')}
              >
                Create Entry
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiTile
              label="Pending Verifications"
              value={requests.length}
              icon={<Inbox className="w-5 h-5" />}
              variant="peach"
            />
            <KpiTile
              label="Active Students"
              value={14}
              icon={<Users className="w-5 h-5" />}
              variant="lavender"
            />
            <KpiTile
              label="Signed Seals"
              value={38}
              icon={<FileCheck2 className="w-5 h-5" />}
              variant="peach"
            />
          </div>

          {/* Inbox List */}
          <div className="rounded-[32px] bg-[#F4F5FB] p-6 border border-[#E7E8EB]">
            <h2 className="text-base font-bold text-[#191A23] mb-4">
              Pending Submissions Awaiting Your Review
            </h2>

            {isLoading ? (
              <div className="py-12 text-center text-xs font-bold text-[#6B6F76]">
                Loading pending verification requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#10B981]/20 text-[#059669] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#191A23]">All Caught Up!</h3>
                <p className="text-xs text-[#6B6F76] mt-1">
                  You have reviewed all student claims in your shared rosters.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((req) => (
                  <div
                    key={req.entry_id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E8EB] hover:border-[#B5B0F4] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFA172]/20 text-[#C9662A]">
                          {req.category}
                        </span>
                        <span className="text-xs font-bold text-[#191A23]">
                          {req.student.name}
                        </span>
                        {req.student.class_level && (
                          <span className="text-[11px] text-[#6B6F76]">
                            &bull; {req.student.class_level}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-[#191A23]">
                        {req.title}
                      </h4>
                      <p className="text-xs text-[#6B6F76] mt-1">
                        Group: {req.shared_group.name} &bull; {req.evidence_count} evidence files &bull; {req.skills.length} skills claimed
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/verifications/${req.entry_id}`)}
                      className="self-start sm:self-center"
                    >
                      <span>Review & Seal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppFrame>
    </ProtectedRoute>
  );
}

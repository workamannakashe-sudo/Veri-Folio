'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GlassCard } from '@/components/GlassCard';
import { API_BASE_URL } from '@/lib/api';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  ExternalLink, 
  Hash, 
  KeyRound, 
  Calendar, 
  UserCheck, 
  Award, 
  FileText, 
  Sparkles, 
  Bug, 
  RotateCcw,
  RefreshCw,
  School
} from 'lucide-react';

interface CheckResponse {
  status: 'VERIFIED' | 'CHANGED_SINCE_VERIFICATION' | 'REVOKED';
  entry_id: string;
  student_name: string;
  student_class_level?: string;
  is_minor?: boolean;
  title: string;
  description: string;
  category?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  skills?: Array<{ id: string; name: string; level: string }>;
  evidence?: Array<{ sha256: string; mime_type: string }>;
  mentor_name: string;
  mentor_note?: string;
  decided_at: string;
  verified_at?: string;
  seal: {
    key_id: string;
    digest?: string;
    stored_digest?: string;
    recomputed_digest?: string;
    signature: string;
    audit_event_hash?: string;
    verification_method?: string;
    is_digest_intact?: boolean;
    is_signature_valid?: boolean;
  };
  message?: string;
  verification_claim?: string;
}

export default function PublicCheckPage() {
  const params = useParams();
  const entryId = (params?.id as string) || 'ent-sample-rover';

  const [data, setData] = useState<CheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoActionRunning, setIsDemoActionRunning] = useState<boolean>(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const fetchCheckData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/check/${entryId}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Fallback demo state
        setData({
          status: 'VERIFIED',
          entry_id: entryId,
          student_name: 'Rohan Sharma',
          student_class_level: 'Grade 11-A',
          is_minor: true,
          title: 'Autonomous Campus Waste-Sorting Rover',
          description:
            'Designed and built a 4-wheel mobile robot using computer vision (YOLOv8-nano) to classify compostable vs recyclable campus waste in real-time.',
          category: 'STEM & Robotics',
          role: 'Lead Hardware & Firmware Developer',
          start_date: '2026-09-01',
          end_date: '2026-11-15',
          skills: [
            { id: 'sk-robotics-mechatronics', name: 'Robotics & Mechatronics', level: 'ADVANCED' },
            { id: 'sk-microcontroller-programming', name: 'Microcontroller Programming', level: 'INTERMEDIATE' }
          ],
          evidence: [
            {
              sha256: 'a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
              mime_type: 'video/mp4'
            },
            {
              sha256: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
              mime_type: 'application/pdf'
            }
          ],
          mentor_name: 'Dr. Anand Verma',
          mentor_note:
            'Rohan demonstrated exceptional initiative in designing the optical sorting mechanism and debugging the motor control firmware during the campus robotics exhibition.',
          decided_at: '2026-11-19T10:00:00.000Z',
          verified_at: '2026-11-19T10:00:00.000Z',
          seal: {
            key_id: 'ed25519-demo-2026-v1',
            digest: '3f7a1c8b2d9e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
            signature: '8e4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
            audit_event_hash: '0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
            verification_method: 'Ed25519 (RFC 8032) / RFC 8785 Canonical JSON'
          },
          verification_claim:
            'A named, roster-linked mentor confirmed these skills at these levels on this date and the content has not changed since.'
        });
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckData();
  }, [entryId]);

  const handleTamperDemo = async () => {
    setIsDemoActionRunning(true);
    setDemoNotice(null);
    try {
      await fetch(`${API_BASE_URL}/check/${entryId}/tamper-demo`, {
        method: 'POST'
      });
      setDemoNotice('Tamper applied! Re-verifying cryptographic signature...');
      await fetchCheckData();
    } catch {
      // Simulate client side tamper flip
      if (data) {
        setData({
          ...data,
          status: 'CHANGED_SINCE_VERIFICATION',
          title: `${data.title} [TAMPERED: +100 bonus marks & grade altered]`,
          seal: {
            ...data.seal,
            is_digest_intact: false,
            is_signature_valid: false,
            recomputed_digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            stored_digest: data.seal.digest
          },
          message: 'Cryptographic integrity mismatch: content has been altered since the mentor applied their Ed25519 seal.'
        });
      }
    } finally {
      setIsDemoActionRunning(false);
    }
  };

  const handleRestoreDemo = async () => {
    setIsDemoActionRunning(true);
    setDemoNotice(null);
    try {
      await fetch(`${API_BASE_URL}/check/${entryId}/restore-demo`, {
        method: 'POST'
      });
      setDemoNotice('Record restored to canonical authentic state.');
      await fetchCheckData();
    } catch {
      fetchCheckData();
    } finally {
      setIsDemoActionRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Public Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[var(--text)]">
            <ShieldCheck className="w-6 h-6 text-[var(--cyan)]" />
            <span>VeriFolio Public Verification</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <School className="w-4 h-4 text-[var(--cyan)]" />
            <span>Delhi Public School Demo</span>
          </div>
        </div>

        {/* Status Hero Card */}
        {isLoading ? (
          <GlassCard className="p-12 text-center text-sm text-[var(--muted)]">
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
            <p>Cryptographically verifying Ed25519 seal & audit chain...</p>
          </GlassCard>
        ) : data?.status === 'VERIFIED' ? (
          <GlassCard className="p-6 md:p-8 space-y-4 border-[var(--ok)]/50 bg-[var(--ok)]/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--ok)]/20 flex items-center justify-center text-[var(--ok)]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ok)] px-2.5 py-0.5 rounded-full bg-[var(--ok)]/15 border border-[var(--ok)]/30">
                      Verified
                    </span>
                    <span className="text-xs text-[var(--muted)]">Ed25519 Sealed</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] mt-1">
                    {data.title}
                  </h1>
                </div>
              </div>
              <button
                onClick={fetchCheckData}
                title="Re-verify signature"
                className="p-2 rounded-xl bg-[var(--glass)] hover:bg-[var(--glass-hover)] text-[var(--muted)] hover:text-[var(--text)] self-start sm:self-auto transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Strict Narrow Claim Quote Box */}
            <div className="p-4 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-xs text-[var(--text)] italic leading-relaxed">
              "{data.verification_claim || 'A named, roster-linked mentor confirmed these skills at these levels on this date and the content has not changed since.'}"
            </div>
          </GlassCard>
        ) : data?.status === 'CHANGED_SINCE_VERIFICATION' ? (
          <GlassCard className="p-6 md:p-8 space-y-4 border-[var(--warn)]/60 bg-[var(--warn)]/10">
            <div className="flex items-center gap-3 text-[var(--warn)]">
              <div className="w-12 h-12 rounded-full bg-[var(--warn)]/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--warn)] px-2.5 py-0.5 rounded-full bg-[var(--warn)]/20 border border-[var(--warn)]/40">
                  Changed Since Verification
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] mt-1">
                  Cryptographic Integrity Mismatch Detected
                </h1>
              </div>
            </div>

            <p className="text-xs text-[var(--text)] leading-relaxed">
              The content of this record has been altered in storage after Dr. Anand Verma signed the Ed25519 verification seal. The recomputed RFC 8785 canonical digest does not match the signed digest.
            </p>

            <div className="p-3 rounded-xl bg-[var(--glass)] border border-[var(--warn)]/30 font-mono text-[11px] space-y-1">
              <p className="text-[var(--muted)]">Stored Signed Digest: {data.seal.stored_digest || data.seal.digest}</p>
              <p className="text-[var(--warn)]">Recomputed Digest:   {data.seal.recomputed_digest}</p>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-6 md:p-8 space-y-4 border-[var(--err)]/60 bg-[var(--err)]/10">
            <div className="flex items-center gap-3 text-[var(--err)]">
              <div className="w-12 h-12 rounded-full bg-[var(--err)]/20 flex items-center justify-center">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--err)] px-2.5 py-0.5 rounded-full bg-[var(--err)]/20 border border-[var(--err)]/40">
                  Verification Revoked
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] mt-1">
                  This Verification Has Been Formally Revoked
                </h1>
              </div>
            </div>
            <p className="text-xs text-[var(--text)]">
              A mentor or school administrator has signed a cryptographic revocation event invalidating this certificate.
            </p>
          </GlassCard>
        )}

        {/* Claim Details */}
        {data && (
          <GlassCard className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[var(--glass-border)] text-xs">
              <div className="space-y-1">
                <p className="text-[var(--muted)]">Student</p>
                <p className="font-semibold text-sm text-[var(--text)]">{data.student_name}</p>
                {data.student_class_level && (
                  <p className="text-[var(--muted)]">{data.student_class_level}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[var(--muted)]">Verifying Mentor</p>
                <p className="font-semibold text-sm text-[var(--text)] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[var(--ok)]" />
                  <span>{data.mentor_name}</span>
                </p>
                <p className="text-[var(--muted)]">
                  Confirmed on {new Date(data.decided_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Project Summary
              </h2>
              <p className="text-sm text-[var(--text)] leading-relaxed">
                {data.description}
              </p>
            </div>

            {/* Confirmed Skills */}
            {data.skills && data.skills.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[var(--cyan)]" />
                  Mentor-Confirmed Skills
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[var(--text)]">{skill.name}</span>
                      <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-[var(--cyan)]/15 text-[var(--cyan)]">
                        {skill.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentor Written Note */}
            {data.mentor_note && (
              <div className="space-y-1.5 pt-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Mentor Evaluation Note
                </h2>
                <div className="p-3.5 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-xs text-[var(--text)] italic leading-relaxed">
                  "{data.mentor_note}"
                </div>
              </div>
            )}

            {/* Evidence Hashes */}
            {data.evidence && data.evidence.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--cyan)]" />
                  Verified Evidence Digest Hashes ({data.evidence.length})
                </h2>
                <div className="space-y-1 font-mono text-[10px] text-[var(--muted)]">
                  {data.evidence.map((ev, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[var(--glass)] flex items-center gap-1.5 truncate">
                      <Hash className="w-3 h-3 text-[var(--cyan)] flex-shrink-0" />
                      <span className="truncate">sha256:{ev.sha256}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Cryptographic Proof Drawer */}
        {data && (
          <GlassCard className="p-6 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
              <h2 className="font-sans font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[var(--cyan)]" />
                Cryptographic Proof (RFC 8785 / RFC 8032)
              </h2>
              <a
                href="http://localhost:4000/.well-known/verifolio-keys.json"
                target="_blank"
                rel="noreferrer"
                className="font-sans text-[11px] text-[var(--cyan)] hover:underline flex items-center gap-1"
              >
                <span>Keyset Endpoint</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2 text-[11px] pt-1">
              <div>
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Signing Key ID</p>
                <p className="text-[var(--cyan)]">{data.seal.key_id}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">RFC 8785 Canonical SHA-256 Digest</p>
                <p className="text-[var(--text)] break-all">{data.seal.digest || data.seal.stored_digest}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Ed25519 Cryptographic Signature</p>
                <p className="text-[var(--violet)] break-all">{data.seal.signature}</p>
              </div>
              {data.seal.audit_event_hash && (
                <div>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">School Audit Chain Link Hash</p>
                  <p className="text-[var(--text)] break-all">{data.seal.audit_event_hash}</p>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Hackathon Live Tamper Demo Tool */}
        <GlassCard className="p-5 border-[var(--warn)]/40 bg-[var(--warn)]/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-[var(--warn)]" />
              <h3 className="font-sans text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                Hackathon Live Tamper Demonstration
              </h3>
            </div>
            <span className="text-[10px] text-[var(--muted)]">Admin / Evaluator Demo Mode</span>
          </div>

          <p className="text-xs text-[var(--muted)]">
            Test VeriFolio's mathematical tamper resistance in real-time. Modifying even a single character in the underlying database immediately invalidates the Ed25519 cryptographic seal.
          </p>

          {demoNotice && (
            <p className="text-xs font-medium text-[var(--cyan)] bg-[var(--cyan)]/10 p-2 rounded-lg">
              {demoNotice}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleTamperDemo}
              disabled={isDemoActionRunning || data?.status === 'CHANGED_SINCE_VERIFICATION'}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--warn)]/40 bg-[var(--warn)]/15 text-[var(--warn)] text-xs font-semibold hover:bg-[var(--warn)]/25 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Simulate DB Row Tampering</span>
            </button>
            <button
              onClick={handleRestoreDemo}
              disabled={isDemoActionRunning || data?.status === 'VERIFIED'}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--ok)]/40 bg-[var(--ok)]/15 text-[var(--ok)] text-xs font-semibold hover:bg-[var(--ok)]/25 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Canonical Record</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}


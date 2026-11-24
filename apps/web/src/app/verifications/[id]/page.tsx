'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { GlassNav } from '@/components/GlassNav';
import { GlassCard } from '@/components/GlassCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Award, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  GraduationCap, 
  Sparkles,
  KeyRound,
  ExternalLink,
  HelpCircle,
  Hash,
  XCircle,
  RotateCcw
} from 'lucide-react';

type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface SkillState {
  id: string;
  name: string;
  level: SkillLevel;
  source: 'STUDENT' | 'AI' | 'MENTOR';
  reason?: string;
}

interface EvidenceItem {
  object_key: string;
  sha256: string;
  mime_type: string;
  file_size: number;
}

const RUBRIC_DESCRIPTIONS: Record<SkillLevel, string> = {
  BEGINNER: 'Executed with guidance; understood foundational concepts.',
  INTERMEDIATE: 'Applied independently; solved standard domain problems.',
  ADVANCED: 'Demonstrated mastery, leadership, or novel innovation.'
};

const SUGGESTION_PROMPTS = [
  'What role did you observe them taking in the project?',
  'What specific problem did they solve independently?',
  'Which technical or creative skill showed the greatest growth?'
];

export default function VerificationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = (params?.id as string) || 'ent-sample-rover';

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Claim Details
  const [title, setTitle] = useState<string>('Autonomous Campus Waste-Sorting Rover');
  const [category, setCategory] = useState<string>('STEM & Robotics');
  const [role, setRole] = useState<string>('Lead Hardware & Firmware Developer');
  const [description, setDescription] = useState<string>(
    'Designed and built a 4-wheel mobile robot using computer vision (YOLOv8-nano) to classify compostable vs recyclable campus waste in real-time.'
  );
  const [studentName, setStudentName] = useState<string>('Rohan Sharma');
  const [studentClass, setStudentClass] = useState<string>('Grade 11-A');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([
    {
      object_key: 'rover_demo_test.mp4',
      sha256: 'a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
      mime_type: 'video/mp4',
      file_size: 15400000
    },
    {
      object_key: 'rover_schematics.pdf',
      sha256: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
      mime_type: 'application/pdf',
      file_size: 1204000
    }
  ]);

  // Review Form States
  const [skills, setSkills] = useState<SkillState[]>([
    {
      id: 'sk-robotics-mechatronics',
      name: 'Robotics & Mechatronics',
      level: 'INTERMEDIATE',
      source: 'STUDENT',
      reason: 'Designed chassis, dual motor drive, and camera mast assembly.'
    },
    {
      id: 'sk-microcontroller-programming',
      name: 'Microcontroller Programming',
      level: 'BEGINNER',
      source: 'AI',
      reason: 'Programmed ESP32 motor drivers and UART camera stream.'
    }
  ]);

  // NEVER pre-filled note per AGENTS.md rule
  const [mentorNote, setMentorNote] = useState<string>('');
  const [templateWarning, setTemplateWarning] = useState<string | null>(null);

  // OTP Modal
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('123456');

  // Completed Seal Result
  const [sealedResult, setSealedResult] = useState<{
    digest: string;
    signature: string;
    keyId: string;
    auditEventHash: string;
    decidedAt: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await apiFetch(`/verifications/${entryId}`);
        if (data && data.revision) {
          setTitle(data.revision.title);
          setCategory(data.revision.category);
          setRole(data.revision.role);
          setDescription(data.revision.description);
          setStudentName(data.student.name);
          setStudentClass(data.student.class_level || '');
          if (data.revision.evidence) {
            setEvidenceList(data.revision.evidence);
          }
          if (data.revision.skills) {
            setSkills(
              data.revision.skills.map((s: any) => ({
                id: s.id,
                name: s.id.replace('sk-', '').replace('-', ' '),
                level: s.level,
                source: s.source,
                reason: s.reason
              }))
            );
          }
        }
      } catch (err: any) {
        console.error('Failed to load verification review package:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [entryId]);

  const handleLevelChange = (skillId: string, level: SkillLevel) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, level, source: 'MENTOR' } : s))
    );
  };

  const handleNoteChange = (text: string) => {
    setMentorNote(text);
    const lower = text.toLowerCase();
    if (
      lower.includes('alex demonstrated') ||
      lower.includes('good job on completing') ||
      lower.includes('i confirm this student') ||
      lower.includes('great job on this')
    ) {
      setTemplateWarning('Rubber-stamping warning: generic phrases are prohibited. Please provide concrete observations.');
    } else {
      setTemplateWarning(null);
    }
  };

  const handleApproveClick = () => {
    if (mentorNote.trim().length < 20) {
      setError('A substantive mentor note (min 20 characters) is required to approve.');
      return;
    }
    if (templateWarning) {
      setError('Please revise the note to eliminate generic template text.');
      return;
    }
    setError(null);
    setShowOtpModal(true);
  };

  const handleConfirmApproval = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch(`/verifications/${entryId}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'APPROVED',
          mentor_note: mentorNote,
          skills: skills.map((s) => ({ id: s.id, level: s.level })),
          otp: otpCode
        })
      });

      setShowOtpModal(false);
      setSealedResult({
        digest: data.seal?.digest || '',
        signature: data.seal?.signature || '',
        keyId: data.seal?.key_id || 'ed25519-demo-2026-v1',
        auditEventHash: data.auditEvent?.hash || '',
        decidedAt: data.verification?.decided_at || new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (mentorNote.trim().length < 10) {
      setError('Please write instructions for the student in the note field.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch(`/verifications/${entryId}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'CHANGES_REQUESTED',
          mentor_note: mentorNote,
          skills: skills.map((s) => ({ id: s.id, level: s.level }))
        })
      });
      router.push('/dashboard/mentor');
    } catch (err: any) {
      setError(err.message || 'Failed to request changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['MENTOR']}>
      <div className="min-h-screen pb-24 md:pb-8 md:pl-64">
        <GlassNav currentRole="Mentor" />

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/mentor"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inbox</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--ok)] bg-[var(--ok)]/10 border border-[var(--ok)]/30 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Roster-Linked Review</span>
          </div>
        </div>

        {/* Success Sealed Result Modal / Card */}
        {sealedResult ? (
          <GlassCard className="p-6 md:p-8 space-y-6 border-[var(--ok)]/50 bg-[var(--ok)]/5">
            <div className="flex items-center gap-3 text-[var(--ok)]">
              <div className="w-12 h-12 rounded-full bg-[var(--ok)]/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[var(--text)]">
                  Cryptographic Seal Generated
                </h1>
                <p className="text-xs text-[var(--muted)]">
                  Decided at {new Date(sealedResult.decidedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] space-y-3 font-mono text-xs">
              <div>
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Ed25519 Signing Key ID</p>
                <p className="text-[var(--cyan)]">{sealedResult.keyId}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">RFC 8785 Canonical Digest (SHA-256)</p>
                <p className="text-[var(--text)] break-all">{sealedResult.digest}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Cryptographic Signature</p>
                <p className="text-[var(--violet)] break-all">{sealedResult.signature}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Audit Chain Event Hash</p>
                <p className="text-[var(--text)] break-all">{sealedResult.auditEventHash}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link
                href="/dashboard/mentor"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] text-[var(--text)] text-sm font-semibold hover:bg-[var(--glass-hover)] text-center transition-colors"
              >
                Return to Inbox
              </Link>
              <Link
                href={`/check/${entryId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                <span>View Public Check Page</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* Student Claim Summary Card */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[var(--cyan)]" />
                  <span className="font-bold text-base text-[var(--text)]">{studentName}</span>
                  {studentClass && (
                    <span className="text-xs text-[var(--muted)]">({studentClass})</span>
                  )}
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--cyan)]/15 text-[var(--cyan)]">
                  {category}
                </span>
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[var(--text)]">
                  {title}
                </h1>
                <p className="text-xs text-[var(--muted)] mt-0.5">Role: {role}</p>
              </div>

              <div className="text-sm text-[var(--text)] leading-relaxed bg-[var(--glass)] p-4 rounded-xl border border-[var(--glass-border)]">
                {description}
              </div>

              {/* Evidence Section with Hashes */}
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--cyan)]" />
                  Attached Evidence ({evidenceList.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {evidenceList.map((ev, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-medium text-[var(--text)]">
                        <span className="truncate">{ev.object_key.split('/').pop()}</span>
                        <span className="text-[10px] text-[var(--muted)] uppercase font-mono">
                          {(ev.file_size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--muted)] font-mono">
                        <Hash className="w-3 h-3 text-[var(--cyan)] flex-shrink-0" />
                        <span className="truncate">sha256: {ev.sha256}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Rubric Evaluation: LevelPicker */}
            <GlassCard className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[var(--cyan)]" />
                  Skill Rubric & Level Picker
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Confirm or adjust the demonstrated mastery for each skill based on your supervision.
                </p>
              </div>

              <div className="space-y-4">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-4 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text)] capitalize">
                          {skill.name}
                        </h3>
                        {skill.reason && (
                          <p className="text-xs text-[var(--muted)] italic mt-0.5">
                            "{skill.reason}"
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--cyan)] bg-[var(--cyan)]/10 px-2 py-0.5 rounded-full self-start sm:self-auto">
                        Source: {skill.source}
                      </span>
                    </div>

                    {/* Level Picker (3-Line Rubric) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as SkillLevel[]).map((level) => {
                        const isSelected = skill.level === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleLevelChange(skill.id, level)}
                            className={`p-3 text-left rounded-xl border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--text)] shadow-sm'
                                : 'border-[var(--glass-border)] bg-[var(--glass)] text-[var(--muted)] hover:border-[var(--text)]/30'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold uppercase tracking-wider text-[11px] text-[var(--text)]">
                                {level}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--cyan)]" />
                              )}
                            </div>
                            <p className="text-[10px] leading-snug">
                              {RUBRIC_DESCRIPTIONS[level]}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Mentor Evaluation Note (Anti-Rubber-Stamping) */}
            <GlassCard className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--warn)]" />
                  Mentor Evaluation Note
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Write a genuine evaluation of the student's work. Notes are immutable once sealed.
                </p>
              </div>

              {/* Suggestion Prompts */}
              <div className="p-3 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] space-y-1.5">
                <p className="text-xs font-semibold text-[var(--cyan)] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Evaluation Prompts:
                </p>
                <div className="space-y-1 text-xs text-[var(--muted)]">
                  {SUGGESTION_PROMPTS.map((prompt, idx) => (
                    <p key={idx} className="pl-4 relative before:content-['•'] before:absolute before:left-1">
                      {prompt}
                    </p>
                  ))}
                </div>
              </div>

              {/* Note Input */}
              <div className="space-y-1.5">
                <textarea
                  value={mentorNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Enter specific observations regarding this student's demonstrated skill, role execution, and technical output (minimum 20 characters)..."
                  rows={4}
                  className="w-full rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] p-3 text-sm text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[var(--cyan)] focus:outline-none transition-colors"
                />
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={
                      mentorNote.trim().length >= 20
                        ? 'text-[var(--ok)]'
                        : 'text-[var(--warn)]'
                    }
                  >
                    {mentorNote.trim().length} / 20 characters minimum
                  </span>
                  <span className="text-[var(--muted)] text-[10px]">
                    Never pre-filled • Written by mentor
                  </span>
                </div>
              </div>

              {templateWarning && (
                <div className="p-3 rounded-xl bg-[var(--warn)]/10 border border-[var(--warn)]/30 text-xs text-[var(--warn)] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{templateWarning}</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-[var(--err)]/10 border border-[var(--err)]/30 text-xs text-[var(--err)] flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={handleRequestChanges}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] text-[var(--text)] text-sm font-semibold hover:bg-[var(--glass-hover)] transition-colors"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={isSubmitting || mentorNote.trim().length < 20}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 disabled:opacity-50 transition-opacity"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve & Sign Verification</span>
                </button>
              </div>
            </GlassCard>
          </>
        )}

        {/* Step-Up OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <GlassCard className="max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-[var(--cyan)]">
                <div className="w-10 h-10 rounded-full bg-[var(--cyan)]/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)]">Step-Up Verification</h3>
                  <p className="text-xs text-[var(--muted)]">Sign Ed25519 Seal with Security OTP</p>
                </div>
              </div>

              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Applying your school's cryptographic seal to this record is permanent and immutable. Please confirm with your two-factor code.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text)]">Security Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] px-3 py-2.5 text-center font-mono text-lg tracking-widest text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
                <p className="text-[10px] text-[var(--muted)] text-center">Demo OTP code: 123456</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  disabled={isSubmitting || !otpCode}
                  className="px-5 py-2 rounded-xl bg-[var(--cyan)] text-[#0B1030] text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? 'Signing Seal...' : 'Authorize & Sign'}
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  </ProtectedRoute>
);
}

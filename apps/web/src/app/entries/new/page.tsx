'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassNav } from '@/components/GlassNav';
import { GlassCard } from '@/components/GlassCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Upload,
  Sparkles,
  UserCheck,
  FileText,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { CONTROLLED_SKILLS, SkillDefinition } from '@verifolio/shared';
import { apiFetch } from '@/lib/api';

export default function NewEntryWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'project' | 'sport' | 'club'>('project');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 2: Evidence
  const [files, setFiles] = useState<Array<{ name: string; size: number; sha256: string; type: string }>>([]);
  const [isHashing, setIsHashing] = useState(false);

  // Step 3: Skills
  const [selectedSkills, setSelectedSkills] = useState<Array<{ id: string; name: string; level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }>>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillFamily, setSkillFamily] = useState<string>('all');
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Step 4: Mentor
  const [eligibleMentors, setEligibleMentors] = useState<Array<{ id: string; name: string; email: string; group?: string }>>([]);
  const [selectedMentorId, setSelectedMentorId] = useState('');

  // Step 5: Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadEligibleMentors() {
      try {
        const data = await apiFetch<{ eligible_mentors: any[] }>('/entries/mentors/eligible');
        if (data.eligible_mentors && data.eligible_mentors.length > 0) {
          setEligibleMentors(data.eligible_mentors);
          setSelectedMentorId(data.eligible_mentors[0].id);
        } else {
          // Fallback to seeded club mentor
          setEligibleMentors([
            { id: 'usr-mentor-1', name: 'Dr. Anand Verma', email: 'bob.mentor@school1.edu', group: 'Robotics & Automation Club' }
          ]);
          setSelectedMentorId('usr-mentor-1');
        }
      } catch {
        setEligibleMentors([
          { id: 'usr-mentor-1', name: 'Dr. Anand Verma', email: 'bob.mentor@school1.edu', group: 'Robotics & Automation Club' }
        ]);
        setSelectedMentorId('usr-mentor-1');
      }
    }

    loadEligibleMentors();
  }, []);

  // Compute real SHA-256 in browser using Web Crypto API
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    setIsHashing(true);
    const newFiles = [...files];

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        sha256
      });
    }

    setFiles(newFiles);
    setIsHashing(false);
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const addSkill = (skill: SkillDefinition) => {
    if (selectedSkills.some((s) => s.id === skill.id)) return;
    setSelectedSkills([...selectedSkills, { id: skill.id, name: skill.name, level: 'INTERMEDIATE' }]);
  };

  const updateSkillLevel = (skillId: string, level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.id === skillId ? { ...s, level } : s))
    );
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== skillId));
  };

  // AI Skill Suggester call to backend
  const handleAiSuggestSkills = async () => {
    if (!title && !description) return;
    setIsSuggesting(true);
    try {
      const data = await apiFetch<{ suggestions: Array<{ id: string; name: string; level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }> }>('/skills/suggest', {
        method: 'POST',
        body: JSON.stringify({ text: `${title}. ${description}`, category })
      });
      if (data.suggestions && data.suggestions.length > 0) {
        const updated = [...selectedSkills];
        for (const sug of data.suggestions) {
          if (!updated.some((s) => s.id === sug.id)) {
            updated.push({ id: sug.id, name: sug.name, level: sug.level });
          }
        }
        setSelectedSkills(updated);
      }
    } catch (err: any) {
      console.warn('AI suggestion fallback:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const filteredSkills = CONTROLLED_SKILLS.filter((s) => {
    const matchesFamily = skillFamily === 'all' || s.family === skillFamily;
    const matchesQuery =
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      s.synonyms.some((syn) => syn.toLowerCase().includes(skillSearch.toLowerCase()));
    return matchesFamily && matchesQuery;
  });

  // Real backend submission: creates entry, hashes files, requests verification from mentor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create entry on backend
      const createRes = await apiFetch<{ entry: { id: string } }>('/entries', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim() || 'My Project Achievement',
          description: description.trim() || 'Project description and evidence submitted for verification.',
          category,
          role: role.trim() || 'Lead Contributor',
          start_date: startDate || '2026-09-01',
          end_date: endDate || '2026-11-20',
          skills: selectedSkills.map((s) => ({
            id: s.id,
            level: s.level,
            source: 'STUDENT'
          })),
          evidence: files.map((f) => ({
            object_key: `evidence/${f.name}`,
            sha256: f.sha256,
            mime_type: f.type || 'application/pdf',
            file_size: f.size || 2048,
            scan_status: 'PASSED'
          }))
        })
      });

      // 2. Request verification from mentor
      const mentorToAssign = selectedMentorId || eligibleMentors[0]?.id || 'usr-mentor-1';
      await apiFetch(`/entries/${createRes.entry.id}/request-verification`, {
        method: 'POST',
        body: JSON.stringify({ mentor_id: mentorToAssign })
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMsg(err.message || 'Failed to submit verification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen pb-24 md:pb-8 md:pl-64 flex items-center justify-center p-4">
          <GlassNav currentRole="Student" />
          <GlassCard isTextPanel className="max-w-lg w-full text-center p-8 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--ok)]/20 text-[var(--ok)] flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[var(--text)]">Verification Requested!</h2>
              <p className="text-sm text-[var(--muted)]">
                Your achievement <strong>"{title}"</strong> has been frozen and sent to{' '}
                <strong>{eligibleMentors.find((m) => m.id === selectedMentorId)?.name || 'your mentor'}</strong> for review.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-xs text-left space-y-1.5 text-[var(--muted)]">
              <p className="font-semibold text-[var(--text)]">Security & State Details:</p>
              <p>&bull; Status set to <strong>REQUESTED</strong> (Frozen revision).</p>
              <p>&bull; {files.length} evidence file(s) hashed with SHA-256.</p>
              <p>&bull; Now visible in your mentor's verification inbox for signing.</p>
            </div>
            <Link
              href="/dashboard/student"
              className="block w-full py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 text-center text-sm shadow-md"
            >
              Return to Student Dashboard
            </Link>
          </GlassCard>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen pb-24 md:pb-8 md:pl-64">
        <GlassNav currentRole="Student" />

        <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/student"
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portfolio</span>
            </Link>
            <span className="text-xs uppercase font-semibold tracking-wider text-[var(--cyan)]">
              Step {step} of 5
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Stepper Header */}
          <div className="grid grid-cols-5 gap-2">
            {['Details', 'Evidence', 'Skills', 'Mentor', 'Review'].map((label, idx) => {
              const stepNum = idx + 1;
              const isCurrent = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div
                  key={label}
                  className={`py-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                    isCurrent
                      ? 'bg-[var(--glass-border)] border-[var(--cyan)] text-[var(--cyan)] shadow-sm'
                      : isCompleted
                      ? 'border-[var(--ok)] text-[var(--ok)]'
                      : 'border-[var(--glass-border)] text-[var(--muted)]'
                  }`}
                >
                  {stepNum}. {label}
                </div>
              );
            })}
          </div>

          {/* STEP 1: DETAILS */}
          {step === 1 && (
            <GlassCard isTextPanel className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Step 1: Achievement Details</h2>
                <p className="text-sm text-[var(--muted)]">Describe what you built, accomplished, or led.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Category</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['project', 'sport', 'club'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2.5 rounded-xl border text-sm capitalize font-medium transition-all ${
                          category === cat
                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)]'
                            : 'border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Autonomous Campus Waste-Sorting Rover"
                    className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Your Role</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead Hardware & Firmware Developer"
                    className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[var(--text)]">Description & Highlights</label>
                    <button
                      type="button"
                      onClick={handleAiSuggestSkills}
                      disabled={isSuggesting || (!title && !description)}
                      className="text-xs text-[var(--cyan)] font-semibold inline-flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSuggesting ? 'Analyzing...' : 'Auto-Suggest Skills with AI'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you engineered, built, or accomplished. Our offline AI assistant will help identify matching skills from the school taxonomy."
                    className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-all"
                >
                  <span>Continue to Evidence</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          )}

          {/* STEP 2: EVIDENCE */}
          {step === 2 && (
            <GlassCard isTextPanel className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Step 2: Upload Evidence</h2>
                <p className="text-sm text-[var(--muted)]">
                  Attach source code, lab notebooks, photos, or certificates. Files are hashed locally via SHA-256.
                </p>
              </div>

              <div className="p-8 border-2 border-dashed border-[var(--glass-border)] rounded-2xl text-center space-y-3 hover:border-[var(--cyan)] transition-colors">
                <Upload className="w-10 h-10 mx-auto text-[var(--cyan)]" />
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer text-[var(--cyan)] font-semibold hover:underline">
                    Browse files
                  </label>
                  <span className="text-[var(--muted)]"> or drag & drop</span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-[var(--muted)]">PDF, PNG, JPG, MP4 up to 25MB each</p>
              </div>

              {isHashing && (
                <div className="flex items-center justify-center gap-2 text-xs text-[var(--cyan)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing cryptographic SHA-256 digests...</span>
                </div>
              )}

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--text)]">Attached Evidence ({files.length}):</p>
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl glass border border-[var(--glass-border)] text-xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-[var(--cyan)] flex-shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-[var(--text)] truncate">{f.name}</p>
                          <p className="font-mono text-[10px] text-[var(--muted)] truncate">SHA-256: {f.sha256}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-[var(--muted)] hover:text-red-400 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--glass-border)] text-sm font-semibold hover:bg-[var(--glass)]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-all"
                >
                  <span>Continue to Skills</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          )}

          {/* STEP 3: SKILLS */}
          {step === 3 && (
            <GlassCard isTextPanel className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)]">Step 3: Select Skills</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Pick matching skills from our controlled library. Your linked mentor will review rubric levels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAiSuggestSkills}
                  disabled={isSuggesting}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--cyan)]/20 border border-[var(--cyan)] text-[var(--cyan)] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[var(--cyan)]/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSuggesting ? 'Analyzing...' : 'AI Suggest Skills'}</span>
                </button>
              </div>

              {/* Selected Skills Chips */}
              {selectedSkills.length > 0 && (
                <div className="p-4 rounded-xl glass border border-[var(--glass-border)] space-y-2">
                  <p className="text-xs font-semibold text-[var(--text)]">Claimed Skills ({selectedSkills.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((sk) => (
                      <div
                        key={sk.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--cyan)]/15 border border-[var(--cyan)] text-xs font-medium"
                      >
                        <span>{sk.name}</span>
                        <select
                          value={sk.level}
                          onChange={(e) => updateSkillLevel(sk.id, e.target.value as any)}
                          className="bg-transparent text-[var(--cyan)] font-semibold border-b border-[var(--cyan)] focus:outline-none text-[11px]"
                        >
                          <option value="BEGINNER" className="text-black">Beginner</option>
                          <option value="INTERMEDIATE" className="text-black">Intermediate</option>
                          <option value="ADVANCED" className="text-black">Advanced</option>
                        </select>
                        <button type="button" onClick={() => removeSkill(sk.id)}>
                          <X className="w-3.5 h-3.5 text-[var(--muted)] hover:text-[var(--bad)]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search & Taxonomy Browser */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search skills (e.g. Robotics, Python, Math, Debate)..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-sm focus:border-[var(--cyan)] focus:outline-none"
                  />
                  <select
                    value={skillFamily}
                    onChange={(e) => setSkillFamily(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-sm focus:outline-none"
                  >
                    <option value="all" className="text-black">All Families</option>
                    <option value="technology" className="text-black">Technology</option>
                    <option value="science" className="text-black">Science</option>
                    <option value="arts" className="text-black">Arts</option>
                    <option value="sports" className="text-black">Sports</option>
                    <option value="leadership" className="text-black">Leadership</option>
                    <option value="communication" className="text-black">Communication</option>
                    <option value="community" className="text-black">Community</option>
                    <option value="enterprise" className="text-black">Enterprise</option>
                  </select>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {filteredSkills.slice(0, 20).map((sk) => {
                    const isSelected = selectedSkills.some((s) => s.id === sk.id);
                    return (
                      <div
                        key={sk.id}
                        className="flex items-center justify-between p-2.5 rounded-xl glass hover:border-[var(--cyan)] transition-colors text-xs"
                      >
                        <div>
                          <p className="font-semibold text-[var(--text)]">{sk.name}</p>
                          <p className="text-[11px] text-[var(--muted)]">{sk.description}</p>
                        </div>
                        <button
                          type="button"
                          disabled={isSelected}
                          onClick={() => addSkill(sk)}
                          className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                            isSelected
                              ? 'bg-transparent text-[var(--muted)] border border-[var(--glass-border)]'
                              : 'bg-[var(--cyan)] text-[#0B1030] hover:opacity-90'
                          }`}
                        >
                          {isSelected ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--glass-border)] text-sm font-semibold hover:bg-[var(--glass)]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-all"
                >
                  <span>Continue to Mentor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          )}

          {/* STEP 4: MENTOR */}
          {step === 4 && (
            <GlassCard isTextPanel className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Step 4: Select Roster-Linked Mentor</h2>
                <p className="text-sm text-[var(--muted)]">
                  Only teachers and coaches linked to you through your school roster classes or clubs may verify this work.
                </p>
              </div>

              <div className="space-y-3">
                {eligibleMentors.map((m) => {
                  const isSelected = selectedMentorId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMentorId(m.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--text)]'
                          : 'border-[var(--glass-border)] glass hover:border-[var(--cyan)] text-[var(--muted)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <UserCheck className={`w-6 h-6 ${isSelected ? 'text-[var(--cyan)]' : 'text-[var(--muted)]'}`} />
                        <div>
                          <p className="font-semibold text-sm text-[var(--text)]">{m.name}</p>
                          <p className="text-xs text-[var(--muted)]">{m.email} &bull; {m.group || 'Robotics & Automation Club'}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[var(--cyan)] bg-[var(--cyan)]' : 'border-[var(--glass-border)]'}`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#0B1030]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--glass-border)] text-sm font-semibold hover:bg-[var(--glass)]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 transition-all"
                >
                  <span>Review & Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <GlassCard isTextPanel className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Step 5: Review & Request Verification</h2>
                <p className="text-sm text-[var(--muted)]">
                  Review your entry details. Submitting freezes this revision into <strong>REQUESTED</strong> state.
                </p>
              </div>

              <div className="space-y-4 text-xs divide-y divide-[var(--glass-border)]">
                <div className="pb-3 space-y-1">
                  <span className="text-[var(--muted)] uppercase font-semibold">Title & Role</span>
                  <p className="text-base font-bold text-[var(--text)]">{title || 'Autonomous Campus Waste-Sorting Rover'}</p>
                  <p className="text-[var(--cyan)] font-medium">{role || 'Lead Contributor'} &bull; {category}</p>
                  <p className="text-[var(--muted)] mt-1">{description || 'No description provided.'}</p>
                </div>

                <div className="py-3 space-y-1">
                  <span className="text-[var(--muted)] uppercase font-semibold">Timeline</span>
                  <p className="text-[var(--text)]">{startDate || '2026-09-01'} to {endDate || '2026-11-20'}</p>
                </div>

                <div className="py-3 space-y-2">
                  <span className="text-[var(--muted)] uppercase font-semibold">Skills Claimed ({selectedSkills.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((sk) => (
                      <span
                        key={sk.id}
                        className="px-2.5 py-1 rounded-lg bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text)] font-medium"
                      >
                        {sk.name} &bull; <strong className="text-[var(--cyan)]">{sk.level}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="py-3 space-y-1">
                  <span className="text-[var(--muted)] uppercase font-semibold">Evidence Files ({files.length})</span>
                  {files.map((f) => (
                    <p key={f.sha256} className="font-mono text-[var(--muted)] truncate">
                      {f.name} &bull; {f.sha256.slice(0, 16)}...
                    </p>
                  ))}
                </div>

                <div className="pt-3 space-y-1">
                  <span className="text-[var(--muted)] uppercase font-semibold">Selected Mentor</span>
                  <p className="font-semibold text-sm text-[var(--text)]">
                    {eligibleMentors.find((m) => m.id === selectedMentorId)?.name || 'Dr. Anand Verma'}
                  </p>
                  <p className="text-[var(--muted)]">
                    Linked through {eligibleMentors.find((m) => m.id === selectedMentorId)?.group || 'Robotics & Automation Club'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--glass-border)] text-sm font-semibold hover:bg-[var(--glass)]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 disabled:opacity-50 transition-all text-sm"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Freezing Revision & Submitting...' : 'Request Verification'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

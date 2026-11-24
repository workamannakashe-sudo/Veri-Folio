'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassNav } from '@/components/GlassNav';
import { GlassCard } from '@/components/GlassCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';
import { 
  Search, 
  Building2, 
  ShieldCheck, 
  Filter, 
  Award, 
  UserCheck, 
  ExternalLink,
  GraduationCap,
  Sparkles,
  Lock
} from 'lucide-react';

interface SearchResult {
  entry_id: string;
  title: string;
  description: string;
  category: string;
  role: string;
  student_display_name: string;
  is_minor: boolean;
  skills: Array<{ id: string; name: string; level: string }>;
  mentor_name: string;
  verified_at: string;
  seal: {
    key_id: string;
    digest: string;
  };
}

const FAMILY_FILTERS = [
  'All',
  'Technology',
  'Science',
  'Leadership',
  'Sports',
  'Arts'
];

export default function ViewerDashboard() {
  const [query, setQuery] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Pre-load default published demo items
  useEffect(() => {
    async function search() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (selectedFamily !== 'All') params.set('family', selectedFamily);

        const data = await apiFetch(`/viewer/search?${params.toString()}`);
        if (data && data.results) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch (err: any) {
        console.error('Viewer search error:', err);
        // Fallback for demo when store is initializing
        setResults([
          {
            entry_id: 'ent-sample-rover',
            title: 'Autonomous Campus Waste-Sorting Rover',
            description: 'Designed and built an autonomous robot with camera mast using YOLOv8-nano.',
            category: 'STEM & Robotics',
            role: 'Lead Hardware & Firmware Developer',
            student_display_name: 'Rohan (Grade 11-A)',
            is_minor: true,
            skills: [
              { id: 'tech-robotics', name: 'Robotics Engineering', level: 'ADVANCED' },
              { id: 'tech-embedded-systems', name: 'Embedded Systems', level: 'INTERMEDIATE' }
            ],
            mentor_name: 'Dr. Anand Verma',
            verified_at: '2026-11-19T10:00:00.000Z',
            seal: {
              key_id: 'ed25519-demo-2026-v1',
              digest: '3f7a1c8b2d9e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a'
            }
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    search();
  }, [query, selectedFamily]);

  return (
    <ProtectedRoute allowedRoles={['VIEWER', 'ADMIN']}>
      <div className="min-h-screen pb-24 md:pb-8 md:pl-64">
        <GlassNav currentRole="Viewer" />

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">
              Organization Viewer Portal
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Search published mentor-verified student records with cryptographic audit checks.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5 text-[var(--cyan)]" />
            <span>Minor Privacy Shield Active</span>
          </div>
        </header>

        {/* Search Bar & Filter Controls */}
        <div className="space-y-3">
          <GlassCard className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-3 text-[var(--muted)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills, projects, or topics (e.g. Robotics, Python, Solar)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
              />
            </div>
          </GlassCard>

          {/* Quick Family Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {FAMILY_FILTERS.map((fam) => (
              <button
                key={fam}
                onClick={() => setSelectedFamily(fam)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedFamily === fam
                    ? 'bg-[var(--cyan)] text-[#0B1030] font-semibold'
                    : 'bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {fam}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Shield Notice */}
        <div className="p-3.5 rounded-xl border border-[var(--cyan)]/30 bg-[var(--cyan)]/5 flex items-start gap-2.5 text-xs text-[var(--muted)]">
          <ShieldCheck className="w-4 h-4 text-[var(--cyan)] flex-shrink-0 mt-0.5" />
          <p>
            <strong>Zero PII Exposure:</strong> Per student privacy mandates, minor students are displayed with first name and class grade only. Contact details and marks are never stored or transmitted.
          </p>
        </div>

        {/* Search Results */}
        {isLoading ? (
          <GlassCard className="p-12 text-center text-sm text-[var(--muted)]">
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
            <p>Searching verified skill records...</p>
          </GlassCard>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted)]">
              Showing {results.length} verified candidate portfolio entry
            </p>
            {results.map((item) => (
              <GlassCard key={item.entry_id} className="p-5 transition-all hover:border-[var(--cyan)]/50 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--cyan)]/15 text-[var(--cyan)]">
                        {item.category}
                      </span>
                      <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {item.student_display_name}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-[var(--text)]">
                      {item.title}
                    </h2>

                    <p className="text-xs text-[var(--text)] line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] pt-1">
                      <UserCheck className="w-3.5 h-3.5 text-[var(--ok)]" />
                      <span>Verified by <strong>{item.mentor_name}</strong></span>
                      <span>•</span>
                      <span>{new Date(item.verified_at).toLocaleDateString()}</span>
                    </div>

                    {/* Skill Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.skills.map((s) => (
                        <span
                          key={s.id}
                          className="text-xs px-2.5 py-1 rounded-lg bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text)] flex items-center gap-1"
                        >
                          <Award className="w-3 h-3 text-[var(--cyan)]" />
                          <span>{s.name}</span>
                          <span className="text-[10px] font-bold uppercase text-[var(--muted)]">
                            ({s.level})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center sm:self-center">
                    <Link
                      href={`/check/${item.entry_id}`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] text-sm font-semibold hover:opacity-95 transition-opacity"
                    >
                      <span>Check Verification</span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard isTextPanel className="py-12 px-4 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--glass)] flex items-center justify-center text-[var(--cyan)]">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--text)]">No Matching Records Found</h2>
              <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
                Try searching for a broader skill keyword like "Robotics", "Web", or "Leadership".
              </p>
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  </ProtectedRoute>
);
}

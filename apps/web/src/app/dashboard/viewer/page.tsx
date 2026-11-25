'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppFrame, Button, StatusBadge } from '@verifolio/ui';
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
  Lock,
  ArrowRight
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
  'Software Development',
  'Robotics',
  'Biotechnology',
  'Leadership'
];

export default function ViewerDashboard() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      setIsLoading(true);
      try {
        const data = await apiFetch<{ results: SearchResult[] }>('/dashboard/viewer');
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, []);

  const filteredResults = results.filter((res) => {
    const matchesQuery = 
      res.title.toLowerCase().includes(query.toLowerCase()) ||
      res.student_display_name.toLowerCase().includes(query.toLowerCase()) ||
      res.skills.some((s) => s.name.toLowerCase().includes(query.toLowerCase()));

    if (selectedFamily === 'All') return matchesQuery;
    return matchesQuery && res.skills.some((s) => s.name.toLowerCase().includes(selectedFamily.toLowerCase()));
  });

  return (
    <ProtectedRoute allowedRoles={['VIEWER']}>
      <AppFrame
        topBarProps={{
          currentRole: 'VIEWER',
          userName: 'Verified Partner',
          progressPercent: 100,
          activePath: '/dashboard/viewer',
          onNavigate: (path) => router.push(path),
        }}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="border-b border-[#E7E8EB] pb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FEF3C7] bg-[#191A23] px-3 py-1 rounded-full">
              University & Employer Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191A23] mt-3">
              Explore Verified Talent
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6F76] mt-1">
              Search cryptographically authenticated student projects. Under-18 students are protected with anonymous initials.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9EA6]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by skill, project title, or student initials..."
                className="w-full h-11 pl-10 pr-4 rounded-full bg-[#F4F5FB] border border-[#E7E8EB] text-xs font-medium text-[#191A23] placeholder:text-[#9A9EA6] focus:outline-none focus:ring-2 focus:ring-[#B5B0F4]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {FAMILY_FILTERS.map((fam) => (
                <button
                  key={fam}
                  onClick={() => setSelectedFamily(fam)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedFamily === fam
                      ? 'bg-[#191A23] text-white shadow-xs'
                      : 'bg-[#F4F5FB] text-[#6B6F76] hover:bg-[#E7E8EB]'
                  }`}
                >
                  {fam}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-2 py-12 text-center text-xs font-bold text-[#6B6F76]">
                Searching verified student credentials...
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-xs font-bold text-[#6B6F76]">
                No verified records match your filter criteria.
              </div>
            ) : (
              filteredResults.map((r) => (
                <div
                  key={r.entry_id}
                  className="rounded-[28px] bg-[#F4F5FB] p-5 sm:p-6 border border-[#E7E8EB] flex flex-col justify-between hover:border-[#B5B0F4] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#191A23]">
                          {r.student_display_name}
                        </span>
                        {r.is_minor && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#191A23] text-white">
                            Minor Protected
                          </span>
                        )}
                      </div>
                      <StatusBadge status="VERIFIED" label="Sealed" />
                    </div>

                    <h3 className="text-base font-bold text-[#191A23] leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-xs text-[#6B6F76] mt-1.5 line-clamp-2">
                      {r.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {r.skills.map((s) => (
                        <span
                          key={s.id}
                          className="px-2.5 py-1 rounded-full bg-white border border-[#E7E8EB] text-[10px] font-bold text-[#7E7AE6]"
                        >
                          {s.name} ({s.level})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E7E8EB] flex items-center justify-between">
                    <span className="text-[11px] text-[#6B6F76]">
                      Attested by {r.mentor_name}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/check/${r.entry_id}`)}
                    >
                      <span>Inspect Seal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </AppFrame>
    </ProtectedRoute>
  );
}

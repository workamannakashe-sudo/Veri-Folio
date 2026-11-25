'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  AppFrame,
  HeroCard,
  KpiTile,
  FeatureCard,
  AccentChartCard,
  RankingStrip,
  ListRow,
  WeekStrip,
  SegmentedProgress,
  BannerCard,
  FilterPill,
  Chip,
  StatusBadge,
  CircleArrowButton,
  Button
} from '@verifolio/ui';
import { 
  Award, 
  GraduationCap, 
  Layers, 
  UserCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck,
  Compass,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export function EduViewDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'weekly' | 'month'>('weekly');
  const [selectedFamily, setSelectedFamily] = useState<string>('Robotics & STEM');
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Live student entries and verification stats
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(true);

  const skillDomains = [
    { name: 'Robotics & STEM', icon: '🤖' },
    { name: 'Computer Science', icon: '💻' },
    { name: 'Biotechnology', icon: '🧬' },
    { name: 'Leadership & Debate', icon: '🗣️' }
  ];

  useEffect(() => {
    async function loadEntries() {
      setIsLoadingEntries(true);
      try {
        const data = await apiFetch<{ entries: any[] }>('/entries');
        setEntries(data.entries || []);
      } catch {
        setEntries([
          {
            id: 'ent-sample-rover',
            category: 'project',
            status: 'APPROVED',
            current_revision: {
              title: 'Autonomous Campus Waste-Sorting Rover',
              description: 'Engineered obstacle-avoidance lidar rover using Arduino and pathfinding algorithms.',
              skills: [
                { id: 'sk-embedded', name: 'Embedded Systems', level: 'ADVANCED' },
                { id: 'sk-robotics', name: 'Robotics', level: 'INTERMEDIATE' }
              ]
            }
          }
        ]);
      } finally {
        setIsLoadingEntries(false);
      }
    }
    loadEntries();
  }, []);

  const verifiedCount = entries.filter((e) => e.status === 'APPROVED' || e.status === 'VERIFIED').length;
  const pendingCount = entries.filter((e) => e.status === 'SUBMITTED' || e.status === 'IN_REVIEW').length;

  return (
    <AppFrame
      topBarProps={{
        currentRole: user?.role || 'STUDENT',
        userName: user?.fullName || 'Rohan Sharma',
        progressPercent: 88,
        activePath: '/dashboard/student',
        onNavigate: (path) => router.push(path),
      }}
    >
      {/* 3-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* ================= LEFT COLUMN (approx 4 cols) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* 1. Hero Promo Card: Skill Portfolio Action */}
          <HeroCard
            title="Institutional"
            accentWord="Skill Portfolio"
            description="Document authentic projects and request mentor attestations sealed with Ed25519 cryptography."
            onCtaClick={() => router.push('/entries/new')}
            illustration={
              <div className="w-24 h-24 rounded-full bg-[#FFA172]/20 border border-[#FFA172]/40 flex items-center justify-center">
                <ShieldCheck className="w-14 h-14 text-[#FFA172]" />
              </div>
            }
          />

          {/* 2. KPI Tiles (Verified Seals & Claimed Skills) */}
          <div className="grid grid-cols-2 gap-3.5">
            <KpiTile
              label="Verified Seals"
              value={verifiedCount || 2}
              icon={<ShieldCheck className="w-5 h-5" />}
              variant="peach"
            />
            <KpiTile
              label="Pending Review"
              value={pendingCount || 1}
              icon={<Clock className="w-5 h-5" />}
              variant="lavender"
            />
          </div>

          {/* 3. Skill Domain Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {skillDomains.map((domain) => (
              <Chip
                key={domain.name}
                label={domain.name}
                icon={domain.icon}
                isSelected={selectedFamily === domain.name}
                onClick={() => setSelectedFamily(domain.name)}
              />
            ))}
          </div>

          {/* 4. Feature Card: Primary Verified Project */}
          <FeatureCard
            variant="dark"
            eyebrow="STEM & ROBOTICS"
            title="Autonomous Campus Waste-Sorting Rover"
            avatars={['RS', 'AV', 'CO']}
            counter="+3 skills"
            onCtaClick={() => router.push('/check/ent-sample-rover')}
          />

          {/* 5. Feature Card (Lavender): Secondary Project */}
          <FeatureCard
            variant="lavender"
            eyebrow="BIO-INFORMATICS"
            title="Microbial DNA Alignment Pipeline"
            avatars={['AL', 'MK']}
            counter="+2 skills"
            onCtaClick={() => router.push('/entries/new')}
          />
        </div>

        {/* ================= CENTER COLUMN (approx 5 cols) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Header Title + Dropdown Filter */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191A23]">
                Attestation Activity
              </h2>
              <p className="text-xs text-[#6B6F76] font-medium mt-0.5">
                Weekly attestation milestones and peer skill benchmarks
              </p>
            </div>
            <div className="relative">
              <FilterPill
                label={selectedFamily}
                isOpen={filterOpen}
                onClick={() => setFilterOpen(!filterOpen)}
              />
              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white border border-[#E7E8EB] shadow-xl p-1.5 z-20 flex flex-col gap-1">
                  {skillDomains.map((d) => (
                    <button
                      key={d.name}
                      onClick={() => {
                        setSelectedFamily(d.name);
                        setFilterOpen(false);
                      }}
                      className="text-left px-3 py-1.5 rounded-xl text-xs font-bold text-[#191A23] hover:bg-[#F4F5FB] transition-all"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Big Orange Accent Analytics Card */}
          <AccentChartCard
            metric1={{ value: '4', label: 'verified claims' }}
            metric2={{ value: '18', label: 'evidence files' }}
            timeframe={activeTab}
            onTimeframeChange={setActiveTab}
            data={[
              { day: 'Mon', value: 2 },
              { day: 'Tue', value: 1 },
              { day: 'Wed', value: 4, isHatched: true },
              { day: 'Thr', value: 3 },
              { day: 'Fri', value: 2 },
            ]}
          />

          {/* Ranking Strip: Cohort Verification Standing */}
          <RankingStrip
            title="Accreditation Honor Roll"
            subtitle="Top 10 verified portfolios in school cohort"
            avatars={['RS', 'AV', 'CO']}
          />

          {/* List Rows: Verification Journey */}
          <div className="flex flex-col gap-3">
            <ListRow
              icon={<ShieldCheck className="w-5 h-5 text-[#059669]" />}
              iconBg="bg-[#10B981]/15 text-[#059669]"
              title="Rover Prototype: Ed25519 Seal Verified"
              subtitle="Confirmed by Dr. Anand Verma &bull; Key ID: key-prod-2026-ed25519"
              duration="Verified"
            />
            <ListRow
              icon={<Clock className="w-5 h-5 text-[#FFA172]" />}
              iconBg="bg-[#FFA172]/20 text-[#C9662A]"
              title="Bio-Informatics Pipeline: Under Review"
              subtitle="Submitted to Science Faculty Roster &bull; 4 evidence files attached"
              duration="Pending"
            />
            <ListRow
              icon={<Compass className="w-5 h-5 text-[#7E7AE6]" />}
              iconBg="bg-[#F1F0FE] text-[#7E7AE6]"
              title="Create New Project Attestation Claim"
              subtitle="Link authentic code repositories, design docs, or certificates"
              duration="Draft"
            />
          </div>
        </div>

        {/* ================= RIGHT COLUMN (approx 3 cols) ================= */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Header Headline */}
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#191A23] leading-snug">
              Verification Schedule 📅
            </h3>
            <p className="text-xs font-bold text-[#FFA172] uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <span>🛡️</span> Mentor Office Hours
            </p>
          </div>

          {/* Week Strip (Mon-Fri review days) */}
          <WeekStrip
            days={[
              { day: 'Mon', date: 20, status: 'done' },
              { day: 'Tue', date: 21, status: 'missed' },
              { day: 'Wed', date: 22, status: 'done' },
              { day: 'Thr', date: 23, status: 'done' },
              { day: 'Fri', date: 24, status: 'today' },
            ]}
          />

          {/* Stacked Period Comparison Progress */}
          <SegmentedProgress
            title="Quarterly Skill Acquisition"
            segments={[
              { label: 'Q1 Spring', count: 6, color: 'bg-[#FFA172]' },
              { label: 'Q2 Summer', count: 11, color: 'bg-[#7E7AE6]' },
              { label: 'Q3 Fall', count: 4, color: 'bg-[#38BDF8]' },
            ]}
          />

          {/* Banner Card: Cryptographic Proof Guarantee */}
          <BannerCard
            title="Public Verification Link"
            subtitle="Employers and universities can verify authentic Ed25519 seals instantly."
            badge="Tamper Evident"
          />

          {/* Quick Access Actions */}
          <div className="rounded-[28px] bg-[#F4F5FB] p-4 border border-[#E7E8EB] flex flex-col gap-3">
            <span className="text-xs font-bold text-[#191A23]">
              Quick Actions
            </span>

            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/entries/new')}
              className="w-full justify-start text-xs"
            >
              <PlusCircle className="w-4 h-4 mr-1.5 text-[#FFA172]" />
              <span>Submit New Skill Claim</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/check/ent-sample-rover')}
              className="w-full justify-start text-xs"
            >
              <ExternalLink className="w-4 h-4 mr-1.5 text-[#7E7AE6]" />
              <span>Open Public Check Page</span>
            </Button>
          </div>
        </div>

      </div>
    </AppFrame>
  );
}

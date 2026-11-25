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
  CircleArrowButton
} from '@verifolio/ui';
import { 
  BookOpen, 
  GraduationCap, 
  Layers, 
  UserCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Trophy,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export function EduViewDashboard() {
  const router = useRouter();
  const { user, switchRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'weekly' | 'month'>('weekly');
  const [selectedSubject, setSelectedSubject] = useState<string>('Math');
  const [allSubjectsOpen, setAllSubjectsOpen] = useState<boolean>(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All subjects');

  // Live student entries state
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(true);

  const subjects = [
    { name: 'Literature', icon: '📚' },
    { name: 'Math', icon: '🧮' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Robotics', icon: '🤖' }
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
              title: 'Autonomous Martian Rover Prototype',
              description: 'Engineered obstacle-avoidance lidar rover using Arduino.',
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

  return (
    <AppFrame
      topBarProps={{
        currentRole: user?.role || 'STUDENT',
        userName: user?.fullName || 'Jacob',
        progressPercent: 76,
        activePath: '/dashboard/student',
        onNavigate: (path) => router.push(path),
      }}
    >
      {/* 3-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* ================= LEFT COLUMN (approx 3.2 cols) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* 1. Hero Promo Card */}
          <HeroCard
            title="A series of"
            accentWord="Olympiads"
            description="A series of Olympiads for erudite scholars from all over the institutional network."
            onCtaClick={() => router.push('/entries/new')}
            illustration={
              <div className="w-24 h-24 rounded-full bg-[#FFA172]/20 border border-[#FFA172]/40 flex items-center justify-center">
                <Trophy className="w-14 h-14 text-[#FFA172]" />
              </div>
            }
          />

          {/* 2. KPI Tiles (Lessons: 78, Hours: 43) */}
          <div className="grid grid-cols-2 gap-3.5">
            <KpiTile
              label="Lessons"
              value={78}
              icon={<BookOpen className="w-5 h-5" />}
              variant="peach"
            />
            <KpiTile
              label="Hours"
              value={43}
              icon={<Clock className="w-5 h-5" />}
              variant="lavender"
            />
          </div>

          {/* 3. Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {subjects.map((sub) => (
              <Chip
                key={sub.name}
                label={sub.name}
                icon={sub.icon}
                isSelected={selectedSubject === sub.name}
                onClick={() => setSelectedSubject(sub.name)}
              />
            ))}
          </div>

          {/* 4. Feature Card: Geometry In Action */}
          <FeatureCard
            variant="dark"
            eyebrow="GEOMETRY IN ACTION"
            title="Creative approaches to plane shapes"
            avatars={['RS', 'AV', 'CO']}
            counter="+43"
            onCtaClick={() => router.push('/entries/new')}
          />

          {/* 5. Feature Card (Lavender): The Microcosm Around Us */}
          <FeatureCard
            variant="lavender"
            eyebrow="THE MICROCOSM AROUND US"
            title="Discoveries in cellular biology"
            avatars={['AL', 'MK']}
            counter="+18"
            onCtaClick={() => router.push('/entries/new')}
          />
        </div>

        {/* ================= CENTER COLUMN (approx 4.8 cols) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Header Title + Dropdown Filter */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191A23]">
              Progress
            </h2>
            <div className="relative">
              <FilterPill
                label={selectedSubjectFilter}
                isOpen={allSubjectsOpen}
                onClick={() => setAllSubjectsOpen(!allSubjectsOpen)}
              />
              {allSubjectsOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white border border-[#E7E8EB] shadow-xl p-1.5 z-20 flex flex-col gap-1">
                  {['All subjects', 'Math', 'Literature', 'Biology', 'Robotics'].map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setSelectedSubjectFilter(f);
                        setAllSubjectsOpen(false);
                      }}
                      className="text-left px-3 py-1.5 rounded-xl text-xs font-bold text-[#191A23] hover:bg-[#F4F5FB] transition-all"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Big Orange Accent Analytics Card */}
          <AccentChartCard
            metric1={{ value: 48, label: 'lessons' }}
            metric2={{ value: 12, label: 'hours' }}
            timeframe={activeTab}
            onTimeframeChange={setActiveTab}
            data={[
              { day: 'Mon', value: 39 },
              { day: 'Tue', value: 14 },
              { day: 'Wed', value: 48, isHatched: true },
              { day: 'Thr', value: 24 },
              { day: 'Fri', value: 22 },
            ]}
          />

          {/* Ranking Strip: Rating of students */}
          <RankingStrip
            title="Rating of students"
            subtitle="10 best students across cohort"
            avatars={['RS', 'AV', 'CO']}
          />

          {/* List Rows */}
          <div className="flex flex-col gap-3">
            <ListRow
              icon={<Compass className="w-5 h-5 text-[#FFA172]" />}
              iconBg="bg-[#FFF4EC]"
              title="Introduction to Verified Portfolio"
              subtitle="1 lesson completed"
              duration="4:54"
            />
            <ListRow
              icon={<Layers className="w-5 h-5 text-[#7E7AE6]" />}
              iconBg="bg-[#F1F0FE]"
              title="Base part: Evidence & Artifacts"
              subtitle="4 lessons completed"
              duration="3:00"
            />
            <ListRow
              icon={<GraduationCap className="w-5 h-5 text-[#6B6F76]" />}
              iconBg="bg-[#F4F5FB]"
              title="Final Assessment & Mentor Review"
              subtitle="1 lesson"
              isLocked={true}
            />
          </div>
        </div>

        {/* ================= RIGHT COLUMN (approx 3.2 cols) ================= */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Header Headline */}
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#191A23] leading-snug">
              Today's reading is ready 📚
            </h3>
            <p className="text-xs font-bold text-[#FFA172] uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <span>📖</span> Charge your mind
            </p>
          </div>

          {/* Week Strip (Mon-Fri with icons) */}
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
            title="Progress performance"
            segments={[
              { label: 'June', count: 23, color: 'bg-[#FFA172]' },
              { label: 'July', count: 43, color: 'bg-[#7E7AE6]' },
              { label: 'August', count: 12, color: 'bg-[#38BDF8]' },
            ]}
          />

          {/* Banner Card: Reading routine */}
          <BannerCard
            title="Reading routine"
            subtitle="increase your memory and critical thinking"
            badge="Reading 3 days"
          />

          {/* Recommendation Carousel Promo */}
          <div className="rounded-[28px] bg-[#F4F5FB] p-4 border border-[#E7E8EB] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#191A23]">
                Recommended for you
              </span>
              <span className="text-[10px] font-bold text-[#7E7AE6]">
                Explore
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-[#FEF3C7] p-3 flex flex-col justify-between min-h-[120px] border border-[#FDE3D0]">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#C9662A]">
                  DISCOVERING
                </span>
                <p className="text-xs font-extrabold text-[#191A23] leading-tight">
                  Wonders of Science
                </p>
              </div>

              <div className="rounded-2xl bg-[#38BDF8]/20 p-3 flex flex-col justify-between min-h-[120px] border border-[#38BDF8]/30">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#0369A1]">
                  WELCOME BACK
                </span>
                <p className="text-xs font-extrabold text-[#191A23] leading-tight">
                  To School & Verification
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppFrame>
  );
}

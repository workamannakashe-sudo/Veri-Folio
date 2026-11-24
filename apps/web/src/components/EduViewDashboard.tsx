'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Bell, 
  ExternalLink, 
  Clock, 
  Lock, 
  BarChart2, 
  ChevronDown, 
  MoreHorizontal,
  GraduationCap,
  Award,
  Layers,
  ShieldCheck,
  BookOpen,
  Settings,
  LayoutGrid,
  Zap,
  CheckCircle2,
  ArrowLeftRight,
  PlusCircle,
  UserCheck,
  Building2,
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export function EduViewDashboard() {
  const { user, switchRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'weekly' | 'month'>('weekly');
  const [selectedSubject, setSelectedSubject] = useState<string>('Math');
  const [allSubjectsOpen, setAllSubjectsOpen] = useState<boolean>(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All subjects');
  const [personaMenuOpen, setPersonaMenuOpen] = useState<boolean>(false);

  // Live student entries state
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(true);

  const subjects = [
    { name: 'Literature', icon: '📚' },
    { name: 'Math', icon: '🧱' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Robotics', icon: '🤖' }
  ];

  const allRoles: Array<{ role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER'; label: string; name: string }> = [
    { role: 'STUDENT', label: 'Student', name: 'Rohan Sharma' },
    { role: 'MENTOR', label: 'Mentor', name: 'Dr. Anand Verma' },
    { role: 'ADMIN', label: 'Admin', name: 'Clara Oswald' },
    { role: 'VIEWER', label: 'Viewer', name: 'Verified Partner' }
  ];

  useEffect(() => {
    async function loadEntries() {
      setIsLoadingEntries(true);
      try {
        const data = await apiFetch<{ entries: any[] }>('/entries');
        setEntries(data.entries || []);
      } catch {
        // Fallback default sample entry
        setEntries([
          {
            id: 'ent-sample-rover',
            category: 'project',
            revision: {
              title: 'Autonomous Campus Waste-Sorting Rover',
              category: 'project',
              role: 'Lead Hardware & Firmware Developer',
              state: 'APPROVED',
              skills: [
                { id: 'sk-robotics-mechatronics', name: 'Robotics Engineering', level: 'ADVANCED' },
                { id: 'sk-microcontroller-programming', name: 'Embedded Systems', level: 'INTERMEDIATE' }
              ],
              evidence: [{ sha256: '3f7a1c8b2d9e0f4a' }]
            }
          }
        ]);
      } finally {
        setIsLoadingEntries(false);
      }
    }

    loadEntries();
  }, []);

  const totalSkillsCount = entries.reduce((acc, curr) => acc + (curr.revision?.skills?.length || 2), 0) + 12;
  const totalEvidenceCount = entries.reduce((acc, curr) => acc + (curr.revision?.evidence?.length || 1), 0) + 5;
  const latestEntry = entries[0]?.revision || {
    title: 'Autonomous Campus Waste-Sorting Rover',
    role: 'Lead Hardware & Firmware Developer',
    category: 'Geometry In Action'
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto p-2 sm:p-4 md:p-6 lg:p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Outer Rounded Window Container */}
      <div className="bg-[#181922] text-[#F3F4F8] rounded-[28px] sm:rounded-[36px] shadow-2xl border border-[#2B2D3A] overflow-hidden transition-all duration-300">
        
        {/* ========================================================
            TOP BAR NAVIGATION
            ======================================================== */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#262835] flex flex-wrap items-center justify-between gap-4">
          {/* Left: EduView Logo with 3D Wireframe Cube */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#9B94FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30">
              {/* 3D Wireframe Cube SVG */}
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                EduView
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#6C63FF]/20 text-[#A5B4FC] border border-[#6C63FF]/30">
                  VeriFolio
                </span>
              </span>
            </div>
          </div>

          {/* Center: Role-Appropriate Capsule Navigation */}
          <nav className="flex items-center gap-1.5 bg-[#0F1015] p-1.5 rounded-full border border-[#2B2D3A] shadow-inner">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1F212D] text-white text-xs sm:text-sm font-semibold shadow-md transition-all">
              <span className="w-2 h-2 rounded-full bg-[#6C63FF]" />
              <LayoutGrid className="w-4 h-4 text-[#A5B4FC]" />
              <span>Dashboard</span>
            </button>
            <Link 
              href="/entries/new" 
              className="flex items-center gap-1 px-3 py-2 rounded-full text-[#8C90A8] hover:text-white hover:bg-[#1E202B] text-xs font-semibold transition-all"
              title="Add New Skill Entry"
            >
              <PlusCircle className="w-4 h-4 text-[#FFA172]" />
              <span className="hidden sm:inline">Add Entry</span>
            </Link>
            <Link 
              href="/check/ent-sample-rover" 
              className="p-2 sm:px-3 sm:py-2 rounded-full text-[#8C90A8] hover:text-white hover:bg-[#1E202B] transition-all"
              title="Check Public Cryptographic Seal"
            >
              <ShieldCheck className="w-4 h-4" />
            </Link>
          </nav>

          {/* Right: User Greeting & Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* Persona Switch Button */}
            <div className="relative">
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E202D] border border-[#2B2D3A] hover:border-[#6C63FF] text-xs font-semibold text-white transition-all shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#FFA172]" />
                <span className="hidden sm:inline">Persona:</span>
                <span className="text-[#A5B4FC] font-bold">{user?.role || 'STUDENT'}</span>
                <ChevronDown className="w-3 h-3 text-[#8C90A8]" />
              </button>

              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#181926] border border-[#2B2D3A] rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
                  <p className="text-[10px] uppercase font-bold text-[#8C90A8] px-2 py-1">
                    Switch Test Account
                  </p>
                  {allRoles.map((r) => (
                    <button
                      key={r.role}
                      onClick={async () => {
                        setPersonaMenuOpen(false);
                        await switchRole(r.role);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium flex items-center justify-between transition-colors ${
                        (user?.role || 'STUDENT') === r.role
                          ? 'bg-[#6C63FF]/30 text-[#A5B4FC] font-bold'
                          : 'text-white hover:bg-[#232536]'
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[10px] text-[#8C90A8]">{r.name}</span>
                    </button>
                  ))}
                  <div className="pt-1 border-t border-[#2B2D3A]">
                    <button
                      onClick={logout}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-red-400 hover:bg-red-500/10 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Greeting & Memoji Avatar */}
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-white leading-tight">
                Hello, {user?.fullName || 'Rohan'}
              </p>
              <p className="text-xs text-[#9B9EBA] flex items-center justify-end gap-1 font-medium">
                <Zap className="w-3 h-3 text-[#FFA172] fill-[#FFA172]" />
                Progress: <span className="text-white font-semibold">84%</span>
              </p>
            </div>

            {/* 3D Memoji Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFE5D9] to-[#FFCAD4] border-2 border-[#FFA172] flex items-center justify-center overflow-hidden shadow-md">
                <span className="text-xl">👨🏻‍🎓</span>
              </div>
            </div>

            {/* Notification Bell */}
            <button 
              className="relative p-2.5 rounded-full bg-[#0F1015] hover:bg-[#20222C] border border-[#2B2D3A] text-[#9EA3BE] hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF4757] ring-2 ring-[#0F1015]" />
            </button>
          </div>
        </header>

        {/* ========================================================
            MAIN DASHBOARD BENTO GRID (Off-white / Slate Surface)
            ======================================================== */}
        <main className="bg-[#F5F6FC] text-[#191A23] p-4 sm:p-6 lg:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">

            {/* ----------------------------------------------------
                COLUMN 1 (LEFT ~ 3.5 cols on desktop)
                ---------------------------------------------------- */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              
              {/* 1. Hero Periwinkle Card: A series of Olympiads */}
              <div className="relative overflow-hidden bg-[#7E79E5] text-white rounded-[30px] p-6 shadow-md flex flex-col justify-between min-h-[220px]">
                {/* Background Math Formula Watermark */}
                <div className="absolute top-16 left-32 text-white/30 text-sm font-mono select-none pointer-events-none">
                  y = ?
                </div>
                <div className="absolute top-5 right-28 text-white/25 text-xs select-none pointer-events-none">
                  ✦
                </div>

                <div className="relative z-10 max-w-[65%] space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
                    A series of Olympiads
                  </h2>
                  <p className="text-xs text-white/80 leading-relaxed font-normal">
                    A series of <span className="font-semibold text-[#FFE79A]">Olympiads</span> for erudite people from all over the world
                  </p>
                </div>

                {/* 3D Illustrated Trophy Graphic */}
                <div className="absolute -bottom-2 right-2 w-36 h-40 pointer-events-none select-none">
                  <svg viewBox="0 0 120 140" fill="none" className="w-full h-full drop-shadow-lg">
                    <path d="M10 25 L12 20 L14 25 L19 27 L14 29 L12 34 L10 29 L5 27 Z" fill="#FFD166" />
                    <path d="M78 8 L79 5 L81 8 L84 9 L81 10 L79 13 L78 10 L75 9 Z" fill="#FFEAA7" />
                    <circle cx="28" cy="42" r="1.5" fill="#FFEAA7" />
                    <circle cx="95" cy="50" r="2" fill="#FFEAA7" />

                    <path d="M35 24 C35 24 32 64 60 64 C88 64 85 24 85 24 Z" fill="url(#trophyGrad)" stroke="#E59866" strokeWidth="2" />
                    <ellipse cx="60" cy="24" rx="25" ry="8" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
                    <ellipse cx="60" cy="24" rx="20" ry="5" fill="#FBCFE8" />

                    <path d="M35 28 C20 30 18 48 36 54" fill="none" stroke="#F6A355" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M85 28 C100 30 102 48 84 54" fill="none" stroke="#F6A355" strokeWidth="3.5" strokeLinecap="round" />

                    <path d="M60 38 L62 43 L67 43 L63 46 L65 51 L60 48 L55 51 L57 46 L53 43 L58 43 Z" fill="#FF4785" />

                    <path d="M57 64 L57 76 C57 78 54 82 50 84 C48 85 48 88 52 88 L68 88 C72 88 72 85 70 84 C66 82 63 78 63 76 L63 64 Z" fill="#FDBA74" stroke="#FB923C" strokeWidth="1.5" />
                    <ellipse cx="60" cy="88" rx="14" ry="4" fill="#E08338" />
                    <ellipse cx="60" cy="94" rx="18" ry="6" fill="#F97316" />
                    <ellipse cx="60" cy="92" rx="18" ry="5" fill="#FDBA74" />

                    <defs>
                      <linearGradient id="trophyGrad" x1="35" y1="24" x2="85" y2="64" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FDE047" />
                        <stop offset="0.6" stopColor="#FBBF24" />
                        <stop offset="1" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Dark Circular Action Button */}
                <div className="relative z-10 pt-4">
                  <Link 
                    href="/entries/new" 
                    className="w-11 h-11 rounded-full bg-[#181922] hover:bg-[#252736] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                    title="Add Achievement Entry"
                  >
                    <ArrowRight className="w-5 h-5 text-white" />
                  </Link>
                </div>
              </div>

              {/* 2. Side-by-Side Stat Cards: Lessons (Skills) & Hours (Evidence) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Lessons Card */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E9ECF5] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#FFEAD8] text-[#E86E2F] flex items-center justify-center font-bold">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#7A7E94] font-medium">Lessons</span>
                  </div>
                  <div className="pt-3">
                    <span className="text-3xl font-extrabold text-[#191A23]">{totalSkillsCount}</span>
                  </div>
                </div>

                {/* Hours Card */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E9ECF5] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#EBE9FE] text-[#7C78E4] flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#7A7E94] font-medium">Hours</span>
                  </div>
                  <div className="pt-3">
                    <span className="text-3xl font-extrabold text-[#191A23]">{totalEvidenceCount}</span>
                  </div>
                </div>
              </div>

              {/* 3. Subject Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {subjects.map((sub) => {
                  const isSelected = selectedSubject === sub.name;
                  return (
                    <button
                      key={sub.name}
                      onClick={() => setSelectedSubject(sub.name)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-white text-[#191A23] shadow-sm border border-[#D5D8E4]'
                          : 'bg-transparent text-[#71768E] hover:text-[#191A23] border border-transparent'
                      }`}
                    >
                      <span className="text-sm">{sub.icon}</span>
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* 4. Active Project Card */}
              <div className="relative overflow-hidden bg-[#1C1D24] text-white rounded-[28px] p-5 shadow-lg border border-[#2B2D3A]">
                <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" viewBox="0 0 300 150">
                  <path d="M 10 120 C 100 20, 200 180, 290 40" fill="none" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                </svg>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FFEAD8]/20 flex items-center justify-center">
                        <span className="text-[10px]">🎨</span>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFA172]">
                        {latestEntry.category || 'Geometry In Action'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white max-w-[220px] leading-snug">
                      {latestEntry.title || 'Creative approaches to plane shapes'}
                    </h3>
                  </div>

                  <Link href="/entries/new" className="text-[#8C90A8] hover:text-white p-1">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                <div className="relative z-10 mt-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-[#FFE3B3] border-2 border-[#1C1D24] flex items-center justify-center text-xs">
                        👦🏼
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#D1E7DD] border-2 border-[#1C1D24] flex items-center justify-center text-xs">
                        👧🏻
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#F8D7DA] border-2 border-[#1C1D24] flex items-center justify-center text-xs">
                        🧑🏽
                      </div>
                    </div>
                    <span className="ml-2 text-xs font-semibold text-[#A6ABC2]">+43</span>
                  </div>

                  <Link 
                    href="/entries/new" 
                    className="w-9 h-9 rounded-full bg-white hover:bg-[#F3F4F8] text-[#191A23] flex items-center justify-center shadow transition-transform hover:scale-105"
                  >
                    <ArrowRight className="w-4 h-4 text-[#191A23]" />
                  </Link>
                </div>
              </div>

              {/* 5. Bottom Card Preview */}
              <div className="bg-[#9A95E8] text-white rounded-[24px] p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1C1D24] flex items-center justify-center text-sm shadow">
                    🧬
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider uppercase text-white/80">
                      The Microcosm Around Us
                    </p>
                    <p className="text-xs font-bold text-white">
                      Discoveries in cell...
                    </p>
                  </div>
                </div>
                <Link href="/check/ent-sample-rover" className="text-white/80 hover:text-white p-1" title="View Check Page">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

            </div>

            {/* ----------------------------------------------------
                COLUMN 2 (MIDDLE ~ 4.5 cols on desktop)
                ---------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              {/* Header: Progress & Subject Dropdown */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-[#191A23] tracking-tight">
                  Progress
                </h2>
                <div className="relative">
                  <button 
                    onClick={() => setAllSubjectsOpen(!allSubjectsOpen)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-xs font-semibold text-[#191A23] border border-[#E2E5F0] shadow-sm hover:bg-[#FAFAFD]"
                  >
                    <span>{selectedSubjectFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#71768E]" />
                  </button>

                  {allSubjectsOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-[#E2E5F0] p-1.5 z-20 text-xs">
                      {['All subjects', 'Math', 'Literature', 'Biology', 'Robotics'].map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            setSelectedSubjectFilter(item);
                            setAllSubjectsOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#F4F5FB] font-medium text-[#191A23]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Apricot / Warm Orange Hero Chart Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#FFA273] via-[#FFAE85] to-[#FF8C53] rounded-[32px] p-6 text-[#191A23] shadow-md flex flex-col justify-between">
                <svg className="absolute -right-10 top-0 w-72 h-72 opacity-20 pointer-events-none" viewBox="0 0 200 200">
                  <path d="M 20,80 Q 90,20 150,90 T 180,180" fill="none" stroke="#FFFFFF" strokeWidth="24" strokeLinecap="round" />
                </svg>

                <div className="flex items-center justify-between relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[#191A23] text-white flex items-center justify-center shadow-md">
                    <BarChart2 className="w-5 h-5" />
                  </div>

                  <div className="flex items-center bg-[#FFC5A6]/50 p-1 rounded-full border border-white/20">
                    <button
                      onClick={() => setActiveTab('weekly')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        activeTab === 'weekly'
                          ? 'bg-[#191A23] text-white shadow'
                          : 'text-[#5A2C18] hover:text-[#191A23]'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setActiveTab('month')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        activeTab === 'month'
                          ? 'bg-[#191A23] text-white shadow'
                          : 'text-[#5A2C18] hover:text-[#191A23]'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-6 my-4 relative z-10">
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#191A23]">
                      {activeTab === 'weekly' ? '48' : '192'}
                    </span>
                    <span className="text-sm font-semibold text-[#191A23]/80 ml-1.5">lessons</span>
                  </div>
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#191A23]">
                      {activeTab === 'weekly' ? '12' : '48'}
                    </span>
                    <span className="text-sm font-semibold text-[#191A23]/80 ml-1.5">hours</span>
                  </div>
                </div>

                {/* 5 Vertical Capsule Progress Bars */}
                <div className="grid grid-cols-5 gap-3 pt-4 items-end relative z-10 h-44">
                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-11 bg-[#191A23] rounded-full h-[65%] flex flex-col items-center justify-start pt-2 shadow">
                      <div className="w-6 h-6 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                        39
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#191A23]">Mon</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-11 bg-[#191A23] rounded-full h-[32%] flex flex-col items-center justify-start pt-2 shadow">
                      <div className="w-6 h-6 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                        14
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#191A23]">Tue</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-11 striped-wednesday rounded-full h-[96%] flex flex-col items-center justify-start pt-2 border-2 border-[#191A23] shadow-lg">
                      <div className="w-6 h-6 rounded-full bg-[#191A23] text-white text-[10px] font-bold flex items-center justify-center shadow">
                        48
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#191A23]">Wed</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-11 bg-[#191A23] rounded-full h-[45%] flex flex-col items-center justify-start pt-2 shadow">
                      <div className="w-6 h-6 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                        24
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#191A23]">Thr</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-11 bg-[#191A23] rounded-full h-[68%] flex flex-col items-center justify-start pt-2 shadow">
                      <div className="w-6 h-6 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                        22
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#191A23]">Fri</span>
                  </div>
                </div>
              </div>

              {/* Rating of Students Pill Bar */}
              <div className="bg-white rounded-[24px] p-3.5 px-5 shadow-sm border border-[#E9ECF5] flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFD166]/25 text-[#E68A00] flex items-center justify-center text-lg shadow-inner">
                    ⭐
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#191A23]">
                      Rating of students
                    </h4>
                    <p className="text-[11px] text-[#7A7E94] font-medium">
                      10 best students &bull; Delhi Public School
                    </p>
                  </div>
                </div>

                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFEAD8] border-2 border-white flex items-center justify-center text-xs shadow-sm">
                    👦🏼
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#D1E7DD] border-2 border-white flex items-center justify-center text-xs shadow-sm">
                    👩🏻
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#E0E7FF] border-2 border-white flex items-center justify-center text-xs shadow-sm">
                    👧🏽
                  </div>
                </div>
              </div>

              {/* Syllabus / Module Lessons List */}
              <div className="bg-white rounded-[28px] p-5 shadow-sm border border-[#E9ECF5] space-y-3.5">
                <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F7F8FD] transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FFE9DE] text-[#FFA172] flex items-center justify-center text-base">
                      🔍
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#191A23]">
                        Introduction
                      </h4>
                      <p className="text-[11px] text-[#7A7E94] font-medium">
                        1 lesson &bull; Rubric Framework
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECECFB] text-[#6C63FF] text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>4:54</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F7F8FD] transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EBE9FE] text-[#7C78E4] flex items-center justify-center text-base">
                      🧊
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#191A23]">
                        Base part
                      </h4>
                      <p className="text-[11px] text-[#7A7E94] font-medium">
                        4 lesson &bull; Evidence Collection
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECECFB] text-[#6C63FF] text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>3:00</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F7F8FD] transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center text-base">
                      🎓
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#191A23]">
                        Test & Seal
                      </h4>
                      <p className="text-[11px] text-[#7A7E94] font-medium">
                        1 lesson &bull; Mentor Confirmation
                      </p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#FFE3E3] text-[#EF4444] flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

            </div>

            {/* ----------------------------------------------------
                COLUMN 3 (RIGHT ~ 3.5 cols on desktop)
                ---------------------------------------------------- */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              
              {/* 1. Today's Reading Is Ready Card + Calendar Strip */}
              <div className="bg-white rounded-[28px] p-5 shadow-sm border border-[#E9ECF5] space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#191A23] leading-snug">
                    Today's reading <br /> is ready 📚
                  </h3>
                  <p className="text-xs text-[#7A7E94] font-medium flex items-center gap-1.5 mt-1.5">
                    <span>📙</span> Charge your mind
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-1.5 pt-1 text-center">
                  {[
                    { day: 'Mon', date: '20', active: false },
                    { day: 'Tue', date: '21', active: false },
                    { day: 'Wed', date: '22', active: false },
                    { day: 'Thr', date: '23', active: false },
                    { day: 'Fri', date: '24', active: true }
                  ].map((d) => (
                    <div
                      key={d.day}
                      className={`py-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                        d.active
                          ? 'bg-[#F2F3FB] border border-[#D8DBEB] shadow-sm'
                          : 'hover:bg-[#F9FAFD]'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-[#8C90A8]">{d.day}</span>
                      <span className={`text-xs font-extrabold mt-0.5 ${d.active ? 'text-[#191A23]' : 'text-[#44485E]'}`}>
                        {d.date}
                      </span>
                      {d.active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Progress Performance Card */}
              <div className="bg-white rounded-[28px] p-5 shadow-sm border border-[#E9ECF5] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[#191A23]">
                    Progress perfomance
                  </h4>
                  <button className="text-[#9EA3BE] hover:text-[#191A23]">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-4 w-full rounded-full overflow-hidden flex bg-[#EAEBF4] p-0.5">
                  <div className="h-full bg-[#FFA172] rounded-l-full" style={{ width: '35%' }} title="June: 23 lessons" />
                  <div className="h-full bg-[#7E7AE6]" style={{ width: '45%' }} title="July: 43 lessons" />
                  <div className="h-full bg-[#CBD0E1] rounded-r-full" style={{ width: '20%' }} title="August: 12 lessons" />
                </div>

                <div className="grid grid-cols-3 text-center text-[10px] pt-1">
                  <div>
                    <p className="font-semibold text-[#191A23]">June</p>
                    <p className="text-[#8C90A8]">23 lessons</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#191A23]">July</p>
                    <p className="text-[#8C90A8]">43 lessons</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#191A23]">August</p>
                    <p className="text-[#8C90A8]">12 lessons</p>
                  </div>
                </div>
              </div>

              {/* 3. Lilac Reading Routine Pill Banner */}
              <div className="bg-[#857EEF] text-white rounded-[26px] p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-2xl shadow-inner">
                  📖
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold leading-tight text-white">
                    Reading routine increase your memory
                  </h4>
                  <p className="text-[11px] text-white/80 font-medium">
                    ⏳ Reading 3 days
                  </p>
                </div>
              </div>

              {/* 4. "Recommended for you" Dual Bento Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[#191A23]">
                    Recomended for you
                  </h4>
                  <button className="text-[#9EA3BE] hover:text-[#191A23]">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FEF3C7] rounded-[24px] p-3.5 flex flex-col justify-between h-44 shadow-sm border border-[#FDE68A] hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#92400E] leading-tight">
                        Discovering The Wonders of Science
                      </p>
                    </div>

                    <div className="flex items-center justify-center py-2 text-3xl">
                      🚀
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-[#92400E]">
                      <span>⏰ 15 min</span>
                      <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs shadow-sm">
                        →
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#38BDF8] text-white rounded-[24px] p-3.5 flex flex-col justify-between h-44 shadow-sm border border-[#0284C7] hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-white leading-tight">
                        Welcome Back To School
                      </p>
                    </div>

                    <div className="flex items-center justify-center py-2 text-3xl">
                      ✈️
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-white">
                      <span>🌍 Global</span>
                      <span className="w-5 h-5 rounded-full bg-white text-[#0284C7] flex items-center justify-center text-xs shadow-sm">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

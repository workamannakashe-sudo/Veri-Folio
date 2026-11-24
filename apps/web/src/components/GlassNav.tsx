'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { 
  UserCheck, 
  ShieldCheck, 
  GraduationCap, 
  Building2, 
  LogOut, 
  PlusCircle, 
  Inbox, 
  Users, 
  ArrowLeftRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface GlassNavProps {
  currentRole?: string;
}

export function GlassNav({ currentRole }: GlassNavProps) {
  const pathname = usePathname();
  const { user, switchRole, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const effectiveRole = user?.role || (currentRole as any) || 'STUDENT';

  // Role-specific navigation links
  const studentLinks = [
    { name: 'My Dashboard', href: '/dashboard/student', icon: GraduationCap },
    { name: 'Add Entry', href: '/entries/new', icon: PlusCircle },
  ];

  const mentorLinks = [
    { name: 'Review Inbox', href: '/dashboard/mentor', icon: Inbox },
  ];

  const adminLinks = [
    { name: 'School Overview', href: '/dashboard/admin', icon: ShieldCheck },
    { name: 'Roster & Mapping', href: '/dashboard/admin/roster', icon: Users },
  ];

  const viewerLinks = [
    { name: 'Search Portfolios', href: '/dashboard/viewer', icon: Building2 },
  ];

  let activeLinks = studentLinks;
  if (effectiveRole === 'MENTOR') activeLinks = mentorLinks;
  else if (effectiveRole === 'ADMIN') activeLinks = adminLinks;
  else if (effectiveRole === 'VIEWER') activeLinks = viewerLinks;

  const allRoles: Array<{ role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER'; label: string; name: string }> = [
    { role: 'STUDENT', label: 'Student', name: 'Rohan Sharma' },
    { role: 'MENTOR', label: 'Mentor', name: 'Dr. Anand Verma' },
    { role: 'ADMIN', label: 'Admin', name: 'Clara Oswald' },
    { role: 'VIEWER', label: 'Viewer', name: 'Verified Partner' }
  ];

  return (
    <>
      {/* Desktop Sidebar (>= 768px) */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-screen p-6 fixed left-0 top-0 glass border-r border-[var(--glass-border)] z-30">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--cyan)] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--cyan)]" />
              <span>VeriFolio</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Active Persona Box with Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-full p-3 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] hover:border-[var(--cyan)] transition-all text-left flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--cyan)] block">
                  Active Persona
                </span>
                <p className="text-sm font-bold text-[var(--text)] truncate max-w-[140px]">
                  {user?.fullName || (effectiveRole === 'STUDENT' ? 'Rohan Sharma' : effectiveRole === 'MENTOR' ? 'Dr. Anand Verma' : 'Administrator')}
                </p>
                <span className="text-[11px] text-[var(--muted)]">
                  Role: {effectiveRole}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform ${roleMenuOpen ? 'rotate-180 text-[var(--cyan)]' : ''}`} />
            </button>

            {/* Persona Switch Menu */}
            {roleMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl glass border border-[var(--glass-border)] shadow-2xl z-50 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] px-2 py-1">
                  Switch Persona
                </p>
                {allRoles.map((r) => (
                  <button
                    key={r.role}
                    onClick={async () => {
                      setRoleMenuOpen(false);
                      await switchRole(r.role);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      effectiveRole === r.role
                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold'
                        : 'text-[var(--text)] hover:bg-[var(--glass)]'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] text-[var(--muted)]">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section Navigation Links */}
          <div className="space-y-1">
            <p className="text-[11px] uppercase font-bold tracking-wider text-[var(--muted)] px-3 mb-2">
              {effectiveRole} Menu
            </p>
            {activeLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--glass-border)] text-[var(--cyan)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--glass)]'
                  }`}
                >
                  <Icon className="w-5 h-5 text-[var(--cyan)]" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-4 border-t border-[var(--glass-border)] flex items-center justify-between">
          <div className="text-xs text-[var(--muted)]">
            <p className="font-semibold text-[var(--text)]">{user?.email || 'Logged In'}</p>
            <p className="text-[10px]">Delhi Public School Demo</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--bad)] hover:bg-[var(--glass)] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (< 768px / 390px viewport) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-[var(--glass-border)] p-2 z-40 flex items-center justify-around">
        {activeLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center p-2 rounded-xl text-xs font-medium transition-colors ${
                isActive ? 'text-[var(--cyan)] font-semibold' : 'text-[var(--muted)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="mt-1">{link.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="flex flex-col items-center p-2 rounded-xl text-xs text-[var(--cyan)]"
          title="Switch Persona"
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span className="mt-1">Persona</span>
        </button>
        <div className="p-1">
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile Role Switcher Modal */}
      {roleMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end p-4">
          <div className="w-full bg-[#181926] border border-[#2B2D3A] rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2B2D3A]">
              <span className="text-sm font-bold text-white">Select Persona</span>
              <button onClick={() => setRoleMenuOpen(false)} className="text-xs text-[var(--muted)]">Close</button>
            </div>
            {allRoles.map((r) => (
              <button
                key={r.role}
                onClick={async () => {
                  setRoleMenuOpen(false);
                  await switchRole(r.role);
                }}
                className={`w-full p-3 rounded-2xl text-left text-sm font-bold flex items-center justify-between ${
                  effectiveRole === r.role ? 'bg-[var(--cyan)]/20 text-[var(--cyan)]' : 'bg-[#202232] text-white'
                }`}
              >
                <span>{r.label}</span>
                <span className="text-xs text-[var(--muted)]">{r.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

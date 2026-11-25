import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  ShieldCheck, 
  LayoutGrid, 
  GraduationCap, 
  UserCheck, 
  Building2, 
  Settings, 
  Bell, 
  Flame,
  Menu,
  X
} from 'lucide-react';

export interface TopBarProps {
  currentRole?: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER';
  userName?: string;
  progressPercent?: number;
  activePath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function TopBar({
  currentRole = 'STUDENT',
  userName = 'Jacob',
  progressPercent = 76,
  activePath = '/dashboard/student',
  onNavigate,
  className,
}: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard/student', icon: LayoutGrid },
    { label: 'Entries', path: '/entries/new', icon: GraduationCap },
    { label: 'Mentor', path: '/dashboard/mentor', icon: UserCheck },
    { label: 'Admin', path: '/dashboard/admin', icon: ShieldCheck },
    { label: 'Viewer', path: '/dashboard/viewer', icon: Building2 },
  ];

  return (
    <header
      className={clsx(
        'w-full flex items-center justify-between py-3 px-4 sm:px-6 bg-[#191A23] text-white rounded-t-[40px]',
        className
      )}
    >
      {/* Left: Brand Icon + Product Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7E7AE6] to-[#A29DF2] flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
          VeriFolio
        </span>
      </div>

      {/* Center: Floating Pill Navigation */}
      <nav 
        aria-label="Main Navigation"
        className="hidden md:flex items-center bg-[#2A2D33]/80 p-1 rounded-full border border-white/5 backdrop-blur-xs"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={clsx(
                'flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#B5B0F4]',
                isActive
                  ? 'bg-[#0E0F11] text-white shadow-xs'
                  : 'text-[#9A9EA6] hover:text-white'
              )}
            >
              <Icon className={clsx('w-4 h-4', isActive ? 'text-[#7E7AE6]' : 'text-current')} />
              {isActive && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Right: User Greeting & Circular Notification */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs sm:text-sm font-bold text-white leading-tight">
            Hello, {userName}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-[#FFA172] font-semibold mt-0.5">
            <Flame className="w-3 h-3 fill-current" />
            <span>Progress: {progressPercent}%</span>
          </div>
        </div>

        {/* Circular Avatar */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#7E7AE6] text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-[#FFA172]">
          {userName.slice(0, 2).toUpperCase()}
        </div>

        {/* Notification Bell */}
        <button
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-full bg-[#2A2D33] text-white/80 hover:text-white flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#B5B0F4]"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#191A23]" />
        </button>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
          className="md:hidden w-9 h-9 rounded-full bg-[#2A2D33] text-white flex items-center justify-center"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

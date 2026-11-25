import React from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface FilterPillProps {
  label: string;
  isOpen?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterPill({ label, isOpen = false, onClick, className }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F5FB] border border-[#E7E8EB] text-xs font-bold text-[#191A23] hover:bg-[#E7E8EB] transition-all focus:outline-none focus:ring-2 focus:ring-[#B5B0F4]',
        className
      )}
    >
      <span>{label}</span>
      <ChevronDown
        className={clsx(
          'w-3.5 h-3.5 transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

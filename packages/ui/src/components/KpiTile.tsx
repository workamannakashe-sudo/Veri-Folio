import React from 'react';
import { clsx } from 'clsx';

export interface KpiTileProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'peach' | 'lavender';
  className?: string;
}

export function KpiTile({ label, value, icon, variant = 'peach', className }: KpiTileProps) {
  const isPeach = variant === 'peach';
  return (
    <div
      className={clsx(
        'relative rounded-[28px] p-5 flex flex-col justify-between transition-all hover:shadow-sm',
        isPeach 
          ? 'bg-[#FFF4EC] border-2 border-[#FDE3D0] text-[#191A23]' 
          : 'bg-[#F1F0FE] border-2 border-[#E3E1FB] text-[#191A23]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div 
          className={clsx(
            'w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs',
            isPeach ? 'bg-[#FFA172] text-[#191A23]' : 'bg-[#7E7AE6] text-white'
          )}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold tracking-wide text-[#6B6F76] uppercase">
          {label}
        </span>
      </div>
      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums mt-1 text-[#191A23]">
        {value}
      </div>
    </div>
  );
}

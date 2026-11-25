import React from 'react';
import { clsx } from 'clsx';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: string | React.ReactNode;
  isSelected?: boolean;
}

export function Chip({ label, icon, isSelected = false, className, ...props }: ChipProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border',
        isSelected
          ? 'bg-[#191A23] text-white border-[#191A23] shadow-xs'
          : 'bg-[#F4F5FB] text-[#191A23] border-[#E7E8EB] hover:bg-[#E7E8EB]',
        className
      )}
      {...props}
    >
      {icon && <span className="text-sm">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

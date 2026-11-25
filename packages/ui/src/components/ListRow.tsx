import React from 'react';
import { clsx } from 'clsx';
import { Clock, Lock } from 'lucide-react';

export interface ListRowProps {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle: string;
  duration?: string;
  isLocked?: boolean;
  className?: string;
}

export function ListRow({
  icon,
  iconBg = 'bg-[#F1F0FE] text-[#7E7AE6]',
  title,
  subtitle,
  duration,
  isLocked = false,
  className,
}: ListRowProps) {
  return (
    <div
      className={clsx(
        'rounded-[24px] bg-white p-3.5 sm:p-4 flex items-center justify-between border border-[#E7E8EB] shadow-xs hover:border-[#B5B0F4] transition-all',
        className
      )}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={clsx(
            'w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs',
            iconBg
          )}
        >
          {icon}
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#191A23] leading-none">
            {title}
          </h4>
          <p className="text-[11px] text-[#6B6F76] mt-1 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center">
        {isLocked ? (
          <div className="w-8 h-8 rounded-full bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        ) : (
          duration && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6F76] bg-[#F4F5FB] px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>{duration}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

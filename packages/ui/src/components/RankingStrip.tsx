import React from 'react';
import { clsx } from 'clsx';
import { Award } from 'lucide-react';

export interface RankingStripProps {
  title: string;
  subtitle: string;
  avatars?: string[];
  className?: string;
}

export function RankingStrip({
  title,
  subtitle,
  avatars = ['RS', 'AV', 'CO'],
  className,
}: RankingStripProps) {
  return (
    <div
      className={clsx(
        'rounded-full bg-[#F4F5FB] p-3 sm:p-3.5 flex items-center justify-between border border-[#E7E8EB] shadow-xs',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center shadow-xs">
          <Award className="w-5 h-5 fill-current" />
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

      <div className="flex items-center -space-x-2 mr-2">
        {avatars.map((init, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full bg-[#7E7AE6] text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white"
          >
            {init}
          </div>
        ))}
      </div>
    </div>
  );
}

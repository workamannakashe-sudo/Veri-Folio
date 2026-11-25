import React from 'react';
import { clsx } from 'clsx';
import { BookOpen, Sparkles } from 'lucide-react';

export interface BannerCardProps {
  title: string;
  subtitle: string;
  badge?: string;
  className?: string;
}

export function BannerCard({
  title,
  subtitle,
  badge = 'Reading 3 days',
  className,
}: BannerCardProps) {
  return (
    <div
      className={clsx(
        'relative rounded-[28px] bg-[#E3E1FB] p-5 border border-[#CFCBF8] flex items-center justify-between overflow-hidden shadow-xs',
        className
      )}
    >
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#7E7AE6] text-white flex items-center justify-center shadow-xs">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#191A23] leading-snug">
            {title}
          </h4>
          <p className="text-xs text-[#191A23]/80 font-medium mt-0.5">
            {subtitle}
          </p>
          {badge && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7E7AE6] mt-2 bg-white/70 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 fill-current" />
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { clsx } from 'clsx';
import { SquareIconButton } from './SquareIconButton';
import { CircleArrowButton } from './CircleArrowButton';

export interface FeatureCardProps {
  variant?: 'dark' | 'lavender';
  eyebrow: string;
  title: string;
  avatars?: string[];
  counter?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function FeatureCard({
  variant = 'dark',
  eyebrow,
  title,
  avatars = ['RS', 'AV', 'CO'],
  counter = '+43',
  onCtaClick,
  className,
}: FeatureCardProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[36px] p-6 flex flex-col justify-between min-h-[190px] shadow-sm',
        isDark ? 'bg-[#191A23] text-white' : 'bg-[#E3E1FB] text-[#191A23]',
        className
      )}
    >
      {/* Decorative swirl */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
        viewBox="0 0 300 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 120 C 80 50, 150 160, 290 80"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFA172]">
            {eyebrow}
          </span>
          <h3 className="text-base sm:text-lg font-bold tracking-tight mt-1 max-w-[80%] leading-tight">
            {title}
          </h3>
        </div>
        <SquareIconButton aria-label="External link" />
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between">
        {/* Avatar Stack */}
        <div className="flex items-center -space-x-2">
          {avatars.map((initials, idx) => (
            <div
              key={idx}
              className="w-7 h-7 rounded-full bg-[#7E7AE6] text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-[#191A23]"
            >
              {initials}
            </div>
          ))}
          {counter && (
            <div className="w-7 h-7 rounded-full bg-[#FFA172] text-[#191A23] font-bold text-[10px] flex items-center justify-center ring-2 ring-[#191A23]">
              {counter}
            </div>
          )}
        </div>

        <CircleArrowButton size="sm" onClick={onCtaClick} aria-label="Open feature action" />
      </div>
    </div>
  );
}

import React from 'react';
import { clsx } from 'clsx';
import { CircleArrowButton } from './CircleArrowButton';

export interface HeroCardProps {
  title: string;
  accentWord?: string;
  description: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  illustration?: React.ReactNode;
  className?: string;
}

export function HeroCard({
  title,
  accentWord,
  description,
  onCtaClick,
  illustration,
  className,
}: HeroCardProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[36px] bg-[#7E7AE6] text-white p-6 sm:p-7 flex flex-col justify-between min-h-[220px] shadow-sm',
        className
      )}
    >
      {/* Background organic wave graphic */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-20 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full text-white fill-current">
          <path d="M45,-65.4C58.3,-58.5,69.2,-46.3,75.4,-32.1C81.6,-17.9,83.1,-1.7,79.5,13.2C75.9,28.2,67.2,41.9,55.5,52.2C43.8,62.6,29.1,69.6,13.7,73.1C-1.8,76.6,-18,76.6,-32.8,70.7C-47.6,64.8,-61,53.1,-69.5,38.5C-78.1,23.9,-81.8,6.5,-79.6,-9.8C-77.4,-26.1,-69.2,-41.2,-57,-48.7C-44.8,-56.3,-28.5,-56.2,-13.7,-57.6C1.1,-59,15.6,-61.8,30.3,-68.8C45,-75.8,59.8,-86.9,45,-65.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[65%]">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
          {title}{' '}
          {accentWord && <span className="text-[#FFA172]">{accentWord}</span>}
        </h2>
        <p className="text-xs sm:text-sm text-white/80 mt-2 font-medium line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="relative z-10 mt-6 flex items-end justify-between">
        <CircleArrowButton onClick={onCtaClick} aria-label="Open Hero CTA" />
        {illustration && (
          <div className="absolute -bottom-2 -right-2 w-28 h-28 sm:w-32 sm:h-32 pointer-events-none flex items-center justify-center">
            {illustration}
          </div>
        )}
      </div>
    </div>
  );
}

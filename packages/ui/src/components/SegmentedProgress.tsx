import React from 'react';
import { clsx } from 'clsx';
import { MoreHorizontal } from 'lucide-react';

export interface SegmentedProgressProps {
  title?: string;
  segments?: Array<{ label: string; count: number; color: string }>;
  className?: string;
}

export function SegmentedProgress({
  title = 'Progress performance',
  segments = [
    { label: 'June', count: 23, color: 'bg-[#FFA172]' },
    { label: 'July', count: 43, color: 'bg-[#7E7AE6]' },
    { label: 'August', count: 12, color: 'bg-[#38BDF8]' },
  ],
  className,
}: SegmentedProgressProps) {
  const total = segments.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className={clsx('rounded-[28px] bg-[#F4F5FB] p-5 border border-[#E7E8EB]', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs sm:text-sm font-bold text-[#191A23]">
          {title}
        </h4>
        <button aria-label="More options" className="text-[#6B6F76] hover:text-[#191A23]">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Bar */}
      <div className="h-5 w-full rounded-full bg-[#E7E8EB] overflow-hidden flex p-0.5 gap-1">
        {segments.map((seg, idx) => {
          const widthPercent = Math.round((seg.count / total) * 100);
          return (
            <div
              key={idx}
              className={clsx('h-full rounded-full transition-all', seg.color)}
              style={{ width: `${widthPercent}%` }}
            />
          );
        })}
      </div>

      {/* Legend underneath */}
      <div className="flex items-center justify-between mt-4 text-[11px] font-semibold text-[#6B6F76]">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className={clsx('w-2 h-2 rounded-full', seg.color)} />
              <span className="text-[#191A23] font-bold">{seg.label}</span>
            </div>
            <span className="opacity-80 mt-0.5">{seg.count} lessons</span>
          </div>
        ))}
      </div>
    </div>
  );
}

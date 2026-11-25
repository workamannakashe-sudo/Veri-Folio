import React from 'react';
import { clsx } from 'clsx';
import { Check, Flame } from 'lucide-react';

export interface WeekDay {
  day: string;
  date: number | string;
  status: 'done' | 'missed' | 'today';
}

export interface WeekStripProps {
  days?: WeekDay[];
  className?: string;
}

export function WeekStrip({
  days = [
    { day: 'Mon', date: 20, status: 'done' },
    { day: 'Tue', date: 21, status: 'missed' },
    { day: 'Wed', date: 22, status: 'done' },
    { day: 'Thr', date: 23, status: 'done' },
    { day: 'Fri', date: 24, status: 'today' },
  ],
  className,
}: WeekStripProps) {
  return (
    <div className={clsx('flex items-center justify-between gap-2', className)}>
      {days.map((item) => (
        <div
          key={item.day}
          className={clsx(
            'flex-1 py-3 px-1.5 rounded-2xl flex flex-col items-center justify-between min-h-[88px] border transition-all',
            item.status === 'today'
              ? 'bg-[#191A23] text-white border-[#191A23] shadow-xs'
              : 'bg-[#F4F5FB] text-[#191A23] border-[#E7E8EB]'
          )}
        >
          <span className="text-[11px] font-semibold opacity-75">
            {item.day}
          </span>
          <span className="text-base font-extrabold tabular-nums my-1">
            {item.date}
          </span>
          <div className="mt-1">
            {item.status === 'done' && (
              <div className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
            {item.status === 'missed' && (
              <div className="w-4 h-4 rounded-full bg-[#EF4444] text-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
            {item.status === 'today' && (
              <div className="w-4 h-4 rounded-full bg-[#FFA172] text-[#191A23] flex items-center justify-center">
                <Flame className="w-2.5 h-2.5 fill-current" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

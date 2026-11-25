import React from 'react';
import { clsx } from 'clsx';
import { BarChart2 } from 'lucide-react';

export interface AccentChartCardProps {
  title?: string;
  metric1: { value: string | number; label: string };
  metric2: { value: string | number; label: string };
  timeframe: 'weekly' | 'month';
  onTimeframeChange: (val: 'weekly' | 'month') => void;
  data?: Array<{ day: string; value: number; isHatched?: boolean }>;
  className?: string;
}

export function AccentChartCard({
  metric1,
  metric2,
  timeframe,
  onTimeframeChange,
  data = [
    { day: 'Mon', value: 39 },
    { day: 'Tue', value: 14 },
    { day: 'Wed', value: 48, isHatched: true },
    { day: 'Thr', value: 24 },
    { day: 'Fri', value: 22 },
  ],
  className,
}: AccentChartCardProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 50);

  return (
    <div
      className={clsx(
        'relative rounded-[36px] bg-[#FFA172] text-[#191A23] p-6 sm:p-7 shadow-sm flex flex-col justify-between overflow-hidden',
        className
      )}
    >
      {/* Header with Icon and Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl bg-[#191A23] text-white flex items-center justify-center shadow-xs">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>

        {/* Segmented Toggle (Weekly | Month) */}
        <div className="bg-[#191A23]/15 p-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
          <button
            onClick={() => onTimeframeChange('weekly')}
            className={clsx(
              'px-3.5 py-1 rounded-full text-xs font-bold transition-all',
              timeframe === 'weekly'
                ? 'bg-[#191A23] text-white shadow-xs'
                : 'text-[#191A23]/80 hover:text-[#191A23]'
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => onTimeframeChange('month')}
            className={clsx(
              'px-3.5 py-1 rounded-full text-xs font-bold transition-all',
              timeframe === 'month'
                ? 'bg-[#191A23] text-white shadow-xs'
                : 'text-[#191A23]/80 hover:text-[#191A23]'
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex items-baseline gap-6 my-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
            {metric1.value}
          </span>
          <span className="text-xs sm:text-sm font-semibold opacity-85">
            {metric1.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
            {metric2.value}
          </span>
          <span className="text-xs sm:text-sm font-semibold opacity-85">
            {metric2.label}
          </span>
        </div>
      </div>

      {/* Pill Bar Chart Canvas */}
      <div className="relative mt-6 pt-6 pb-2 border-t border-dashed border-[#191A23]/25 flex items-end justify-between gap-3 h-44">
        {data.map((bar) => {
          const heightPercent = Math.max(20, Math.round((bar.value / maxValue) * 100));
          return (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              {/* Capsule Bar */}
              <div
                className={clsx(
                  'w-full max-w-[48px] rounded-full relative transition-all duration-300 flex flex-col items-center justify-start pt-2 shadow-xs',
                  bar.isHatched ? 'striped-capsule border-2 border-[#191A23]' : 'bg-[#191A23]'
                )}
                style={{ height: `${heightPercent}%` }}
              >
                {/* Bubble Value */}
                <span className="text-[10px] sm:text-xs font-extrabold text-white bg-[#191A23] px-2 py-0.5 rounded-full shadow-xs">
                  {bar.value}
                </span>
              </div>
              <span className="text-xs font-bold text-[#191A23]/80 mt-1">
                {bar.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import { clsx } from 'clsx';
import { TopBar, TopBarProps } from './TopBar';

export interface AppFrameProps {
  topBarProps?: TopBarProps;
  children: React.ReactNode;
  className?: string;
}

export function AppFrame({
  topBarProps,
  children,
  className,
}: AppFrameProps) {
  return (
    <div className="min-h-screen w-full bg-[linear-gradient(135deg,#B9B5F9_0%,#9D98F2_100%)] p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center selection:bg-[#FFA172] selection:text-[#191A23]">
      {/* Outer Dark Charcoal Frame */}
      <div
        className={clsx(
          'w-full max-w-[1440px] bg-[#191A23] rounded-[32px] sm:rounded-[44px] md:rounded-[48px] p-2 sm:p-3 md:p-3.5 shadow-2xl border border-black/10 flex flex-col',
          className
        )}
      >
        {/* Top Bar inside frame */}
        <TopBar {...topBarProps} />

        {/* Inner Crisp White Sheet */}
        <main className="w-full bg-white text-[#191A23] rounded-[24px] sm:rounded-[36px] md:rounded-[40px] p-3 sm:p-5 md:p-6 shadow-inner min-h-[600px] flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

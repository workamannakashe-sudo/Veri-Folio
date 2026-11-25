import React from 'react';
import { clsx } from 'clsx';
import { ExternalLink } from 'lucide-react';

export interface SquareIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export const SquareIconButton = React.forwardRef<HTMLButtonElement, SquareIconButtonProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'w-9 h-9 rounded-xl bg-[#2A2D33]/60 hover:bg-[#2A2D33] text-white/80 hover:text-white flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#B5B0F4]',
          className
        )}
        {...props}
      >
        {icon || <ExternalLink className="w-4 h-4" />}
      </button>
    );
  }
);
SquareIconButton.displayName = 'SquareIconButton';

import React from 'react';
import { clsx } from 'clsx';
import { ArrowRight } from 'lucide-react';

export interface CircleArrowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  ringColor?: string;
}

export const CircleArrowButton = React.forwardRef<HTMLButtonElement, CircleArrowButtonProps>(
  ({ className, size = 'md', ringColor = '#FFA172', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-11 h-11',
      lg: 'w-14 h-14',
    }[size];

    const iconSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    }[size];

    return (
      <button
        ref={ref}
        className={clsx(
          'relative rounded-full bg-[#191A23] text-white flex items-center justify-center group transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#B5B0F4]',
          sizeClasses,
          className
        )}
        {...props}
      >
        <span 
          className="absolute inset-[-3px] rounded-full border-2 border-dashed opacity-75 group-hover:opacity-100 transition-opacity"
          style={{ borderColor: ringColor }}
        />
        <ArrowRight className={clsx(iconSizes, 'transition-transform group-hover:translate-x-0.5')} />
      </button>
    );
  }
);
CircleArrowButton.displayName = 'CircleArrowButton';

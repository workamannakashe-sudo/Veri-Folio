import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'soft' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-[36px] px-3.5 text-xs',
      md: 'h-[44px] px-5 text-sm',
      lg: 'h-[52px] px-6 text-base',
    }[size];

    const variantClasses = {
      primary: 'bg-[#191A23] text-white hover:bg-[#2A2D33] active:bg-[#0E0F11]',
      accent: 'bg-[#FFA172] text-[#191A23] font-bold hover:bg-[#F99B5C] active:bg-[#EC8442]',
      soft: 'bg-[#F1F0FE] text-[#7E7AE6] hover:bg-[#E3E1FB] active:bg-[#CFCBF8]',
      outline: 'bg-transparent border border-[#E7E8EB] text-[#191A23] hover:bg-[#F8F8FA]',
      ghost: 'bg-transparent text-[#6B6F76] hover:bg-[#F4F5FB] hover:text-[#191A23]',
      danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#B5B0F4] disabled:opacity-50 disabled:cursor-not-allowed select-none gap-2',
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

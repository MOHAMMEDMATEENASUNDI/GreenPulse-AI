/**
 * @license
 * GreenPulse AI — Button Primitive Component
 */

import React from 'react';
import { cn } from '../../utils/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] select-none rounded-[6px]';

    const variants = {
      primary: 'bg-[#2ED9A3] text-[#0A0E14] hover:bg-[#25C492] shadow-sm font-semibold',
      secondary: 'border border-[#242B38] bg-transparent text-[#F4F6F8] hover:bg-[#171C27] hover:border-[#8891A3]',
      ghost: 'bg-transparent text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#171C27]',
      destructive: 'bg-[#F0554C] text-white hover:bg-[#D9433A]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping delay-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping delay-150" />
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

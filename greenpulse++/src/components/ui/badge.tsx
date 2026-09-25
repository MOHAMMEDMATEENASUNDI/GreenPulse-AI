/**
 * @license
 * GreenPulse AI — Badge Primitive Component (Dual-Encoded)
 */

import React from 'react';
import { cn } from '../../utils/utils';

export interface BadgeProps {
  variant?: 'emerald' | 'cyan' | 'violet' | 'warning' | 'error' | 'neutral';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'emerald',
  icon,
  children,
  className,
}) => {
  const variants = {
    emerald: 'bg-[#2ED9A3]/10 text-[#2ED9A3] border-[#2ED9A3]/20',
    cyan: 'bg-[#3FB6E8]/10 text-[#3FB6E8] border-[#3FB6E8]/20',
    violet: 'bg-[#8B7FFF]/10 text-[#8B7FFF] border-[#8B7FFF]/20',
    warning: 'bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20',
    error: 'bg-[#F0554C]/10 text-[#F0554C] border-[#F0554C]/20',
    neutral: 'bg-[#242B38]/50 text-[#8891A3] border-[#242B38]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none whitespace-nowrap',
        variants[variant],
        className
      )}
    >
      {icon && <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
};

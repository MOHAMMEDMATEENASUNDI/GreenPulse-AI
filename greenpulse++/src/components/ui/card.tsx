/**
 * @license
 * GreenPulse AI — Card & Glass Panel Components
 */

import React from 'react';
import { cn } from '../../utils/utils';

export type CardAccentColor = 'emerald' | 'cyan' | 'violet' | 'amber' | 'red';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'raised' | 'glass';
  hasAccentGlow?: boolean;
  glowOnHover?: boolean;
  accentColor?: CardAccentColor;
}

const ACCENT_GLOW_STYLES: Record<CardAccentColor, {
  border: string;
  hoverBorder: string;
  glow: string;
  shadow: string;
  bgGlow: string;
}> = {
  emerald: {
    border: 'border-[#2ED9A3]/50',
    hoverBorder: 'hover:border-[#2ED9A3]',
    glow: 'rgba(46, 217, 163, 0.35)',
    shadow: 'shadow-[0_0_24px_rgba(46,217,163,0.3)]',
    bgGlow: 'from-[#2ED9A3]/30 via-[#2ED9A3]/10',
  },
  cyan: {
    border: 'border-[#3FB6E8]/50',
    hoverBorder: 'hover:border-[#3FB6E8]',
    glow: 'rgba(63, 182, 232, 0.35)',
    shadow: 'shadow-[0_0_24px_rgba(63,182,232,0.3)]',
    bgGlow: 'from-[#3FB6E8]/30 via-[#3FB6E8]/10',
  },
  violet: {
    border: 'border-[#8B7FFF]/50',
    hoverBorder: 'hover:border-[#8B7FFF]',
    glow: 'rgba(139, 127, 255, 0.35)',
    shadow: 'shadow-[0_0_24px_rgba(139,127,255,0.3)]',
    bgGlow: 'from-[#8B7FFF]/30 via-[#8B7FFF]/10',
  },
  amber: {
    border: 'border-[#F5A623]/50',
    hoverBorder: 'hover:border-[#F5A623]',
    glow: 'rgba(245, 166, 35, 0.35)',
    shadow: 'shadow-[0_0_24px_rgba(245,166,35,0.3)]',
    bgGlow: 'from-[#F5A623]/30 via-[#F5A623]/10',
  },
  red: {
    border: 'border-[#F0554C]/50',
    hoverBorder: 'hover:border-[#F0554C]',
    glow: 'rgba(240, 85, 76, 0.35)',
    shadow: 'shadow-[0_0_24px_rgba(240,85,76,0.3)]',
    bgGlow: 'from-[#F0554C]/30 via-[#F0554C]/10',
  },
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'surface',
      hasAccentGlow,
      glowOnHover = false,
      accentColor = 'emerald',
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      surface: 'bg-[#12161F] border border-[#242B38] shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
      raised: 'bg-[#171C27] border border-[#242B38] shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
      glass: 'glass-panel',
    };

    const accent = ACCENT_GLOW_STYLES[accentColor] || ACCENT_GLOW_STYLES.emerald;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[10px] p-5 transition-all duration-300 relative',
          variants[variant],
          hasAccentGlow && cn(accent.border, accent.shadow),
          glowOnHover && cn(accent.hoverBorder, 'hover:' + accent.shadow, 'group'),
          className
        )}
        {...props}
      >
        {/* Persistent or hover ambient glow pool */}
        {(hasAccentGlow || glowOnHover) && (
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute -inset-1 rounded-[12px] bg-gradient-to-br to-transparent blur-[16px] -z-10 transition-opacity duration-300',
              accent.bgGlow,
              hasAccentGlow ? 'opacity-40' : 'opacity-0 group-hover:opacity-60'
            )}
          />
        )}
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';


export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-medium uppercase tracking-wider text-[#8891A3]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'h-10 px-3.5 rounded-[6px] bg-[#12161F] border border-[#242B38] text-[#F4F6F8] placeholder-[#5B6472] text-sm focus:outline-none focus:border-[#2ED9A3] transition-colors duration-150',
            error && 'border-[#F0554C] focus:border-[#F0554C]',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#F0554C]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#5B6472]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

/**
 * @license
 * GreenPulse AI — Glass Panel, Score Gauge Arc, and Stat Number UI Primitives
 */

import React from 'react';
import { cn, formatMetricNumber } from '../../utils/utils';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('glass-panel rounded-[16px] p-6', className)} {...props}>
      {children}
    </div>
  );
};

export interface ScoreGaugeArcProps {
  score: number; // 0-100
  size?: 'hero' | 'compact';
  className?: string;
}

export const ScoreGaugeArc: React.FC<ScoreGaugeArcProps> = ({ score, size = 'hero', className }) => {
  const isHero = size === 'hero';
  const radius = isHero ? 70 : 20;
  const strokeWidth = isHero ? 10 : 3.5;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={isHero ? 160 : 48}
        height={isHero ? 160 : 48}
        viewBox={isHero ? '0 0 160 160' : '0 0 48 48'}
        className="rotate-[-90deg]"
      >
        <defs>
          <linearGradient id="auroraGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2ED9A3" />
            <stop offset="50%" stopColor="#3FB6E8" />
            <stop offset="100%" stopColor="#8B7FFF" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={isHero ? 80 : 24}
          cy={isHero ? 80 : 24}
          r={radius}
          stroke="#242B38"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Value Arc */}
        <circle
          cx={isHero ? 80 : 24}
          cy={isHero ? 80 : 24}
          r={radius}
          stroke="url(#auroraGaugeGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={cn('font-data font-semibold text-[#F4F6F8]', isHero ? 'text-4xl' : 'text-xs')}>
          {score}
        </span>
        {isHero && <span className="text-[10px] uppercase tracking-wider text-[#8891A3]">Green Score</span>}
      </div>
    </div>
  );
};

export interface StatNumberProps {
  value: number;
  decimals?: number;
  unit?: string;
  className?: string;
}

export const StatNumber: React.FC<StatNumberProps> = ({ value, decimals = 0, unit, className }) => {
  return (
    <span className={cn('font-data font-medium text-[#F4F6F8]', className)}>
      {formatMetricNumber(value, decimals)}
      {unit && <span className="ml-1 text-xs text-[#8891A3] font-normal">{unit}</span>}
    </span>
  );
};

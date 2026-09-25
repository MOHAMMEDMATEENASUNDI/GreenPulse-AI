/**
 * @license
 * GreenPulse AI — Scroll-Driven Live Intelligence Metrics
 * Data Bricks, Technical Grid, Laser Pulses & Cursor Depth Modulation
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { AnimatedCounter } from '../../components/ui/animated-counter';
import { LuminousTechGrid, SpecularLightSweep } from '../../components/motion/motion-components';
import { Leaf, Building2, Bot, DollarSign, ShieldCheck, Activity, Radio, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/utils';

interface MetricItem {
  id: string;
  code: string;
  title: string;
  numericValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sublabel: string;
  trend: string;
  icon: React.ElementType;
  color: string;
  gridArea?: string;
  pos: { x: number; y: number }; // relative % position for SVG node connectors
}

const METRICS_DATA: MetricItem[] = [
  {
    id: 'co2',
    code: 'TELEMETRY // STREAM-01',
    title: 'Total CO₂e Tracked',
    numericValue: 1284520,
    suffix: ' t',
    sublabel: 'Scope 1, 2 & 3 Emissions',
    trend: '-14.2% YoY',
    icon: Leaf,
    color: '#2ED9A3',
    pos: { x: 20, y: 25 },
  },
  {
    id: 'facilities',
    code: 'SITES // GLOBAL-142',
    title: 'Facilities Monitored',
    numericValue: 142,
    suffix: ' Sites',
    sublabel: 'Across 18 Countries',
    trend: '100% Uptime',
    icon: Building2,
    color: '#3FB6E8',
    pos: { x: 50, y: 25 },
  },
  {
    id: 'ai-insights',
    code: 'AGENT // CO-PILOT',
    title: 'AI Insights Generated',
    numericValue: 8940,
    suffix: ' Alerts',
    sublabel: 'Automated Anomaly Fixes',
    trend: '+32 this week',
    icon: Bot,
    color: '#8B7FFF',
    pos: { x: 80, y: 25 },
  },
  {
    id: 'savings',
    code: 'FINANCE // OPEX-ROI',
    title: 'Potential Cost Savings',
    numericValue: 14.2,
    prefix: '$',
    suffix: 'M',
    decimals: 1,
    sublabel: 'Energy Efficiency ROI',
    trend: '$1.8M Realized',
    icon: DollarSign,
    color: '#2ED9A3',
    pos: { x: 35, y: 75 },
  },
  {
    id: 'esg-score',
    code: 'COMPLIANCE // TIER-1',
    title: 'ESG Readiness Rating',
    numericValue: 94,
    suffix: ' / 100',
    sublabel: 'SEBI BRSR & CSRD Certified',
    trend: 'Grade A Audit',
    icon: ShieldCheck,
    color: '#F5A623',
    pos: { x: 65, y: 75 },
  },
];

export const IntelligenceMetricsSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const reduce = useReducedMotion();

  const [activeClosestIndex, setActiveClosestIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Pointer movement distance calculation for subtle lighting boost
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !containerRef.current) return;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    let minDistance = Infinity;
    let closestIdx = -1;

    cardRefs.current.forEach((ref, idx) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dist = Math.hypot(mouseX - centerX, mouseY - centerY);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (minDistance < 350) {
      setActiveClosestIndex(closestIdx);
    } else {
      setActiveClosestIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setActiveClosestIndex(null);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="py-24 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[#1A1F2A] relative overflow-hidden select-none"
    >
      {/* 1. Technical Grid Background */}
      <LuminousTechGrid />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12161F] border border-[#2ED9A3]/30 text-xs font-semibold text-[#2ED9A3] mb-3 shadow-md"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse text-[#2ED9A3]" />
          Live Telemetry Stream
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl font-semibold text-[#F4F6F8] mb-3 font-display tracking-tight"
        >
          Real-time intelligence metrics
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base text-[#8891A3]"
        >
          Mission control data stream tracking enterprise decarbonization velocity in sub-second intervals.
        </motion.p>
      </div>

      {/* 2. SVG Connecting Lines & Moving Emerald Light Points */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block opacity-60">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 600">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2ED9A3" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#3FB6E8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8B7FFF" stopOpacity="0.1" />
            </linearGradient>

            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Line 1: CO2 -> Facilities -> AI Insights */}
          <motion.path
            d="M 200 150 L 500 150 L 800 150"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={activeClosestIndex === 0 || activeClosestIndex === 1 || activeClosestIndex === 2 ? 2.5 : 1.5}
            strokeDasharray="6 6"
            initial={{ opacity: 0.2 }}
            animate={isInView ? { opacity: [0.2, 0.6, 0.2] } : { opacity: 0.2 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Line 2: CO2 -> Cost Savings */}
          <motion.path
            d="M 200 150 L 350 450"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={activeClosestIndex === 0 || activeClosestIndex === 3 ? 2.5 : 1.5}
            strokeDasharray="4 4"
            initial={{ opacity: 0.2 }}
            animate={isInView ? { opacity: [0.2, 0.5, 0.2] } : { opacity: 0.2 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />

          {/* Line 3: AI Insights -> ESG Readiness */}
          <motion.path
            d="M 800 150 L 650 450"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={activeClosestIndex === 2 || activeClosestIndex === 4 ? 2.5 : 1.5}
            strokeDasharray="4 4"
            initial={{ opacity: 0.2 }}
            animate={isInView ? { opacity: [0.2, 0.5, 0.2] } : { opacity: 0.2 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

          {/* Traveling Light Pulse Points */}
          {!reduce && isInView && (
            <>
              <circle r="4" fill="#2ED9A3" filter="url(#emeraldGlow)">
                <animateMotion path="M 200 150 L 500 150 L 800 150" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#3FB6E8" filter="url(#emeraldGlow)">
                <animateMotion path="M 200 150 L 350 450" dur="5s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#8B7FFF" filter="url(#emeraldGlow)">
                <animateMotion path="M 800 150 L 650 450" dur="4.5s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* 3. Floating Data Bricks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {METRICS_DATA.map((item, idx) => {
          const isClosest = activeClosestIndex === idx;
          const isDimmed = activeClosestIndex !== null && activeClosestIndex !== idx;

          return (
            <motion.div
              key={item.id}
              ref={(el) => { cardRefs.current[idx] = el; }}
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={
                isInView
                  ? {
                      opacity: isDimmed ? 0.72 : 1,
                      y: 0,
                      scale: isClosest ? 1.02 : 1,
                    }
                  : {}
              }
              transition={{
                duration: 0.6,
                delay: 0.25 + idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                'group relative rounded-[14px] bg-[#10141D]/90 backdrop-blur-xl border p-6 transition-all duration-300 shadow-xl overflow-hidden',
                isClosest
                  ? 'border-[#2ED9A3] shadow-[#2ED9A3]/20 shadow-2xl bg-[#121824]'
                  : 'border-[#1E2638] hover:border-[#2ED9A3]/50'
              )}
            >
              {/* Corner Tech Brackets */}
              <span className="absolute top-2 left-2 text-[10px] text-[#2ED9A3]/40 font-data select-none">+</span>
              <span className="absolute top-2 right-2 text-[10px] text-[#2ED9A3]/40 font-data select-none">+</span>
              <span className="absolute bottom-2 left-2 text-[10px] text-[#2ED9A3]/40 font-data select-none">+</span>
              <span className="absolute bottom-2 right-2 text-[10px] text-[#2ED9A3]/40 font-data select-none">+</span>

              {/* Data Label Header */}
              <div className="flex items-center justify-between mb-4 border-b border-[#1A2232] pb-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#8891A3] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ED9A3]" />
                  {item.code}
                </span>
                <span className="text-[11px] font-semibold font-data px-2 py-0.5 rounded bg-[#171E2C] text-[#2ED9A3] border border-[#2ED9A3]/20">
                  {item.trend}
                </span>
              </div>

              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center border transition-all"
                  style={{
                    backgroundColor: `${item.color}15`,
                    borderColor: `${item.color}40`,
                  }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h3 className="text-sm font-medium text-[#8891A3] group-hover:text-[#F4F6F8] transition-colors">
                  {item.title}
                </h3>
              </div>

              {/* Animated Counting Metric Value */}
              <div className="mb-2">
                {isInView ? (
                  <AnimatedCounter
                    value={item.numericValue}
                    prefix={item.prefix || ''}
                    suffix={item.suffix || ''}
                    decimals={item.decimals || 0}
                    className="text-3xl sm:text-4xl font-extrabold text-[#F4F6F8] font-data tracking-tight"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#F4F6F8] font-data tracking-tight">
                    0
                  </span>
                )}
              </div>

              {/* Sublabel */}
              <p className="text-xs text-[#8891A3] flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#2ED9A3]" />
                {item.sublabel}
              </p>

              {/* Short Diagonal Specular Sweep */}
              {isInView && (
                <motion.div
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: '200%', opacity: [0, 0.8, 0] }}
                  transition={{
                    duration: 1.2,
                    delay: 0.6 + idx * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#2ED9A3]/20 to-transparent -skew-x-12 pointer-events-none"
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

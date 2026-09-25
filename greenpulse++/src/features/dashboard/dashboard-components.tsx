/**
 * @license
 * GreenPulse AI — Futuristic AI Sustainability Command Center Dashboard
 * Live ESG Gauges, Animated Carbon Emission Network, Hourly Load Analytics, Live AI Mission Feed,
 * Floating AI Recommendations Queue, and Interactive Net-Zero Simulation Sliders.
 */

import React, { useState, useEffect, useId, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { ScoreGaugeArc } from '../../components/ui/score-gauge-arc';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useMetricsStore, useUiStore } from '../../stores';
import {
  Leaf,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Check,
  X,
  Activity,
  Sliders,
  TrendingDown,
  TrendingUp,
  Globe2,
  AlertTriangle,
  RefreshCw,
  Building2,
  Layers,
  BarChart3,
  CheckCircle2,
  Cpu,
  Flame,
  Award,
  Radio,
  Clock,
  ChevronRight,
  Info
} from 'lucide-react';

import { AnimatedCounter } from '../../components/ui/animated-counter';

/* ==========================================================================
   SHARED MOTION PRIMITIVES, HOOKS & DECORATIVE ASSETS
   ========================================================================== */

/**
 * Custom hook for localized cursor spotlight within cards
 */
export const useCardCursorSpotlight = () => {
  const [pos, setPos] = useState({ x: 50, y: 50, active: false });

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y, active: true });
  };

  const onMouseLeave = () => {
    setPos(prev => ({ ...prev, active: false }));
  };

  return { pos, onMouseMove, onMouseLeave };
};

/**
 * Lightweight SVG technical circuit/grid overlay (purely decorative, zero layout shift)
 */
export const TechnicalGridPattern: React.FC<{ className?: string; opacity?: number }> = ({
  className = '',
  opacity = 0.035,
}) => {
  const patternId = useId();
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
      style={{ opacity }}
    >
      <svg className="w-full h-full" width="100%" height="100%">
        <defs>
          <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="#2ED9A3"
              strokeWidth="0.75"
              strokeDasharray="2 4"
            />
            <circle cx="0" cy="0" r="1" fill="#3FB6E8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
};

/**
 * One-time moving specular sweep on card entrance (runs once, then goes completely still)
 */
export const SpecularEntranceSweep: React.FC<{ delay?: number }> = ({ delay = 0.1 }) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      initial={{ x: '-150%', opacity: 0 }}
      animate={{ x: '250%', opacity: [0, 0.65, 0.8, 0] }}
      transition={{ duration: 0.95, delay, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-25deg] z-20"
    />
  );
};

/**
 * Hardware-accelerated 3D settle card entrance variants (shallow 7.5° tilt, opacity + transform only)
 */
export const create3DSettleVariant = (delay: number, reduceMotion: boolean | null) => {
  if (reduceMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: {
      opacity: 0,
      y: 20,
      rotateX: 6,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
    },
    transition: {
      duration: 0.45,
      delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  };
};

/* ==========================================================================
   1. GREEN SCORE HERO WIDGET (PRO)
   ========================================================================== */

const getSubScoreNumeric = (item: any): number => {
  if (typeof item === 'number') return item;
  if (item && typeof item === 'object' && typeof item.score === 'number') return item.score;
  return 0;
};

const getSubScoreSource = (item: any): string | null => {
  if (item && typeof item === 'object' && typeof item.source === 'string') return item.source;
  return null;
};

export const GreenScoreWidget: React.FC = () => {
  const { greenScore, fetchDashboardMetrics } = useMetricsStore();
  const reduceMotion = useReducedMotion();
  const [activeSubScore, setActiveSubScore] = useState<number | null>(null);
  const { pos: cursorLight, onMouseMove, onMouseLeave } = useCardCursorSpotlight();

  // Staged activation sequence:
  // Step 0 (0ms): hero card enters
  // Step 1 (100ms): gauge activates & arc draws
  // Step 2 (240ms): telemetry cables draw outward
  // Step 3 (480ms): verified status and insights settle
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    fetchDashboardMetrics();
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 240);
    const t3 = setTimeout(() => setStage(3), 480);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [fetchDashboardMetrics]);

  const heroMotion = create3DSettleVariant(0.04, reduceMotion);

  const tierRating = useMemo(() => {
    const s = greenScore.score;
    if (s >= 80) return { label: 'Tier 1 Rating', variant: 'emerald' as const };
    if (s >= 60) return { label: 'Tier 2 Rating', variant: 'cyan' as const };
    if (s >= 40) return { label: 'Tier 3 Rating', variant: 'warning' as const };
    return { label: 'Action Required', variant: 'neutral' as const };
  }, [greenScore.score]);

  const subScores = [
    {
      id: 0,
      label: 'Carbon Performance',
      value: getSubScoreNumeric(greenScore.breakdown?.carbonPerformance),
      source: getSubScoreSource(greenScore.breakdown?.carbonPerformance),
      color: '#2ED9A3',
      textColor: 'text-[#2ED9A3]',
      hoverBorder: 'group-hover:border-[#2ED9A3] group-hover:shadow-[0_0_20px_rgba(46,217,163,0.35)]',
      activeBorder: 'border-[#2ED9A3] shadow-[0_0_24px_rgba(46,217,163,0.45)]',
      glow: 'from-[#2ED9A3]/35 via-[#2ED9A3]/15',
      delay: 0.16,
    },
    {
      id: 1,
      label: 'Energy Efficiency',
      value: getSubScoreNumeric(greenScore.breakdown?.energyEfficiency),
      source: getSubScoreSource(greenScore.breakdown?.energyEfficiency),
      color: '#3FB6E8',
      textColor: 'text-[#3FB6E8]',
      hoverBorder: 'group-hover:border-[#3FB6E8] group-hover:shadow-[0_0_20px_rgba(63,182,232,0.35)]',
      activeBorder: 'border-[#3FB6E8] shadow-[0_0_24px_rgba(63,182,232,0.45)]',
      glow: 'from-[#3FB6E8]/35 via-[#3FB6E8]/15',
      delay: 0.24,
    },
    {
      id: 2,
      label: 'Waste Diversion',
      value: getSubScoreNumeric(greenScore.breakdown?.wasteManagement),
      source: getSubScoreSource(greenScore.breakdown?.wasteManagement),
      color: '#8B7FFF',
      textColor: 'text-[#8B7FFF]',
      hoverBorder: 'group-hover:border-[#8B7FFF] group-hover:shadow-[0_0_20px_rgba(139,127,255,0.35)]',
      activeBorder: 'border-[#8B7FFF] shadow-[0_0_24px_rgba(139,127,255,0.45)]',
      glow: 'from-[#8B7FFF]/35 via-[#8B7FFF]/15',
      delay: 0.32,
    },
    {
      id: 3,
      label: 'BRSR Compliance',
      value: getSubScoreNumeric(greenScore.breakdown?.complianceCompleteness),
      source: getSubScoreSource(greenScore.breakdown?.complianceCompleteness),
      color: '#F5A623',
      textColor: 'text-[#F5A623]',
      hoverBorder: 'group-hover:border-[#F5A623] group-hover:shadow-[0_0_20px_rgba(245,166,35,0.35)]',
      activeBorder: 'border-[#F5A623] shadow-[0_0_24px_rgba(245,166,35,0.45)]',
      glow: 'from-[#F5A623]/35 via-[#F5A623]/15',
      delay: 0.40,
    },
  ];

  return (
    <motion.div
      initial={heroMotion.initial}
      animate={heroMotion.animate}
      transition={heroMotion.transition}
      className="[perspective:1000px]"
    >
      {/* Ambient Halo behind Hero Score */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: reduceMotion ? 0.35 : [0.3, 0.5, 0.3],
          }}
          transition={
            reduceMotion
              ? { duration: 0.3 }
              : { duration: 5.2, repeat: Infinity, ease: 'easeInOut' }
          }
          className="pointer-events-none absolute -inset-1.5 rounded-[18px] bg-gradient-to-r from-[#2ED9A3]/25 via-[#3FB6E8]/20 to-[#8B7FFF]/20 blur-[32px] -z-10"
        />

        <Card
          variant="raised"
          hasAccentGlow
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="mb-6 p-6 border border-[#2ED9A3]/50 bg-[#12161F]/95 relative overflow-hidden group"
        >
          <TechnicalGridPattern opacity={0.04} />
          <SpecularEntranceSweep delay={0.06} />

          {/* Localized Cursor Spotlight Light */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-200 z-10 rounded-[inherit]"
            style={{
              opacity: cursorLight.active ? 1 : 0,
              background: `radial-gradient(320px circle at ${cursorLight.x}% ${cursorLight.y}%, rgba(46, 217, 163, 0.12), transparent 70%)`,
            }}
          />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            {/* Left Hero Dial & Title */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left flex-1">
              <div className="relative flex items-center justify-center">
                {/* Hero Glow Ring */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="relative"
                >
                  <ScoreGaugeArc score={greenScore.score} size="hero" />
                </motion.div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-semibold text-[#F4F6F8] font-display">
                    Enterprise Green Score
                  </h2>
                  <Badge variant={tierRating.variant}>{tierRating.label}</Badge>
                </div>
                <p className="text-xs text-[#8891A3] max-w-md leading-relaxed">
                  Real-time composite telemetry credit rating aligned with SEBI BRSR Principle 6 and GHG Protocol Corporate Standard.
                </p>

                {/* AI Insight Text Fades in Last */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 4 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex items-center gap-2 pt-1 font-data text-xs flex-wrap"
                >
                  <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-pulse" />
                  <span className="text-[#2ED9A3] font-medium">Verified by CEA Grid Telemetry</span>
                  <span className="text-[#8891A3]">•</span>
                  {greenScore.deltaMonth !== undefined && greenScore.deltaMonth !== 0 ? (
                    <span className={greenScore.deltaMonth > 0 ? "text-[#2ED9A3] flex items-center gap-0.5 font-medium" : "text-[#F5A623] flex items-center gap-0.5 font-medium"}>
                      {greenScore.deltaMonth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {greenScore.deltaMonth > 0 ? `+${greenScore.deltaMonth}` : greenScore.deltaMonth} MoM
                    </span>
                  ) : (
                    <span className="text-[#8891A3]">Baseline MoM</span>
                  )}
                  <span className="text-[#8891A3]">•</span>
                  <span className="text-[#8891A3]">
                    {greenScore.period ? `Period: ${greenScore.period}` : 'Updated Just Now'}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Right: 4 Contributing Sub-Scores Revealed with Sequential Telemetry */}
            <div className="relative w-full lg:w-auto flex items-center">
              {/* Prominent SVG Telemetry Conduits connecting Gauge to Sub-scores */}
              <div className="hidden lg:block absolute -left-10 top-0 bottom-0 w-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 40 140" fill="none">
                  {subScores.map((s, idx) => {
                    const yTarget = 24 + idx * 32;
                    const isDrawn = stage >= 2;
                    const isHovered = activeSubScore === s.id;

                    return (
                      <g key={s.id}>
                        {/* Animated conduit path */}
                        <motion.path
                          d={`M 0 70 C 20 70, 20 ${yTarget}, 40 ${yTarget}`}
                          stroke={s.color}
                          strokeWidth={isHovered ? '2.5' : '1.75'}
                          strokeOpacity={isHovered ? 1 : 0.65}
                          fill="none"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{
                            pathLength: isDrawn ? 1 : 0,
                            opacity: isDrawn ? (isHovered ? 1 : 0.7) : 0,
                          }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.45,
                            delay: s.delay,
                            ease: 'easeOut',
                          }}
                        />

                        {/* Connection node at start */}
                        <motion.circle
                          cx="0"
                          cy="70"
                          r="2.5"
                          fill={s.color}
                          initial={{ scale: 0 }}
                          animate={{ scale: isDrawn ? 1 : 0 }}
                          transition={{ delay: 0.1 }}
                        />

                        {/* Connection node at sub-score edge */}
                        <motion.circle
                          cx="39"
                          cy={yTarget}
                          r={isHovered ? 3.5 : 2.5}
                          fill={s.color}
                          initial={{ scale: 0 }}
                          animate={{ scale: isDrawn ? 1 : 0 }}
                          transition={{ delay: s.delay + 0.3 }}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full lg:w-auto text-center border-t lg:border-t-0 lg:border-l border-[#242B38] pt-4 lg:pt-0 lg:pl-6 [perspective:600px]">
                {subScores.map(sub => {
                  const subMotion = create3DSettleVariant(sub.delay, reduceMotion);
                  const isHovered = activeSubScore === sub.id;

                  return (
                    <motion.div
                      key={sub.id}
                      initial={subMotion.initial}
                      animate={subMotion.animate}
                      transition={subMotion.transition}
                      onMouseEnter={() => setActiveSubScore(sub.id)}
                      onMouseLeave={() => setActiveSubScore(null)}
                      className={`group relative z-0 transition-opacity duration-200 ${
                        activeSubScore !== null && !isHovered ? 'opacity-65' : 'opacity-100'
                      }`}
                    >
                      {/* Deep spotlight glow behind sub-score card */}
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute -inset-1.5 rounded-[12px] bg-gradient-to-br ${sub.glow} to-transparent blur-[14px] transition-opacity duration-300 ${
                          isHovered ? 'opacity-80' : 'opacity-0 group-hover:opacity-65'
                        }`}
                      />

                      <div
                        className={`p-3 rounded-[10px] bg-[#0A0E14]/90 border transition-all duration-200 min-w-[130px] ${
                          isHovered ? sub.activeBorder : `border-[#1A1F2A] ${sub.hoverBorder}`
                        }`}
                      >
                        <span className="text-[10px] uppercase text-[#8891A3] block font-data truncate">
                          {sub.label}
                        </span>

                        <div className="min-h-[24px] flex items-baseline justify-center gap-0.5 mt-1">
                          {stage < 1 ? (
                            <div className="w-14 h-5 rounded bg-[#171C27] animate-pulse" />
                          ) : (
                            <div className="flex items-baseline justify-center gap-0.5">
                              <AnimatedCounter
                                value={sub.value}
                                decimals={0}
                                className={`font-data font-bold text-base ${sub.textColor}`}
                              />
                              <span className="text-[10px] text-[#8891A3] font-data">/100</span>
                            </div>
                          )}
                        </div>

                        {sub.source === 'baseline_fallback' && (
                          <span
                            className="text-[9px] text-[#8891A3]/80 block font-data truncate mt-0.5"
                            title="Evaluated against baseline reference"
                          >
                            Baseline Reference
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

/* ==========================================================================
   2. LIVE ESG GAUGES WIDGET (SUMMARY KPI CARDS WITH FOCUS SYSTEM)
   ========================================================================== */
export const LiveEsgGauges: React.FC = () => {
  const {
    totalScope2Kg,
    totalEnergyKwh,
    brsrCompliancePct,
    carbonSummary,
    esgScore,
    wasteSummary,
    hasData,
  } = useMetricsStore();
  const reduceMotion = useReducedMotion();
  const [activeGauge, setActiveGauge] = useState<number | null>(null);

  // Staged reveal sequence (skeleton -> border/glow -> value count-up -> insights)
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 280);
    return () => clearTimeout(timer);
  }, []);

  // Card 0: Carbon Intensity / Scope 2
  const carbonIntensityValue =
    totalEnergyKwh > 0 ? parseFloat((totalScope2Kg / totalEnergyKwh).toFixed(2)) : null;

  // Card 1: Energy Load (Active)
  const energyLoadMwh =
    totalEnergyKwh > 0 ? parseFloat((totalEnergyKwh / 1000).toFixed(1)) : null;
  const activeDeptCount = carbonSummary?.departmentBreakdown?.length || 0;

  // Card 2: SEBI BRSR P6 Readiness
  const p6 = esgScore?.principles?.find((p) => p.number === 6);
  const hasEsgData = Boolean(
    esgScore && Array.isArray(esgScore.principles) && esgScore.principles.length > 0
  );
  const completedCount = esgScore?.summary?.complete ?? 0;

  // Card 3: Waste Diversion Rate
  const hasWasteData = Boolean(wasteSummary && wasteSummary.hasData && wasteSummary.totalKg > 0);

  const gauges = [
    {
      id: 0,
      title: 'Carbon Intensity',
      icon: <Leaf className="w-4 h-4" />,
      accentColor: '#2ED9A3',
      accentKey: 'emerald' as const,
      glowStyle: 'from-[#2ED9A3]/35 via-[#2ED9A3]/15',
      borderHover: 'hover:border-[#2ED9A3] hover:shadow-[0_0_24px_rgba(46,217,163,0.35)]',
      activeBorder: 'border-[#2ED9A3] shadow-[0_0_28px_rgba(46,217,163,0.4)]',
      iconBg: 'bg-[#2ED9A3]/15 text-[#2ED9A3]',
      value: carbonIntensityValue,
      decimals: 2,
      unit: 'kg CO₂e / kWh',
      footerLeft: carbonIntensityValue !== null ? (
        <span className="text-[#2ED9A3] flex items-center gap-1">
          Scope 2: {(totalScope2Kg / 1000).toFixed(1)} t
        </span>
      ) : (
        <span className="text-[#8891A3]">Scope 2: Awaiting Data</span>
      ),
      footerRight: (
        <span className="text-[#8891A3]" title="Scope 1 & Scope 3 direct activity data not yet ingested">
          Scope 1 & 3: Unavailable
        </span>
      ),
      delay: 0.32,
    },
    {
      id: 1,
      title: 'Energy Load (Active)',
      icon: <Zap className="w-4 h-4" />,
      accentColor: '#3FB6E8',
      accentKey: 'cyan' as const,
      glowStyle: 'from-[#3FB6E8]/35 via-[#3FB6E8]/15',
      borderHover: 'hover:border-[#3FB6E8] hover:shadow-[0_0_24px_rgba(63,182,232,0.35)]',
      activeBorder: 'border-[#3FB6E8] shadow-[0_0_28px_rgba(63,182,232,0.4)]',
      iconBg: 'bg-[#3FB6E8]/15 text-[#3FB6E8]',
      value: energyLoadMwh,
      decimals: 1,
      unit: 'MWh Ingested',
      footerLeft: energyLoadMwh !== null ? (
        <span className="text-[#3FB6E8] flex items-center gap-1">
          <Activity className="w-3 h-3 animate-pulse" />{' '}
          {carbonSummary?.latestPeriod ? `Period: ${carbonSummary.latestPeriod}` : 'Active'}
        </span>
      ) : (
        <span className="text-[#8891A3]">Awaiting Energy Data</span>
      ),
      footerRight: energyLoadMwh !== null ? (
        <span className="text-[#8891A3]">
          {activeDeptCount > 0 ? `${activeDeptCount} Department${activeDeptCount === 1 ? '' : 's'}` : 'All Facilities'}
        </span>
      ) : (
        <span className="text-[#8891A3]">--</span>
      ),
      delay: 0.40,
    },
    {
      id: 2,
      title: 'SEBI BRSR P6 Readiness',
      icon: <ShieldCheck className="w-4 h-4" />,
      accentColor: '#8B7FFF',
      accentKey: 'violet' as const,
      glowStyle: 'from-[#8B7FFF]/35 via-[#8B7FFF]/15',
      borderHover: 'hover:border-[#8B7FFF] hover:shadow-[0_0_24px_rgba(139,127,255,0.35)]',
      activeBorder: 'border-[#8B7FFF] shadow-[0_0_28px_rgba(139,127,255,0.4)]',
      iconBg: 'bg-[#8B7FFF]/15 text-[#8B7FFF]',
      value: hasEsgData ? brsrCompliancePct : null,
      decimals: 0,
      suffix: '%',
      unit: '9-Principle Core',
      footerLeft: hasEsgData ? (
        <span className="text-[#8B7FFF]">
          Principle 6: {p6?.coveragePercent ?? 0}% ({p6?.status === 'complete' ? 'Verified' : 'Partial'})
        </span>
      ) : (
        <span className="text-[#8891A3]">Awaiting Evaluation</span>
      ),
      footerRight: hasEsgData ? (
        <span className="text-[#8891A3]">
          {completedCount}/9 Principles Audited
        </span>
      ) : (
        <span className="text-[#8891A3]">--</span>
      ),
      delay: 0.48,
    },
    {
      id: 3,
      title: 'Waste Diversion Rate',
      icon: <Award className="w-4 h-4" />,
      accentColor: '#F5A623',
      accentKey: 'amber' as const,
      glowStyle: 'from-[#F5A623]/35 via-[#F5A623]/15',
      borderHover: 'hover:border-[#F5A623] hover:shadow-[0_0_24px_rgba(245,166,35,0.35)]',
      activeBorder: 'border-[#F5A623] shadow-[0_0_28px_rgba(245,166,35,0.4)]',
      iconBg: 'bg-[#F5A623]/15 text-[#F5A623]',
      value: hasWasteData ? wasteSummary!.recyclablePct : null,
      decimals: 1,
      suffix: '%',
      unit: 'Zero Landfill',
      footerLeft: hasWasteData ? (
        <span className="text-[#F5A623]">
          {wasteSummary!.recyclableKg} kg Recyclable
        </span>
      ) : (
        <span className="text-[#8891A3]">No Waste Records</span>
      ),
      footerRight: hasWasteData ? (
        <span className="text-[#8891A3]">
          Total: {wasteSummary!.totalKg} kg
        </span>
      ) : (
        <span className="text-[#8891A3]">--</span>
      ),
      delay: 0.56,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 [perspective:1000px]">
      {gauges.map(g => {
        const motionProps = create3DSettleVariant(g.delay, reduceMotion);
        const isActive = activeGauge === g.id;
        const isMuted = activeGauge !== null && !isActive;

        return (
          <KpiMetricCard
            key={g.id}
            gauge={g}
            motionProps={motionProps}
            isActive={isActive}
            isMuted={isMuted}
            isRevealed={isRevealed}
            onHover={() => setActiveGauge(g.id)}
            onLeave={() => setActiveGauge(null)}
          />
        );
      })}
    </div>
  );
};

const KpiMetricCard: React.FC<{
  gauge: any;
  motionProps: any;
  isActive: boolean;
  isMuted: boolean;
  isRevealed: boolean;
  onHover: () => void;
  onLeave: () => void;
}> = ({ gauge, motionProps, isActive, isMuted, isRevealed, onHover, onLeave }) => {
  const { pos: cursorLight, onMouseMove, onMouseLeave } = useCardCursorSpotlight();

  return (
    <motion.div
      initial={motionProps.initial}
      animate={motionProps.animate}
      transition={motionProps.transition}
      onMouseEnter={() => {
        onHover();
      }}
      onMouseLeave={() => {
        onMouseLeave();
        onLeave();
      }}
      onMouseMove={onMouseMove}
      className={`group relative [transform-style:preserve-3d] transition-all duration-300 ${
        isActive ? 'z-20 -translate-y-1 scale-[1.015]' : isMuted ? 'opacity-65 scale-[0.99] z-0' : 'opacity-100 z-0'
      }`}
    >
      {/* Deep ambient spotlight glow behind each card (active or hovered) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -inset-2 rounded-[16px] bg-gradient-to-br ${gauge.glowStyle} to-transparent blur-[20px] transition-opacity duration-300 ${
          isActive ? 'opacity-80' : 'opacity-0 group-hover:opacity-70'
        }`}
      />

      <Card
        variant="raised"
        accentColor={gauge.accentKey}
        className={`p-4 bg-[#12161F]/95 border space-y-3 relative overflow-hidden transition-all duration-300 ${
          isActive ? gauge.activeBorder : `border-[#242B38] ${gauge.borderHover}`
        }`}
      >
        <TechnicalGridPattern opacity={0.035} />
        <SpecularEntranceSweep delay={gauge.delay + 0.1} />

        {/* Localized Cursor Spotlight Light */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-200 z-10 rounded-[inherit]"
          style={{
            opacity: cursorLight.active ? 1 : 0,
            background: `radial-gradient(180px circle at ${cursorLight.x}% ${cursorLight.y}%, rgba(255, 255, 255, 0.08), transparent 75%)`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8891A3]">
            {gauge.title}
          </span>
          <div
            className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-transform duration-200 ${gauge.iconBg} ${
              isActive ? 'scale-110' : 'group-hover:scale-105'
            }`}
          >
            {gauge.icon}
          </div>
        </div>

        {/* Value / Metric Sequence */}
        <div className="relative z-10">
          <div className="flex items-baseline gap-1.5 min-h-[32px]">
            {!isRevealed ? (
              <div className="w-24 h-7 rounded bg-[#171C27] animate-pulse" />
            ) : gauge.value === null || gauge.value === undefined ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[#8891A3] font-data">--</span>
                <span className="text-xs text-[#8891A3] font-data">{gauge.unit}</span>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-baseline gap-1.5"
              >
                <AnimatedCounter
                  value={gauge.value}
                  decimals={gauge.decimals}
                  suffix={gauge.suffix}
                  className="text-2xl font-bold tracking-tight text-[#F4F6F8]"
                />
                <span className="text-xs text-[#8891A3] font-data">{gauge.unit}</span>
              </motion.div>
            )}
          </div>

          {/* AI Insight / Baseline Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isRevealed ? 1 : 0 }}
            transition={{ duration: 0.35, delay: gauge.delay + 0.25 }}
            className="flex items-center justify-between mt-2 pt-2 border-t border-[#1A1F2A] text-[11px] font-data"
          >
            {gauge.footerLeft}
            {gauge.footerRight}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};



/* ==========================================================================
   5. FLOATING AI RECOMMENDATION CARDS QUEUE
   ========================================================================== */

import { RecommendationService } from '../../services/recommendation-service';
import {
  formatBackendRecommendation,
  FormattedRecommendation,
} from '../../utils/recommendation-helpers';

export const FloatingAiRecommendationsQueue: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [activeRecId, setActiveRecId] = useState<string | null>(null);
  const [recs, setRecs] = useState<FormattedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<Record<string, 'approving' | 'dismissing'>>({});

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await RecommendationService.getRecommendations();
      const formatted = data.map(formatBackendRecommendation);
      setRecs(formatted);
    } catch (err: any) {
      console.error('Failed to load dashboard recommendations:', err);
      setError('Unable to load AI recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApprove = async (id: string) => {
    setActionInProgress((prev) => ({ ...prev, [id]: 'approving' }));
    try {
      const updated = await RecommendationService.updateRecommendationStatus(id, 'approved');
      const formatted = formatBackendRecommendation(updated);
      setRecs((prev) => prev.map((r) => (r.id === id ? formatted : r)));
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDismiss = async (id: string) => {
    setActionInProgress((prev) => ({ ...prev, [id]: 'dismissing' }));
    try {
      await RecommendationService.updateRecommendationStatus(id, 'dismissed');
      setRecs((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const pendingCount = recs.filter((r) => r.status === 'pending').length;
  const sectionMotion = create3DSettleVariant(0.96, reduceMotion);

  return (
    <motion.div
      initial={sectionMotion.initial}
      animate={sectionMotion.animate}
      transition={sectionMotion.transition}
      className="space-y-4 mb-6 [perspective:1000px]"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8891A3] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#8B7FFF]" /> Recommended Actions
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#2ED9A3] font-data">
            {isLoading
              ? 'Loading recommendations...'
              : pendingCount > 0
              ? `${pendingCount} suggestion${pendingCount === 1 ? '' : 's'} waiting for your review`
              : 'All suggestions reviewed'}
          </span>
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="text-xs text-[#8891A3] hover:text-[#2ED9A3] transition-colors p-1 cursor-pointer"
            title="Refresh recommendations"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="p-5 rounded-[12px] bg-[#12161F]/60 border border-[#242B38] space-y-3 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-[#1A1F2A] rounded" />
                <div className="h-4 w-24 bg-[#1A1F2A] rounded" />
              </div>
              <div className="h-4 w-3/4 bg-[#1A1F2A] rounded" />
              <div className="h-4 w-1/2 bg-[#1A1F2A] rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-[12px] bg-[#12161F]/80 border border-[#F0554C]/30 text-center space-y-3">
          <p className="text-xs text-[#F0554C]">{error}</p>
          <Button
            size="sm"
            onClick={fetchRecommendations}
            className="h-7 text-xs bg-[#2ED9A3] text-[#0A0E14] font-semibold"
          >
            Retry
          </Button>
        </div>
      ) : recs.length === 0 ? (
        <div className="p-8 rounded-[12px] bg-[#12161F]/60 border border-[#242B38] text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#171C27] flex items-center justify-center mx-auto text-[#8891A3]">
            <Sparkles className="w-5 h-5 text-[#8B7FFF]/70" />
          </div>
          <h4 className="text-sm font-semibold text-[#F4F6F8]">No recommendations yet</h4>
          <p className="text-xs text-[#8891A3] max-w-md mx-auto">
            GreenPulse will show actions when enough energy or sustainability data is available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {recs.map((rec, index) => {
              const cardDelay = 1.0 + index * 0.08;
              const itemMotion = create3DSettleVariant(cardDelay, reduceMotion);
              const isHovered = activeRecId === rec.id;
              const isMuted = activeRecId !== null && !isHovered;

              return (
                <RecommendationCardItem
                  key={rec.id}
                  rec={rec}
                  itemMotion={itemMotion}
                  cardDelay={cardDelay}
                  isHovered={isHovered}
                  isMuted={isMuted}
                  isApproving={actionInProgress[rec.id] === 'approving'}
                  isDismissing={actionInProgress[rec.id] === 'dismissing'}
                  onApprove={handleApprove}
                  onDismiss={handleDismiss}
                  onHover={() => setActiveRecId(rec.id)}
                  onLeave={() => setActiveRecId(null)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

const RecommendationCardItem: React.FC<{
  rec: FormattedRecommendation;
  itemMotion: any;
  cardDelay: number;
  isHovered: boolean;
  isMuted: boolean;
  isApproving: boolean;
  isDismissing: boolean;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onHover: () => void;
  onLeave: () => void;
}> = ({
  rec,
  itemMotion,
  cardDelay,
  isHovered,
  isMuted,
  isApproving,
  isDismissing,
  onApprove,
  onDismiss,
  onHover,
  onLeave,
}) => {
  const { pos: cursorLight, onMouseMove, onMouseLeave } = useCardCursorSpotlight();
  const isApproved = rec.status === 'approved';

  return (
    <motion.div
      layout
      initial={itemMotion.initial}
      animate={itemMotion.animate}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={itemMotion.transition}
      onMouseEnter={onHover}
      onMouseLeave={() => {
        onMouseLeave();
        onLeave();
      }}
      onMouseMove={onMouseMove}
      className={`relative transition-all duration-300 ${
        isHovered
          ? 'z-20 -translate-y-1 scale-[1.01]'
          : isMuted
          ? 'opacity-60 z-0'
          : 'opacity-100 z-0'
      }`}
    >
      {/* Soft ambient aura for hovered or approved recommendation */}
      <AnimatePresence>
        {(isHovered || isApproved) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-none absolute -inset-1.5 rounded-[14px] bg-gradient-to-r ${
              isApproved
                ? 'from-[#2ED9A3]/25 via-[#3FB6E8]/15'
                : 'from-[#8B7FFF]/25 via-[#2ED9A3]/15'
            } to-transparent blur-[16px] -z-10`}
          />
        )}
      </AnimatePresence>

      <div
        className={`p-4 sm:p-5 rounded-[12px] bg-[#12161F]/95 border transition-all duration-200 relative overflow-hidden ${
          isApproved
            ? 'border-[#2ED9A3]/60 bg-[#2ED9A3]/[0.03] shadow-lg'
            : isHovered
            ? 'border-[#8B7FFF] shadow-[0_0_24px_rgba(139,127,255,0.25)]'
            : 'border-[#242B38]'
        }`}
      >
        <TechnicalGridPattern opacity={0.025} />
        <SpecularEntranceSweep delay={cardDelay + 0.08} />

        {/* Localized Cursor Spotlight Light */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-200 z-10 rounded-[inherit]"
          style={{
            opacity: cursorLight.active ? 1 : 0,
            background: `radial-gradient(220px circle at ${cursorLight.x}% ${cursorLight.y}%, rgba(139, 127, 255, 0.1), transparent 75%)`,
          }}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-3 flex-1">
            {/* Top row: Category badge + Department (if provided) + Real Priority Score */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="violet" className="text-[10px] shrink-0">
                {rec.categoryLabel}
              </Badge>

              {rec.department && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-data bg-[#171C27] text-[#3FB6E8] border border-[#3FB6E8]/20">
                  <Building2 className="w-2.5 h-2.5" />
                  {rec.department}
                </span>
              )}

              {/* Real priority score from backend */}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-data font-semibold tracking-wide border ${
                  rec.priorityScore >= 75
                    ? 'bg-[#2ED9A3]/10 text-[#2ED9A3] border-[#2ED9A3]/30'
                    : rec.priorityScore >= 50
                    ? 'bg-[#3FB6E8]/10 text-[#3FB6E8] border-[#3FB6E8]/30'
                    : 'bg-[#8891A3]/10 text-[#8891A3] border-[#8891A3]/30'
                }`}
              >
                {rec.priorityLabel}
              </span>
            </div>

            {/* Plain language 3-part structure */}
            <div className="space-y-1.5 text-xs">
              <p className="text-[#8891A3] leading-relaxed">
                <span className="font-semibold text-[#CAD1DB] mr-1.5">What we found:</span>
                {rec.found}
              </p>
              <p className="text-[#F4F6F8] leading-relaxed font-medium">
                <span className="font-semibold text-[#2ED9A3] mr-1.5">What to do:</span>
                {rec.todo}
              </p>
              <p className="text-[#8891A3] leading-relaxed">
                <span className="font-semibold text-[#3FB6E8] mr-1.5">Why it matters:</span>
                {rec.matters}
              </p>
            </div>

            {/* Impact numbers — ONLY honest numbers, or "Impact estimate unavailable" */}
            <div className="flex items-center gap-6 pt-1 text-xs font-data">
              {rec.hasImpactData ? (
                <>
                  {rec.costSavingsFormatted && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] text-[#8891A3]">Est. Saving:</span>
                      <span className="text-[#2ED9A3] font-semibold tabular-nums">
                        {rec.costSavingsFormatted}
                      </span>
                    </div>
                  )}
                  {rec.co2ReductionFormatted && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] text-[#8891A3]">CO₂ Reduction:</span>
                      <span className="text-[#3FB6E8] font-semibold tabular-nums">
                        {rec.co2ReductionFormatted}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-[#8891A3] italic">
                  {rec.impactUnavailableText}
                </span>
              )}
            </div>
          </div>

          {/* Genuine two-state human-in-the-loop action controls */}
          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
            {!isApproved ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isApproving || isDismissing}
                  onClick={() => onDismiss(rec.id)}
                  className="h-8 px-3 text-xs font-data text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#1A1F2A] border border-transparent hover:border-[#242B38] transition-all cursor-pointer"
                >
                  {isDismissing && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  disabled={isApproving || isDismissing}
                  onClick={() => onApprove(rec.id)}
                  className="h-8 px-3.5 bg-[#2ED9A3] hover:bg-[#28c493] text-[#0A0E14] font-semibold shadow-[0_0_12px_rgba(46,217,163,0.25)] hover:shadow-[0_0_18px_rgba(46,217,163,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isApproving ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  Approve
                </Button>
              </>
            ) : (
              <span className="text-xs font-data font-semibold text-[#2ED9A3] flex items-center gap-1.5 bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 px-3 py-1.5 rounded-[6px]">
                <CheckCircle2 className="w-4 h-4 text-[#2ED9A3]" />
                ✓ Approved {rec.approvedAtFormatted ? `at ${rec.approvedAtFormatted}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};


/* Backwards Compatibility SummaryStrip export */
export const SummaryStrip: React.FC = () => {
  return <LiveEsgGauges />;
};

/* Backwards Compatibility RecommendationCardsQueue export */
export const RecommendationCardsQueue: React.FC = () => {
  return <FloatingAiRecommendationsQueue />;
};

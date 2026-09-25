/**
 * @license
 * GreenPulse AI — Waste Feature Components
 * Premium Circular-Economy Intelligence Instruments & Industrial Waste Stream Diversion.
 * Backend-backed from MongoDB WasteRecord via GET /api/v1/waste/summary.
 */

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Recycle, AlertTriangle, Leaf, Upload, PieChart, Layers, RefreshCw } from 'lucide-react';
import { WasteService } from '../../services/waste-service';
import { WasteSummary } from '../../types/domain';

/**
 * Animated decimal number component for smooth numerical count-ups on mount.
 */
const AnimatedDecimal: React.FC<{ value: number; decimals?: number; duration?: number }> = ({
  value,
  decimals = 1,
  duration = 750,
}) => {
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(
    reduceMotion ? value.toFixed(decimals) : (0).toFixed(decimals)
  );

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value.toFixed(decimals));
      return;
    }
    const startTime = performance.now();
    let animFrame: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Premium easeOutExpo curve
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = eased * value;
      setDisplayValue(current.toFixed(decimals));
      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [value, decimals, duration, reduceMotion]);

  return <span>{displayValue}</span>;
};

/**
 * Verified Real Diversion / Status pill replacing static hardcoded targets
 */
const VerifiedDiversionBadge: React.FC<{
  recyclablePct: number;
  hasData: boolean;
}> = ({ recyclablePct, hasData }) => {
  const reduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50, active: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y, active: true });
  };

  const displayText = hasData
    ? `${recyclablePct.toFixed(1)}% Recycled Diversion`
    : 'Awaiting Telemetry';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: reduceMotion ? 0 : 0.28,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -2,
              rotateX: 0.8,
              rotateY: -0.8,
              transition: { duration: 0.2, ease: 'easeOut' },
            }
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos((prev) => ({ ...prev, active: false }));
      }}
      className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12161F]/90 backdrop-blur-md border border-[#2ED9A3]/30 text-xs font-data text-[#2ED9A3] shadow-sm transition-all duration-200 select-none overflow-hidden self-start sm:self-auto cursor-default"
      style={{
        boxShadow: isHovered
          ? '0 0 16px -2px rgba(46, 217, 163, 0.25), 0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 2px 6px rgba(0, 0, 0, 0.2)',
        borderColor: isHovered ? 'rgba(46, 217, 163, 0.6)' : 'rgba(46, 217, 163, 0.3)',
      }}
    >
      {/* 1. Subtle Semantic Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[8px] -z-10"
        style={{
          background:
            'radial-gradient(80px circle at 50% 50%, rgba(46, 217, 163, 0.2), transparent 70%)',
        }}
      />

      {/* 2. Cursor Spotlight Layer */}
      {mousePos.active && !reduceMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-full opacity-100 transition-opacity duration-200 z-0"
          style={{
            background: `radial-gradient(70px circle at ${mousePos.x}% ${mousePos.y}%, rgba(46, 217, 163, 0.2), transparent 75%)`,
          }}
        />
      )}

      {/* 3. One Diagonal Specular Glass Sweep on Hover */}
      {!reduceMotion && isHovered && (
        <motion.div
          aria-hidden="true"
          initial={{ x: '-160%', opacity: 0 }}
          animate={{ x: '240%', opacity: [0, 0.35, 0.45, 0] }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-0 w-full h-full skew-x-[-25deg] z-10"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(46, 217, 163, 0.25), transparent)',
          }}
        />
      )}

      {/* Recycle/Telemetry Icon */}
      <span className="relative flex items-center justify-center shrink-0 z-10 text-[#2ED9A3]">
        <Recycle className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
      </span>

      {/* Text Label */}
      <span className="relative z-10 font-semibold tracking-wide text-[#F4F6F8] group-hover:text-[#2ED9A3] transition-colors duration-200">
        {displayText}
      </span>
    </motion.div>
  );
};

interface SubcategoryItem {
  label: string;
  quantityKg: number;
}

interface WasteKpiCardProps {
  id: string;
  title: string;
  value: number;
  percentage: number;
  unit: string;
  color: string;
  bgTint: string;
  reflectionGradient: string;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
  subcategories: SubcategoryItem[];
}

const WasteKpiCard: React.FC<WasteKpiCardProps> = ({
  title,
  value,
  percentage,
  unit,
  color,
  bgTint,
  reflectionGradient,
  icon: Icon,
  index,
  subcategories,
}) => {
  const reduceMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50, active: false });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y, active: true });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.38,
        delay: reduceMotion ? 0 : index * 0.07,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -3,
              rotateX: 1,
              rotateY: -1,
              transition: { duration: 0.2, ease: 'easeOut' },
            }
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-[10px] sm:rounded-[12px] bg-[#12161F]/90 backdrop-blur-md border border-[#242B38] p-4 sm:p-5 transition-all duration-200 overflow-hidden flex flex-col justify-between ${bgTint}`}
      style={{
        borderColor: isHovered ? `${color}80` : undefined,
        boxShadow: isHovered
          ? `0 10px 24px -4px rgba(0,0,0,0.5), 0 0 20px -4px ${color}25`
          : '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {/* 1. Subtle Semantic Edge Glow pool behind card on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[1px] rounded-[13px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[12px] -z-10"
        style={{
          background: `radial-gradient(160px circle at 50% 0%, ${color}25, transparent 70%)`,
        }}
      />

      {/* 2. Cursor Spotlight Layer */}
      {mousePos.active && !reduceMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-[12px] opacity-100 transition-opacity duration-200 z-0"
          style={{
            background: `radial-gradient(160px circle at ${mousePos.x}% ${mousePos.y}%, ${color}15, transparent 75%)`,
          }}
        />
      )}

      {/* 3. One Diagonal Specular Glass Sweep on Hover */}
      {!reduceMotion && isHovered && (
        <motion.div
          aria-hidden="true"
          initial={{ x: '-160%', opacity: 0 }}
          animate={{ x: '240%', opacity: [0, 0.35, 0.45, 0] }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-0 w-full h-full skew-x-[-25deg] z-10"
          style={{
            background: reflectionGradient,
          }}
        />
      )}

      {/* Top row: Label & Semantic Icon */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8891A3] font-display truncate">
            {title}
          </span>
          <div
            className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 border transition-all duration-200 group-hover:scale-105"
            style={{
              backgroundColor: `${color}15`,
              color,
              borderColor: isHovered ? `${color}60` : `${color}30`,
              boxShadow: isHovered ? `0 0 10px ${color}40` : 'none',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Numerical Value & Unit */}
        <div className="flex items-baseline gap-1.5 mt-1 sm:mt-2">
          <span
            className="font-data text-2xl sm:text-3xl font-bold tracking-tight tabular-nums transition-colors duration-200"
            style={{ color }}
          >
            <AnimatedDecimal value={value} decimals={value % 1 === 0 ? 0 : 1} />
          </span>
          <span className="text-xs font-semibold text-[#8891A3] font-data">
            {unit}
          </span>
          <span className="ml-auto text-[11px] font-semibold font-data px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.03] text-[#8891A3]">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Subcategories Breakdown List */}
      <div className="relative z-10 mt-4 pt-3 border-t border-[#242B38]/60 space-y-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8891A3]/80 font-display mb-1 flex items-center justify-between">
          <span>Subcategory</span>
          <span>Actual kg</span>
        </div>
        {subcategories.map((sub) => (
          <div
            key={sub.label}
            className="flex items-center justify-between text-xs py-0.5 text-[#F4F6F8]/90 font-data hover:text-white transition-colors"
          >
            <span className="text-[#8891A3] truncate text-[11px]">{sub.label}</span>
            <span className="font-medium tabular-nums text-[12px]">
              {sub.quantityKg.toLocaleString()} kg
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const WasteStreamAnalytics: React.FC = () => {
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WasteService.getWasteSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load waste stream summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const hasRealData = Boolean(summary && summary.hasData && summary.totalKg > 0);

  // Subcategory data mappings
  const recyclableSubcategories: SubcategoryItem[] = [
    { label: 'Plastic', quantityKg: summary?.subcategories.Plastic ?? 0 },
    { label: 'Paper', quantityKg: summary?.subcategories.Paper ?? 0 },
    { label: 'Aluminium', quantityKg: summary?.subcategories.Aluminium ?? 0 },
    { label: 'Steel', quantityKg: summary?.subcategories.Steel ?? 0 },
    { label: 'Rubber', quantityKg: summary?.subcategories.Rubber ?? 0 },
  ];

  const hazardousSubcategories: SubcategoryItem[] = [
    { label: 'Used Oil', quantityKg: summary?.subcategories['Used Oil'] ?? 0 },
    { label: 'Chemical Bottles', quantityKg: summary?.subcategories['Chemical Bottles'] ?? 0 },
  ];

  const organicSubcategories: SubcategoryItem[] = [
    { label: 'Food Waste', quantityKg: summary?.subcategories['Food Waste'] ?? 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative max-w-6xl w-full space-y-5"
    >
      <Card
        variant="surface"
        className="p-5 sm:p-7 rounded-[14px] bg-[#0E121A]/85 backdrop-blur-xl border border-[#242B38]/80 shadow-[0_8px_32px_rgba(0,0,0,0.36)]"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-[#F4F6F8] font-display tracking-tight">
              Industrial Waste Stream Diversion
            </h3>
            <p className="text-xs text-[#8891A3] mt-0.5">
              Deterministic material telemetry verified from uploaded operations logs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSummary}
              disabled={loading}
              title="Refresh telemetry"
              className="p-1.5 rounded-lg border border-[#242B38] text-[#8891A3] hover:text-[#F4F6F8] hover:border-[#2ED9A3]/40 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <VerifiedDiversionBadge
              recyclablePct={summary?.recyclablePct ?? 0}
              hasData={hasRealData}
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="py-8 space-y-4">
            <div className="h-16 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-[#F05D5E]/10 border border-[#F05D5E]/30 text-xs text-[#F05D5E] flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchSummary}
              className="underline font-semibold hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !hasRealData && (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#2ED9A3]/10 border border-[#2ED9A3]/25 flex items-center justify-center text-[#2ED9A3] mb-4 shadow-[0_0_24px_rgba(46,217,163,0.15)]">
              <Recycle className="w-7 h-7" />
            </div>
            <h4 className="text-base sm:text-lg font-semibold text-[#F4F6F8] font-display">
              No waste telemetry uploaded yet
            </h4>
            <p className="text-sm text-[#8891A3] max-w-md mt-1.5 mb-6 leading-relaxed">
              Upload a CSV/XLSX containing waste data to activate Waste Intelligence.
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/onboarding');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2ED9A3] hover:bg-[#26b889] text-[#0A0D14] font-semibold text-xs font-display shadow-md transition-all duration-200 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Telemetry Data
            </button>
          </div>
        )}

        {/* Populated Real Data View */}
        {!loading && !error && hasRealData && summary && (
          <div className="space-y-6">
            {/* Total Waste Highlight Banner */}
            <div className="rounded-xl bg-[#12161F]/90 border border-[#242B38] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 flex items-center justify-center text-[#2ED9A3]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8891A3] font-display">
                    Total Industrial Waste Generated
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-data text-2xl sm:text-3xl font-bold text-[#F4F6F8] tabular-nums">
                      {summary.totalKg.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-[#8891A3] font-data">
                      kg ({(summary.totalKg / 1000).toFixed(2)} Tonnes)
                    </span>
                  </div>
                </div>
              </div>

              {/* Proportional Stacked Progress Bar */}
              <div className="flex-1 max-w-md space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-data text-[#8891A3]">
                  <span>Category Distribution</span>
                  <span className="text-[#F4F6F8]">{summary.recordsCount} records logged</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#1A202C] overflow-hidden flex">
                  {summary.recyclablePct > 0 && (
                    <div
                      style={{ width: `${summary.recyclablePct}%` }}
                      className="h-full bg-[#2ED9A3] transition-all duration-500"
                      title={`Recyclable: ${summary.recyclablePct}%`}
                    />
                  )}
                  {summary.hazardousPct > 0 && (
                    <div
                      style={{ width: `${summary.hazardousPct}%` }}
                      className="h-full bg-[#F5A623] transition-all duration-500"
                      title={`Hazardous: ${summary.hazardousPct}%`}
                    />
                  )}
                  {summary.organicPct > 0 && (
                    <div
                      style={{ width: `${summary.organicPct}%` }}
                      className="h-full bg-[#3FB6E8] transition-all duration-500"
                      title={`Organic: ${summary.organicPct}%`}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-data text-[#8891A3]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#2ED9A3]" /> Recyclable (
                    {summary.recyclablePct.toFixed(1)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#F5A623]" /> Hazardous (
                    {summary.hazardousPct.toFixed(1)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#3FB6E8]" /> Organic (
                    {summary.organicPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Main Category KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
              <WasteKpiCard
                id="recyclable"
                title="Recyclable Waste"
                value={summary.recyclableKg}
                percentage={summary.recyclablePct}
                unit="kg"
                color="#2ED9A3"
                bgTint="bg-[#2ED9A3]/[0.02]"
                reflectionGradient="linear-gradient(to right, transparent, rgba(46, 217, 163, 0.18), transparent)"
                icon={Recycle}
                index={0}
                subcategories={recyclableSubcategories}
              />
              <WasteKpiCard
                id="hazardous"
                title="Hazardous Waste"
                value={summary.hazardousKg}
                percentage={summary.hazardousPct}
                unit="kg"
                color="#F5A623"
                bgTint="bg-[#F5A623]/[0.02]"
                reflectionGradient="linear-gradient(to right, transparent, rgba(245, 166, 35, 0.18), transparent)"
                icon={AlertTriangle}
                index={1}
                subcategories={hazardousSubcategories}
              />
              <WasteKpiCard
                id="organic"
                title="Organic Waste"
                value={summary.organicKg}
                percentage={summary.organicPct}
                unit="kg"
                color="#3FB6E8"
                bgTint="bg-[#3FB6E8]/[0.02]"
                reflectionGradient="linear-gradient(to right, transparent, rgba(63, 182, 232, 0.18), transparent)"
                icon={Leaf}
                index={2}
                subcategories={organicSubcategories}
              />
            </div>

            {/* Category Breakdown & Period Intelligence */}
            {summary.periods && summary.periods.length > 0 && (
              <div className="rounded-xl bg-[#12161F]/60 border border-[#242B38]/80 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#2ED9A3]" />
                    <h4 className="text-xs sm:text-sm font-semibold text-[#F4F6F8] font-display">
                      Period Breakdown & Longitudinal Flow
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#8891A3] font-data">
                    {summary.periods.length} logged period(s)
                  </span>
                </div>
                <div className="space-y-3">
                  {summary.periods.map((p) => (
                    <div
                      key={p.period}
                      className="p-3 rounded-lg bg-[#0E121A]/80 border border-[#242B38]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 font-data font-semibold text-[#F4F6F8]">
                          {p.period}
                        </span>
                        <span className="text-[#8891A3] font-data">
                          Total:{' '}
                          <strong className="text-white font-semibold tabular-nums">
                            {p.totalKg.toLocaleString()} kg
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-data text-[#8891A3]">
                        <span className="text-[#2ED9A3]">
                          Recyclable: {p.recyclableKg.toLocaleString()} kg
                        </span>
                        <span className="text-[#F5A623]">
                          Hazardous: {p.hazardousKg.toLocaleString()} kg
                        </span>
                        <span className="text-[#3FB6E8]">
                          Organic: {p.organicKg.toLocaleString()} kg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

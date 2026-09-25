/**
 * @license
 * GreenPulse AI — Scope Intelligence Kinetic Typography Sequence
 * Scroll-Driven Convergence: SCOPE 1 + SCOPE 2 + SCOPE 3 → ONE GREEN SCORE
 */

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { LuminousTechGrid } from '../../components/motion/motion-components';
import { Leaf, Award, Zap, Factory, Truck, Sparkles, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/utils';

export const ScopeKineticSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Scroll Progress within the section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Scope 1 Transforms
  const scope1Opacity = useTransform(scrollYProgress, [0, 0.1, 0.25, 0.35], [0, 1, 1, 0.2]);
  const scope1Scale = useTransform(scrollYProgress, [0, 0.15, 0.35], [0.6, 1.1, 0.85]);
  const scope1X = useTransform(scrollYProgress, [0, 0.15, 0.35], [-60, 0, -120]);
  const scope1Y = useTransform(scrollYProgress, [0.35, 0.65], [0, -80]);

  // Scope 2 Transforms
  const scope2Opacity = useTransform(scrollYProgress, [0.2, 0.3, 0.45, 0.55], [0, 1, 1, 0.2]);
  const scope2Scale = useTransform(scrollYProgress, [0.2, 0.35, 0.55], [0.6, 1.1, 0.85]);
  const scope2X = useTransform(scrollYProgress, [0.2, 0.35, 0.55], [60, 0, 120]);
  const scope2Y = useTransform(scrollYProgress, [0.35, 0.65], [0, -80]);

  // Scope 3 Transforms
  const scope3Opacity = useTransform(scrollYProgress, [0.4, 0.5, 0.62, 0.7], [0, 1, 1, 0.2]);
  const scope3Scale = useTransform(scrollYProgress, [0.4, 0.55, 0.7], [0.6, 1.1, 0.85]);
  const scope3Y = useTransform(scrollYProgress, [0.4, 0.55, 0.7], [60, 0, 100]);

  // Convergence Phase: SCOPE 1, 2, 3 merge towards center
  const convergenceProgress = useTransform(scrollYProgress, [0.65, 0.82], [0, 1]);
  const scopesMergeOpacity = useTransform(scrollYProgress, [0.65, 0.78, 0.82], [1, 0.5, 0]);

  // Final Target: "ONE GREEN SCORE"
  const greenScoreOpacity = useTransform(scrollYProgress, [0.75, 0.85, 1], [0, 1, 1]);
  const greenScoreScale = useTransform(scrollYProgress, [0.75, 0.88, 1], [0.5, 1.05, 1]);
  const greenScoreGlow = useTransform(scrollYProgress, [0.82, 0.9, 1], [0, 1, 0.8]);

  // SVG Line Draw Progress
  const lineDashoffset = useTransform(scrollYProgress, [0.6, 0.82], [400, 0]);

  if (reduce) {
    return (
      <section className="py-20 px-4 max-w-5xl mx-auto text-center border-t border-[#1A1F2A]">
        <span className="text-xs font-mono uppercase tracking-widest text-[#2ED9A3] block mb-2">
          Scope Intelligence Convergence
        </span>
        <h2 className="text-4xl sm:text-6xl font-extrabold text-[#F4F6F8] font-display mb-4">
          Scope 1 + Scope 2 + Scope 3 = <span className="text-[#2ED9A3]">ONE GREEN SCORE</span>
        </h2>
        <p className="text-sm text-[#8891A3] max-w-xl mx-auto">
          Unified enterprise carbon intelligence consolidating direct combustion, purchased energy, and supply chain telemetry into a single credit score rating.
        </p>
      </section>
    );
  }

  return (
    <div ref={containerRef} className="relative h-[220vh] border-t border-[#1A1F2A]">
      {/* Sticky Fullscreen Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0A0E14] select-none">
        <LuminousTechGrid />

        {/* Ambient Radial Backdrop Glow */}
        <motion.div
          style={{ opacity: greenScoreGlow }}
          className="absolute w-[500px] h-[500px] rounded-full bg-radial from-[#2ED9A3]/30 via-[#3FB6E8]/15 to-transparent blur-[100px] pointer-events-none z-0"
        />

        {/* Top Header Tag */}
        <div className="absolute top-12 z-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12161F]/90 border border-[#2ED9A3]/30 text-xs font-semibold text-[#2ED9A3] shadow-lg backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            Environmental Data → Unified Intelligence
          </div>
          <p className="text-[11px] font-mono text-[#8891A3] mt-2 flex items-center justify-center gap-1">
            Scroll to converge operational streams <ArrowDown className="w-3 h-3 animate-bounce" />
          </p>
        </div>

        {/* SVG Converging Laser Lines Layer */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 800">
            <defs>
              <linearGradient id="scopeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2ED9A3" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3FB6E8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8B7FFF" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Path 1: Scope 1 (Left) -> Center */}
            <motion.path
              d="M 200 280 Q 350 350 500 400"
              fill="none"
              stroke="url(#scopeLineGrad)"
              strokeWidth="2.5"
              strokeDasharray="400"
              style={{ strokeDashoffset: lineDashoffset, opacity: convergenceProgress }}
            />

            {/* Path 2: Scope 2 (Right) -> Center */}
            <motion.path
              d="M 800 280 Q 650 350 500 400"
              fill="none"
              stroke="url(#scopeLineGrad)"
              strokeWidth="2.5"
              strokeDasharray="400"
              style={{ strokeDashoffset: lineDashoffset, opacity: convergenceProgress }}
            />

            {/* Path 3: Scope 3 (Bottom) -> Center */}
            <motion.path
              d="M 500 580 L 500 400"
              fill="none"
              stroke="url(#scopeLineGrad)"
              strokeWidth="2.5"
              strokeDasharray="400"
              style={{ strokeDashoffset: lineDashoffset, opacity: convergenceProgress }}
            />
          </svg>
        </div>

        {/* SCOPE 1 DISPLAY BLOCK */}
        <motion.div
          style={{
            opacity: scope1Opacity,
            scale: scope1Scale,
            x: scope1X,
            y: scope1Y,
          }}
          className="absolute top-1/4 left-8 sm:left-24 z-20 flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 rounded-[12px] bg-[#2ED9A3]/10 border border-[#2ED9A3]/40 flex items-center justify-center text-[#2ED9A3] shadow-xl backdrop-blur-md">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#2ED9A3] block">
              DIRECT COMBUSTION
            </span>
            <h2 className="text-4xl sm:text-7xl font-extrabold text-[#F4F6F8] font-display tracking-tight leading-none">
              SCOPE 1
            </h2>
            <p className="text-xs text-[#8891A3] mt-1">Furnaces, Boiler Fuel, Corporate Fleet</p>
          </div>
        </motion.div>

        {/* SCOPE 2 DISPLAY BLOCK */}
        <motion.div
          style={{
            opacity: scope2Opacity,
            scale: scope2Scale,
            x: scope2X,
            y: scope2Y,
          }}
          className="absolute top-1/4 right-8 sm:right-24 z-20 flex items-center gap-4 text-right flex-row-reverse"
        >
          <div className="w-12 h-12 rounded-[12px] bg-[#3FB6E8]/10 border border-[#3FB6E8]/40 flex items-center justify-center text-[#3FB6E8] shadow-xl backdrop-blur-md">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#3FB6E8] block">
              INDIRECT ENERGY
            </span>
            <h2 className="text-4xl sm:text-7xl font-extrabold text-[#F4F6F8] font-display tracking-tight leading-none">
              SCOPE 2
            </h2>
            <p className="text-xs text-[#8891A3] mt-1">Grid Electricity, Purchased Cooling & Steam</p>
          </div>
        </motion.div>

        {/* SCOPE 3 DISPLAY BLOCK */}
        <motion.div
          style={{
            opacity: scope3Opacity,
            scale: scope3Scale,
            y: scope3Y,
          }}
          className="absolute bottom-1/4 z-20 flex items-center gap-4 text-center flex-col"
        >
          <div className="w-12 h-12 rounded-[12px] bg-[#8B7FFF]/10 border border-[#8B7FFF]/40 flex items-center justify-center text-[#8B7FFF] shadow-xl backdrop-blur-md">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8B7FFF] block">
              VALUE CHAIN
            </span>
            <h2 className="text-4xl sm:text-7xl font-extrabold text-[#F4F6F8] font-display tracking-tight leading-none">
              SCOPE 3
            </h2>
            <p className="text-xs text-[#8891A3] mt-1">Vendor Sludge, Logistics, Upstream Scrap</p>
          </div>
        </motion.div>

        {/* CONVERGED TARGET: "ONE GREEN SCORE" */}
        <motion.div
          style={{
            opacity: greenScoreOpacity,
            scale: greenScoreScale,
          }}
          className="relative z-30 max-w-3xl px-4 text-center flex flex-col items-center justify-center"
        >
          {/* Luminous Illuminated Badge Header */}
          <motion.div
            style={{ opacity: greenScoreGlow }}
            className="w-20 h-20 rounded-full aurora-gradient-bg flex items-center justify-center mb-6 shadow-2xl shadow-[#2ED9A3]/50 relative"
          >
            <Award className="w-10 h-10 text-[#0A0E14]" />
            <span className="absolute inset-0 rounded-full border-2 border-[#2ED9A3] animate-ping opacity-50" />
          </motion.div>

          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#2ED9A3] block mb-2">
            UNIFIED ENTERPRISE RATING
          </span>

          <h2 className="text-5xl sm:text-8xl font-black text-[#F4F6F8] font-display tracking-tight leading-none mb-4 drop-shadow-2xl">
            ONE <span className="text-[#2ED9A3]">GREEN SCORE</span>
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="px-4 py-2 rounded-xl bg-[#12161F]/90 border border-[#2ED9A3]/40 text-xs font-data font-bold text-[#2ED9A3] backdrop-blur-md">
              RATING: 84 / 100 GRADE A
            </div>
            <div className="px-4 py-2 rounded-xl bg-[#12161F]/90 border border-[#8B7FFF]/40 text-xs font-data font-bold text-[#8B7FFF] backdrop-blur-md">
              AUDIT CERTIFIED: SEBI BRSR & CSRD
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

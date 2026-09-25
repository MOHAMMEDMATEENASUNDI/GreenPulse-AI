/**
 * @license
 * GreenPulse AI — Understanding → Impact Scroll Narrative
 * Continuous Transformation: REAL-WORLD DATA → GREENPULSE INTELLIGENCE → PROJECTED IMPACT
 */

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { LuminousTechGrid } from '../../components/motion/motion-components';
import {
  Zap,
  Leaf,
  Building2,
  ShieldCheck,
  Bot,
  ArrowRight,
  TrendingDown,
  DollarSign,
  FileCheck2,
  Sparkles,
  Award,
  BarChart3,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { cn } from '../../utils/utils';

export const UnderstandActSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [manualStage, setManualStage] = useState<'understand' | 'impact' | null>(null);

  // Card cursor 3D tilt & hotspot state
  const [cardHover, setCardHover] = useState({
    isHovered: false,
    x: 0,
    y: 0,
    tiltX: 0,
    tiltY: 0,
  });

  // Scroll Progress across section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Stage 1: Data Telemetry Ingestion (0.0 -> 0.45)
  const stage1Opacity = useTransform(scrollYProgress, [0, 0.1, 0.38, 0.52], [0, 1, 1, 0.15]);
  const stage1Scale = useTransform(scrollYProgress, [0, 0.15, 0.38, 0.52], [0.9, 1, 1, 0.85]);

  // Intelligence Core Pulsing (0.35 -> 0.65)
  const coreScale = useTransform(scrollYProgress, [0, 0.35, 0.5, 0.68, 1], [0.85, 1, 1.2, 0.9, 0.9]);
  const coreGlow = useTransform(scrollYProgress, [0.35, 0.5, 0.7], [0.2, 1, 0.4]);

  // Stage 2: Projected Impact Card Emergence (0.52 -> 1.0)
  const impactOpacity = useTransform(scrollYProgress, [0.48, 0.6, 0.95, 1], [0, 1, 1, 1]);
  const impactScale = useTransform(scrollYProgress, [0.48, 0.65, 0.95, 1], [0.82, 1.02, 1, 1]);
  const impactY = useTransform(scrollYProgress, [0.48, 0.65], [50, 0]);

  // Laser particles progress
  const particleDash = useTransform(scrollYProgress, [0.1, 0.4], [300, 0]);
  const outParticleDash = useTransform(scrollYProgress, [0.5, 0.8], [300, 0]);

  // Specular light sweep position
  const sweepX = useTransform(scrollYProgress, [0.58, 0.82], ['-100%', '200%']);

  // Handle subtle 3D tilt & cursor light source (max 4deg)
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Constrain tilt between -4deg and +4deg
    const tiltX = Math.min(Math.max(((y - centerY) / centerY) * -4, -4), 4);
    const tiltY = Math.min(Math.max(((x - centerX) / centerX) * 4, -4), 4);

    setCardHover({
      isHovered: true,
      x,
      y,
      tiltX,
      tiltY,
    });
  };

  const handleCardMouseLeave = () => {
    setCardHover({
      isHovered: false,
      x: 0,
      y: 0,
      tiltX: 0,
      tiltY: 0,
    });
  };

  return (
    <div ref={containerRef} className="relative h-[240vh] border-t border-[#1A1F2A]">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0A0E14] select-none px-4">
        <LuminousTechGrid />

        {/* Central Core Ambient Backdrop Glow */}
        <motion.div
          style={{ opacity: coreGlow }}
          className="absolute w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full bg-radial from-[#2ED9A3]/25 via-[#3FB6E8]/15 to-transparent blur-[100px] pointer-events-none z-0"
        />

        {/* Top Floating Stage Switcher & Telemetry Header */}
        <div className="absolute top-8 z-30 text-center flex flex-col items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12161F]/90 border border-[#2ED9A3]/30 text-xs font-mono font-medium text-[#2ED9A3] shadow-xl backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#2ED9A3]" />
            REAL-WORLD DATA → GREENPULSE INTELLIGENCE → PROJECTED IMPACT
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#10141D] border border-[#1E2638]">
            <button
              onClick={() => setManualStage('understand')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                manualStage === 'understand' || !manualStage
                  ? 'bg-[#2ED9A3] text-[#0A0E14] shadow-md shadow-[#2ED9A3]/20'
                  : 'text-[#8891A3] hover:text-[#F4F6F8]'
              )}
            >
              1. Telemetry Ingestion
            </button>
            <button
              onClick={() => setManualStage('impact')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                manualStage === 'impact'
                  ? 'bg-[#3FB6E8] text-[#0A0E14] shadow-md shadow-[#3FB6E8]/20'
                  : 'text-[#8891A3] hover:text-[#F4F6F8]'
              )}
            >
              2. Projected Impact
            </button>
          </div>
        </div>

        {/* SVG Particle Paths Connecting Inputs -> Central Engine -> Impact Card */}
        <div className="absolute inset-0 pointer-events-none z-10 hidden md:block">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 700">
            <defs>
              <linearGradient id="inFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2ED9A3" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3FB6E8" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="outFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3FB6E8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2ED9A3" stopOpacity="0.9" />
              </linearGradient>

              <filter id="particleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Ingestion Stream Vectors (4 Corners -> Center Core 500, 350) */}
            <motion.path
              d="M 180 180 L 500 350"
              fill="none"
              stroke="url(#inFlowGrad)"
              strokeWidth="2"
              strokeDasharray="8 8"
              style={{ strokeDashoffset: particleDash }}
            />
            <motion.path
              d="M 820 180 L 500 350"
              fill="none"
              stroke="url(#inFlowGrad)"
              strokeWidth="2"
              strokeDasharray="8 8"
              style={{ strokeDashoffset: particleDash }}
            />
            <motion.path
              d="M 180 520 L 500 350"
              fill="none"
              stroke="url(#inFlowGrad)"
              strokeWidth="2"
              strokeDasharray="8 8"
              style={{ strokeDashoffset: particleDash }}
            />
            <motion.path
              d="M 820 520 L 500 350"
              fill="none"
              stroke="url(#inFlowGrad)"
              strokeWidth="2"
              strokeDasharray="8 8"
              style={{ strokeDashoffset: particleDash }}
            />

            {/* Traveling Emerald Light Particles */}
            {!reduce && (
              <>
                <circle r="4" fill="#2ED9A3" filter="url(#particleGlow)">
                  <animateMotion path="M 180 180 L 500 350" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle r="4" fill="#3FB6E8" filter="url(#particleGlow)">
                  <animateMotion path="M 820 180 L 500 350" dur="3.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}
          </svg>
        </div>

        {/* CENTRAL INTELLIGENCE NODE */}
        <motion.div
          style={{ scale: coreScale }}
          className="relative z-20 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-[#121824] border-2 border-[#2ED9A3] flex flex-col items-center justify-center shadow-2xl shadow-[#2ED9A3]/30 p-3 text-center mb-4"
        >
          <div className="w-10 h-10 rounded-full aurora-gradient-bg flex items-center justify-center mb-1 shadow-lg shadow-[#2ED9A3]/40">
            <Bot className="w-5 h-5 text-[#0A0E14]" />
          </div>
          <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#2ED9A3] block">
            GREENPULSE AI
          </span>
          <span className="text-[11px] font-extrabold text-[#F4F6F8] font-display leading-none">
            INTELLIGENCE CORE
          </span>
          <span className="absolute inset-0 rounded-full border border-[#2ED9A3]/30 animate-ping pointer-events-none" />
        </motion.div>

        {/* STAGE 1: TELEMETRY INGESTION NODES */}
        <motion.div
          style={{
            opacity: manualStage === 'impact' ? 0.1 : manualStage === 'understand' ? 1 : stage1Opacity,
            scale: manualStage === 'impact' ? 0.85 : manualStage === 'understand' ? 1 : stage1Scale,
          }}
          className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
        >
          {/* Top Stage Header */}
          <div className="absolute top-28 text-center pointer-events-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#2ED9A3] block mb-1">
              INPUT STREAM
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F4F6F8] font-display tracking-tight">
              Operational Telemetry
            </h2>
            <p className="text-xs text-[#8891A3] mt-1 max-w-md mx-auto">
              Real-world energy meters, fuel invoices, and facility sensors continuously mapped to GHGP factors.
            </p>
          </div>

          {/* Node 1: Energy Data (Top-Left) */}
          <div className="absolute top-[22%] left-[4%] sm:left-[10%] p-4 rounded-[12px] bg-[#10141D]/90 border border-[#2ED9A3]/40 shadow-xl backdrop-blur-md max-w-[210px] text-left pointer-events-auto">
            <div className="flex items-center gap-2 mb-1 text-[#2ED9A3]">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase">Energy Stream</span>
            </div>
            <p className="text-xs font-bold text-[#F4F6F8]">4,280 MWh / mo</p>
            <p className="text-[10px] text-[#8891A3]">Sub-metered HVAC & Chiller Telemetry</p>
          </div>

          {/* Node 2: Carbon Data (Top-Right) */}
          <div className="absolute top-[22%] right-[4%] sm:right-[10%] p-4 rounded-[12px] bg-[#10141D]/90 border border-[#3FB6E8]/40 shadow-xl backdrop-blur-md max-w-[210px] text-right pointer-events-auto">
            <div className="flex items-center gap-2 mb-1 text-[#3FB6E8] flex-row-reverse">
              <Leaf className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase">Carbon Stream</span>
            </div>
            <p className="text-xs font-bold text-[#F4F6F8]">620.0 t CO₂e / mo</p>
            <p className="text-[10px] text-[#8891A3]">Scope 1 Fuel & Scope 2 Grid Ingest</p>
          </div>

          {/* Node 3: Department Data (Bottom-Left) */}
          <div className="absolute bottom-[20%] left-[4%] sm:left-[10%] p-4 rounded-[12px] bg-[#10141D]/90 border border-[#8B7FFF]/40 shadow-xl backdrop-blur-md max-w-[210px] text-left pointer-events-auto">
            <div className="flex items-center gap-2 mb-1 text-[#8B7FFF]">
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase">Site Stream</span>
            </div>
            <p className="text-xs font-bold text-[#F4F6F8]">14 Plants Monitored</p>
            <p className="text-[10px] text-[#8891A3]">Manufacturing & R&D Units</p>
          </div>

          {/* Node 4: ESG Mandate Data (Bottom-Right) */}
          <div className="absolute bottom-[20%] right-[4%] sm:right-[10%] p-4 rounded-[12px] bg-[#10141D]/90 border border-[#F5A623]/40 shadow-xl backdrop-blur-md max-w-[210px] text-right pointer-events-auto">
            <div className="flex items-center gap-2 mb-1 text-[#F5A623] flex-row-reverse">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase">ESG Stream</span>
            </div>
            <p className="text-xs font-bold text-[#F4F6F8]">SEBI BRSR Principle 6</p>
            <p className="text-[10px] text-[#8891A3]">EU CSRD Directive Disclosures</p>
          </div>
        </motion.div>

        {/* STAGE 2: ONE PREMIUM FLOATING PROJECTED IMPACT CARD */}
        <motion.div
          style={{
            opacity: manualStage === 'understand' ? 0.1 : manualStage === 'impact' ? 1 : impactOpacity,
            scale: manualStage === 'understand' ? 0.82 : manualStage === 'impact' ? 1 : impactScale,
            y: manualStage === 'understand' ? 40 : manualStage === 'impact' ? 0 : impactY,
          }}
          className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center p-4"
        >
          {/* Main Floating Impact Card */}
          <div
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{
              transform: !reduce && cardHover.isHovered ? `perspective(1000px) rotateX(${cardHover.tiltX}deg) rotateY(${cardHover.tiltY}deg) scale(1.02)` : undefined,
              transformStyle: 'preserve-3d',
            }}
            className={cn(
              'group relative w-full max-w-2xl rounded-[24px] p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 pointer-events-auto border overflow-hidden shadow-2xl',
              cardHover.isHovered
                ? 'bg-[#121824]/98 border-[#2ED9A3] shadow-[#2ED9A3]/30 ring-2 ring-[#2ED9A3]/40'
                : 'bg-[#10141D]/95 border-[#2ED9A3]/60 shadow-[#2ED9A3]/20 ring-1 ring-[#2ED9A3]/20'
            )}
          >
            {/* Cursor Light Hotspot */}
            {cardHover.isHovered && cardHover.x > 0 && (
              <div
                className="absolute pointer-events-none rounded-full w-80 h-80 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 opacity-20 z-0"
                style={{
                  left: `${cardHover.x}px`,
                  top: `${cardHover.y}px`,
                  background: 'radial-gradient(circle, #2ED9A3 0%, transparent 70%)',
                }}
              />
            )}

            {/* Architectural Glass Specular Reflection Highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />

            {/* Single Specular Light Sweep Animation */}
            <motion.div
              style={{ x: sweepX }}
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#2ED9A3]/20 to-transparent -skew-x-12 pointer-events-none z-0"
            />

            {/* Corner Tech Brackets */}
            <span className="absolute top-3 left-3 text-xs text-[#2ED9A3]/50 font-data select-none">+</span>
            <span className="absolute top-3 right-3 text-xs text-[#2ED9A3]/50 font-data select-none">+</span>
            <span className="absolute bottom-3 left-3 text-xs text-[#2ED9A3]/50 font-data select-none">+</span>
            <span className="absolute bottom-3 right-3 text-xs text-[#2ED9A3]/50 font-data select-none">+</span>

            {/* Card Content Layout */}
            <div className="relative z-10 space-y-6">
              {/* Header Label */}
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2ED9A3]/15 border border-[#2ED9A3]/40 flex items-center justify-center text-[#2ED9A3]">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#2ED9A3] block">
                      GREENPULSE AI OUTPUT
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-[#F4F6F8] font-display">
                      PROJECTED BUSINESS & ENVIRONMENTAL IMPACT
                    </h3>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171E2C] border border-[#2ED9A3]/30 text-xs font-mono text-[#2ED9A3]">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Verified ROI Model
                </div>
              </div>

              {/* Grid of 3 Primary Impact Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Metric 1: Financial Savings */}
                <div className="p-4 rounded-[14px] bg-[#0A0E14]/80 border border-[#2ED9A3]/30 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#8891A3] block">
                    Potential Annual Opex
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#2ED9A3] font-data tracking-tight">
                    ₹1.18 Cr
                  </div>
                  <p className="text-[11px] text-[#8891A3] flex items-center gap-1 pt-1">
                    <DollarSign className="w-3 h-3 text-[#2ED9A3]" />
                    $1.42M ($118k/mo Verified)
                  </p>
                </div>

                {/* Metric 2: CO2e Reduction */}
                <div className="p-4 rounded-[14px] bg-[#0A0E14]/80 border border-[#3FB6E8]/30 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#8891A3] block">
                    Annual CO₂e Reduction
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#3FB6E8] font-data tracking-tight">
                    1,710 t
                  </div>
                  <p className="text-[11px] text-[#8891A3] flex items-center gap-1 pt-1">
                    <TrendingDown className="w-3 h-3 text-[#3FB6E8]" />
                    -14.2% YoY Abatement
                  </p>
                </div>

                {/* Metric 3: Energy Efficiency Gain */}
                <div className="p-4 rounded-[14px] bg-[#0A0E14]/80 border border-[#8B7FFF]/30 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#8891A3] block">
                    Energy Efficiency Gain
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#8B7FFF] font-data tracking-tight">
                    +18.4%
                  </div>
                  <p className="text-[11px] text-[#8891A3] flex items-center gap-1 pt-1">
                    <Zap className="w-3 h-3 text-[#8B7FFF]" />
                    Chiller & HVAC Optimization
                  </p>
                </div>
              </div>

              {/* Progressively Revealed Value Story Footer */}
              <div className="pt-2 border-t border-[#1E2638] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8891A3]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ED9A3] shrink-0" />
                  <span>
                    Audited compliance alignment: <strong className="text-[#F4F6F8]">SEBI BRSR Principle 6</strong> & <strong className="text-[#F4F6F8]">EU CSRD</strong>
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-[#2ED9A3] font-semibold text-xs font-mono">
                  <span>DEPLOYED ACROSS 14 PLANTS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};


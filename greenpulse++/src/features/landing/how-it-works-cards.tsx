/**
 * @license
 * GreenPulse AI — How-It-Works Motion Cards
 * Cinematic Four-Step Scroll Sequence: 01 DATA IN → 02 INTELLIGENCE → 03 ACTION → 04 REPORT
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { LuminousTechGrid } from '../../components/motion/motion-components';
import {
  Database,
  Cpu,
  Zap,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  BarChart3,
  Sliders,
  Layers
} from 'lucide-react';
import { cn } from '../../utils/utils';

interface StepCardData {
  step: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  highlights: string[];
}

const STEPS_DATA: StepCardData[] = [
  {
    step: '01',
    code: 'INGESTION // HYBRID-STREAM',
    title: 'DATA IN',
    subtitle: 'Automated Multi-Source Data Ingestion',
    description:
      'Direct API integrations with smart utility meters, IoT plant sensors, ERP systems (SAP/Oracle), and fuel invoices convert raw operational inputs into standardized carbon telemetry.',
    icon: Database,
    color: '#2ED9A3',
    highlights: ['100+ Pre-built Connectors', 'Real-time Sub-metering', 'Automated Anomaly Filtering'],
  },
  {
    step: '02',
    code: 'COMPUTATION // GEMINI-ENGINE',
    title: 'INTELLIGENCE',
    subtitle: 'AI Emission & Green Score Modeling',
    description:
      'GreenPulse AI maps inputs against localized IPCC, CEA, and GHGP emission factor databases to continuously calculate Scope 1, 2, and 3 footprint alongside your enterprise Green Score.',
    icon: Cpu,
    color: '#3FB6E8',
    highlights: ['Sub-second Emission Calculation', 'Scope 1, 2 & 3 Coverage', 'Green Score Benchmarking'],
  },
  {
    step: '03',
    code: 'OPTIMIZATION // AUTO-DEPLOY',
    title: 'ACTION',
    subtitle: 'Ranked Decarbonization Playbooks',
    description:
      'Receive prioritized, ROI-ranked recommendations—from HVAC setpoint shifts to peak demand shaving—with estimated financial savings and instant execution triggers.',
    icon: Zap,
    color: '#8B7FFF',
    highlights: ['Automated Setpoint Shifts', 'Verified OPEX Savings', 'Peak Demand Shaving'],
  },
  {
    step: '04',
    code: 'AUDIT // CSRD-BRSR-READY',
    title: 'REPORT',
    subtitle: '1-Click Audit-Ready Compliance',
    description:
      'Generate regulatory-ready ESG reports aligned with SEBI BRSR Principle 6, EU CSRD, SEC climate rules, and GRI frameworks complete with full data lineage for auditors.',
    icon: FileCheck2,
    color: '#F5A623',
    highlights: ['SEBI BRSR & EU CSRD Certified', 'Full Lineage Audit Trails', '1-Click Executive PDFs'],
  },
];

export const HowItWorksCardsSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const reduce = useReducedMotion();

  const [activeStep, setActiveStep] = useState<number>(0);
  const userInteractedRef = useRef<boolean>(false);

  // Cinematic scroll depth progression across the 4 workflow stages
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.6', 'end 0.9'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (userInteractedRef.current) return;
    if (latest < 0.25) {
      setActiveStep(0);
    } else if (latest < 0.5) {
      setActiveStep(1);
    } else if (latest < 0.75) {
      setActiveStep(2);
    } else {
      setActiveStep(3);
    }
  });

  const handleManualStepSelect = (idx: number) => {
    userInteractedRef.current = true;
    setActiveStep(idx);
    // Release manual lock after 3.5s so scroll continues driving when scrolling resumes
    setTimeout(() => {
      userInteractedRef.current = false;
    }, 3500);
  };

  // Mouse position tracking per active card for depth tilt and localized hotspot
  const [cardHotspots, setCardHotspots] = useState<{ [key: number]: { x: number; y: number; tiltX: number; tiltY: number } }>({});

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate normalized tilt (-10 to 10 deg)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -6;
    const tiltY = ((x - centerX) / centerX) * 6;

    setCardHotspots((prev) => ({
      ...prev,
      [idx]: { x, y, tiltX, tiltY },
    }));
  };

  const handleCardMouseLeave = (idx: number) => {
    setCardHotspots((prev) => ({
      ...prev,
      [idx]: { x: 0, y: 0, tiltX: 0, tiltY: 0 },
    }));
  };

  return (
    <section
      ref={containerRef}
      className="py-24 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[#1A1F2A] relative overflow-hidden select-none"
    >
      <LuminousTechGrid />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12161F]/90 border border-[#2ED9A3]/30 text-xs font-semibold text-[#2ED9A3] mb-3 shadow-lg backdrop-blur-md">
          <Layers className="w-3.5 h-3.5 text-[#2ED9A3]" />
          4-Step Intelligence Workflow
        </div>

        <h2 className="text-3xl sm:text-5xl font-semibold text-[#F4F6F8] mb-3 font-display tracking-tight">
          How GreenPulse AI operates
        </h2>

        <p className="text-sm sm:text-base text-[#8891A3]">
          From multi-source data ingestion to audit-ready ESG reporting in four seamless, automated stages.
        </p>

        {/* Step Progress Line Navigation */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {STEPS_DATA.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={s.step}
                onClick={() => handleManualStepSelect(idx)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all border',
                  isActive
                    ? 'bg-[#121824] text-[#2ED9A3] border-[#2ED9A3] shadow-lg shadow-[#2ED9A3]/20 scale-105'
                    : 'bg-[#10141D]/60 text-[#8891A3] border-[#1E2638] hover:text-[#F4F6F8]'
                )}
              >
                <span>{s.step}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thin Animated Connection Line between Steps */}
      <div className="relative mb-8 max-w-3xl mx-auto h-1 bg-[#1A2232] rounded-full overflow-hidden hidden sm:block z-10">
        <motion.div
          className="h-full bg-gradient-to-r from-[#2ED9A3] via-[#3FB6E8] to-[#8B7FFF] rounded-full"
          animate={{ width: `${((activeStep + 1) / STEPS_DATA.length) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* 4 Premium Glass Panels */}
      <div className="grid grid-cols-1 gap-8 relative z-10">
        {STEPS_DATA.map((item, idx) => {
          const isActive = activeStep === idx;
          const hotspot = cardHotspots[idx] || { x: 0, y: 0, tiltX: 0, tiltY: 0 };

          return (
            <motion.div
              key={item.step}
              onClick={() => handleManualStepSelect(idx)}
              onMouseMove={(e) => handleCardMouseMove(e, idx)}
              onMouseLeave={() => handleCardMouseLeave(idx)}
              initial={{ opacity: 0, y: 35 }}
              animate={
                isInView
                  ? {
                      opacity: isActive ? 1 : 0.55,
                      scale: isActive ? 1.015 : 0.985,
                    }
                  : {}
              }
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transform: !reduce && isActive ? `perspective(1000px) rotateX(${hotspot.tiltX}deg) rotateY(${hotspot.tiltY}deg)` : undefined,
                transformStyle: 'preserve-3d',
              }}
              className={cn(
                'group relative rounded-[20px] p-6 sm:p-8 backdrop-blur-2xl transition-all duration-500 cursor-pointer overflow-hidden border',
                isActive
                  ? 'bg-[#121824]/95 border-[#2ED9A3] shadow-2xl shadow-[#2ED9A3]/20 ring-1 ring-[#2ED9A3]/30'
                  : 'bg-[#10141D]/70 border-[#1E2638] hover:border-[#2ED9A3]/40'
              )}
            >
              {/* Localized Cursor Light Hotspot */}
              {isActive && hotspot.x > 0 && (
                <div
                  className="absolute pointer-events-none rounded-full w-72 h-72 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 opacity-25 z-0"
                  style={{
                    left: `${hotspot.x}px`,
                    top: `${hotspot.y}px`,
                    background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)`,
                  }}
                />
              )}

              {/* Glass Reflection Highlight */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

              {/* Emerald Flowing Light Strip on Active Card */}
              {isActive && (
                <motion.div
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: '200%', opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-[#2ED9A3]/15 to-transparent -skew-x-12 pointer-events-none z-0"
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
                {/* Left Column: Number & Code Header */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-4xl sm:text-6xl font-black font-display tracking-tight"
                      style={{ color: isActive ? item.color : '#8891A3' }}
                    >
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center border bg-[#10141D] border-[#1E2638]">
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#8891A3] uppercase block">
                    {item.code}
                  </span>

                  <h3 className="text-xl sm:text-2xl font-bold text-[#F4F6F8] font-display">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#2ED9A3] font-mono font-semibold">
                    {item.subtitle}
                  </p>
                </div>

                {/* Middle Column: Detailed Description & Highlights */}
                <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-[#1E2638] pt-4 lg:pt-0 lg:pl-6">
                  <p className="text-xs sm:text-sm text-[#8891A3] leading-relaxed">
                    {item.description}
                  </p>

                  <div className="space-y-2">
                    {item.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-2 text-xs font-medium text-[#F4F6F8]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3] shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Internal Interactive Motion Preview Box */}
                <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-[#1E2638] pt-4 lg:pt-0 lg:pl-6">
                  <div className="p-4 rounded-[14px] bg-[#0A0E14]/90 border border-[#1E2638] space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8891A3]">
                      <span>STAGE OUTPUT</span>
                      <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-ping" />
                    </div>

                    {idx === 0 && (
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-[#2ED9A3]">
                          <span>SAP ERP API</span>
                          <span>CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between text-[#3FB6E8]">
                          <span>Smart Meter #14</span>
                          <span>4,280 kWh</span>
                        </div>
                        <div className="w-full h-1 bg-[#10141D] rounded-full overflow-hidden mt-2">
                          <div className="w-3/4 h-full bg-[#2ED9A3] animate-pulse" />
                        </div>
                      </div>
                    )}

                    {idx === 1 && (
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-[#F4F6F8]">
                          <span>Scope 1, 2, 3</span>
                          <span>CALCULATED</span>
                        </div>
                        <div className="flex items-center justify-between text-[#2ED9A3]">
                          <span>Green Score</span>
                          <span className="font-bold">84 / 100</span>
                        </div>
                        <div className="w-full h-1 bg-[#10141D] rounded-full overflow-hidden mt-2">
                          <div className="w-4/5 h-full bg-[#3FB6E8] animate-pulse" />
                        </div>
                      </div>
                    )}

                    {idx === 2 && (
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-[#8B7FFF]">
                          <span>Chiller Shift</span>
                          <span>DEPLOYED</span>
                        </div>
                        <div className="flex items-center justify-between text-[#2ED9A3]">
                          <span>Opex Savings</span>
                          <span className="font-bold">$100k/mo</span>
                        </div>
                        <div className="w-full h-1 bg-[#10141D] rounded-full overflow-hidden mt-2">
                          <div className="w-full h-full bg-[#8B7FFF] animate-pulse" />
                        </div>
                      </div>
                    )}

                    {idx === 3 && (
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-[#F5A623]">
                          <span>BRSR & CSRD</span>
                          <span>EXPORTED</span>
                        </div>
                        <div className="flex items-center justify-between text-[#2ED9A3]">
                          <span>Auditor Verification</span>
                          <span className="font-bold">PASSED</span>
                        </div>
                        <div className="w-full h-1 bg-[#10141D] rounded-full overflow-hidden mt-2">
                          <div className="w-full h-full bg-[#F5A623]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

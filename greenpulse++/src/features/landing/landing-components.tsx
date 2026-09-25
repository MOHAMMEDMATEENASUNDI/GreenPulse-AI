/**
 * @license
 * GreenPulse AI — High-Polish Landing Page Master Components
 */

import React, { useState, useRef } from 'react';
import { motion, Variants, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { useMetricsStore } from '../../stores';
import { cn } from '../../utils/utils';
import {
  AuroraBackground,
  FadeIn,
  ScrollReveal,
  KineticHeading,
  TiltCard,
  LuminousTechGrid,
  StaggerContainer,
  StaggerItem,
} from '../../components/motion/motion-components';
import { EarthGlobe } from './earth-globe';
import { WormholeEntry } from './wormhole-entry';
import { CarbonFlowDiagram } from './carbon-flow';
import { InteractiveDashboardPreview } from './dashboard-preview';
import { ScoreGaugeArc } from '../../components/ui/score-gauge-arc';
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  Zap,
  Trash2,
  Bot,
  FileText,
  Sparkles,
  CheckCircle2,
  Lock,
  Globe2,
  BarChart3,
  Building2,
  Award
} from 'lucide-react';

export const LandingNavbar: React.FC<{ onGetStarted?: () => void; onSignIn?: () => void }> = ({
  onGetStarted,
  onSignIn,
}) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="h-16 bg-[#0A0E14]/85 backdrop-blur-xl border-b border-[#1A1F2A] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm"
    >
      <div className="flex items-center gap-3 group cursor-pointer" onClick={onGetStarted}>
        <motion.div
          whileHover={{ scale: 1.08, rotate: 6 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-[8px] aurora-gradient-bg flex items-center justify-center shadow-lg shadow-[#2ED9A3]/20"
        >
          <Leaf className="w-5 h-5 text-[#0A0E14]" />
        </motion.div>
        <span className="font-display font-semibold text-lg text-[#F4F6F8] tracking-tight group-hover:text-[#2ED9A3] transition-colors">
          GreenPulse AI
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#8891A3]">
        <a href="#features" className="hover:text-[#F4F6F8] transition-colors relative py-1 group">
          Capabilities
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2ED9A3] transition-all duration-300 group-hover:w-full" />
        </a>
        <a href="#flow" className="hover:text-[#F4F6F8] transition-colors relative py-1 group">
          Telemetry Map
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#3FB6E8] transition-all duration-300 group-hover:w-full" />
        </a>
        <a href="#sandbox" className="hover:text-[#F4F6F8] transition-colors relative py-1 group">
          Interactive Sandbox
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#8B7FFF] transition-all duration-300 group-hover:w-full" />
        </a>
        <a href="#standards" className="hover:text-[#F4F6F8] transition-colors relative py-1 group">
          BRSR & CSRD Standards
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2ED9A3] transition-all duration-300 group-hover:w-full" />
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={onSignIn}
          className="text-xs font-medium text-[#8891A3] hover:text-[#2ED9A3] transition-colors px-3 py-1.5"
        >
          Sign In
        </button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button size="sm" onClick={onGetStarted} className="shadow-md shadow-[#2ED9A3]/20">
            Launch Mission Control
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
};

export const HERO_MOTION_VARIANTS: Record<string, Variants> = {
  // 1. Earth emergence from darkness
  earthEmergence: {
    hidden: { opacity: 0, scale: 0.9, filter: 'brightness(0.12) blur(14px)' },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'brightness(1) blur(0px)',
      transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const, delay: 0.1 },
    },
  },
  // 2. Soft radial light behind Earth
  radialBacklight: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 },
    },
  },
  // 3. Headline with atmospheric depth translation
  headlineContainer: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.16,
      },
    },
  },
  headlineWordDepth: {
    hidden: {
      opacity: 0,
      y: 12,
      scale: 0.98,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.48,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  },
  // 4. Supporting text
  supportingText: {
    hidden: { opacity: 0, y: 10, filter: 'blur(3px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.44,
      },
    },
  },
  // 5. CTA appearance
  primaryCta: {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.56,
      },
    },
  },
  // 6. Emerald specular light sweep
  specularSweep: {
    initial: { x: '-120%', opacity: 0 },
    animate: {
      x: '220%',
      opacity: [0, 1, 1, 0],
      transition: {
        duration: 1.1,
        ease: [0.22, 1, 0.36, 1] as const,
        delay: 1.6,
      },
    },
  },
  // 7. Illuminated telemetry statistics data fragments
  telemetryLeft: {
    hidden: { opacity: 0, x: -30, scale: 0.9, filter: 'blur(6px)' },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 1.35,
      },
    },
  },
  telemetryRight: {
    hidden: { opacity: 0, x: 30, scale: 0.9, filter: 'blur(6px)' },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 1.5,
      },
    },
  },
};

export const LandingHeroSection: React.FC<{ onGetStarted?: () => void }> = ({ onGetStarted }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isPrimaryHovered, setIsPrimaryHovered] = useState(false);
  const [isSecondaryHovered, setIsSecondaryHovered] = useState(false);

  // Cinematic scroll depth progression: hero content recedes as user scrolls into scene 2
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroContentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const heroContentScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.94]);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 0.75, 0.2]);
  const earthParallaxY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 45]);
  const auraOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.45]);

  return (
    <div ref={heroRef} className="relative">
      <AuroraBackground className="min-h-[92vh] flex flex-col items-center justify-center px-4 py-12 text-center relative overflow-hidden">
        <LuminousTechGrid />

        <motion.div
          style={{
            y: heroContentY,
            scale: heroContentScale,
            opacity: heroContentOpacity,
          }}
          className="max-w-5xl mx-auto flex flex-col items-center pt-2 sm:pt-6 relative z-10 will-change-transform"
        >
          {/* Status Pill Badge & Replay Boot Trigger */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12161F]/80 border border-[#242B38] hover:border-[#2ED9A3]/30 text-xs font-medium text-[#2ED9A3] shadow-lg shadow-black/20 backdrop-blur-md transition-colors">
              <span className="relative flex h-2 w-2">
                {!reduce && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ED9A3] opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2ED9A3]" />
              </span>
              GreenPulse AI is coming online
            </div>
            <WormholeEntry autoPlay={false} />
          </motion.div>

          {/* Hero Headline with Atmospheric Depth Translation — Dominant Centerpiece */}
          <motion.h1
            variants={HERO_MOTION_VARIANTS.headlineContainer}
            initial="hidden"
            animate="visible"
            className="text-4xl sm:text-6xl lg:text-7xl font-semibold text-[#F4F6F8] tracking-tight leading-[1.12] font-display max-w-4xl mx-auto"
          >
            <motion.span variants={HERO_MOTION_VARIANTS.headlineWordDepth} className="block">
              Real-time AI carbon
            </motion.span>
            <motion.span variants={HERO_MOTION_VARIANTS.headlineWordDepth} className="block">
              intelligence operating system
            </motion.span>
            <motion.span variants={HERO_MOTION_VARIANTS.headlineWordDepth} className="block">
              for enterprise
            </motion.span>
          </motion.h1>

          {/* Supporting Subtitle */}
          <motion.p
            variants={HERO_MOTION_VARIANTS.supportingText}
            initial="hidden"
            animate="visible"
            className="text-base sm:text-lg lg:text-xl text-[#8891A3] max-w-2xl mx-auto font-normal leading-relaxed mt-6 sm:mt-8"
          >
            Turn raw operational data into a continuously updating Green Score, ranked AI recommendations, and audit-ready SEBI BRSR & EU CSRD reports.
          </motion.p>

          {/* CTA Group: Primary Dominant + Secondary Subdued */}
          <motion.div
            variants={HERO_MOTION_VARIANTS.primaryCta}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8 sm:mt-10 w-full sm:w-auto"
          >
            {/* Primary CTA: Launch Mission Control */}
            <motion.div
              whileHover={reduce ? undefined : { y: -2.5, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
              whileTap={reduce ? undefined : { scale: 0.97, y: 0, transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] } }}
              onMouseEnter={() => setIsPrimaryHovered(true)}
              onMouseLeave={() => setIsPrimaryHovered(false)}
              className="relative overflow-hidden rounded-[8px] w-full sm:w-auto p-[1px] bg-gradient-to-b from-[#2ED9A3]/50 to-[#2ED9A3]/20 hover:from-[#2ED9A3]/90 hover:to-[#2ED9A3]/40 transition-colors duration-300 shadow-lg shadow-[#2ED9A3]/15 hover:shadow-xl hover:shadow-[#2ED9A3]/25"
            >
              <Button
                size="lg"
                onClick={onGetStarted}
                className="w-full sm:w-auto h-12 px-8 text-sm font-semibold active:scale-100 bg-[#2ED9A3] hover:bg-[#34E2AB] text-[#0A0E14] relative z-10 transition-colors duration-200"
              >
                <span>Launch Mission Control</span>
                <motion.span
                  className="inline-flex items-center ml-2"
                  animate={{ x: isPrimaryHovered && !reduce ? 4 : 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Button>
              {/* Restrained Emerald Specular Light Sweep */}
              {!reduce && (
                <motion.div
                  initial={{ x: '-150%', opacity: 0 }}
                  animate={
                    isPrimaryHovered
                      ? {
                          x: '250%',
                          opacity: [0, 0.75, 0.75, 0],
                        }
                      : {
                          x: '-150%',
                          opacity: 0,
                        }
                  }
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none z-20"
                />
              )}
            </motion.div>

            {/* Secondary CTA: Explore Interactive Sandbox */}
            <motion.div
              whileHover={reduce ? undefined : { y: -2, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
              whileTap={reduce ? undefined : { scale: 0.97, y: 0, transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] } }}
              onMouseEnter={() => setIsSecondaryHovered(true)}
              onMouseLeave={() => setIsSecondaryHovered(false)}
              className="relative overflow-hidden rounded-[8px] w-full sm:w-auto p-[1px] bg-gradient-to-b from-[#242B38] to-[#171C27] hover:from-[#8891A3]/50 hover:to-[#242B38] transition-colors duration-300"
            >
              <Button
                variant="secondary"
                size="lg"
                onClick={onGetStarted}
                className="w-full sm:w-auto h-12 px-8 text-sm font-medium active:scale-100 border-0 bg-[#12161F]/80 text-[#8891A3] hover:text-[#F4F6F8] backdrop-blur-md relative z-10 transition-colors duration-200"
              >
                Explore Interactive Sandbox
              </Button>
              {/* Tiny Glass Reflection on Hover */}
              {!reduce && (
                <motion.div
                  initial={{ x: '-150%', opacity: 0 }}
                  animate={
                    isSecondaryHovered
                      ? {
                          x: '250%',
                          opacity: [0, 0.28, 0.28, 0],
                        }
                      : {
                          x: '-150%',
                          opacity: 0,
                        }
                  }
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none z-20"
                />
              )}
            </motion.div>
          </motion.div>

          {/* 3D Earth Emergence Canvas with Backlight Aura & Illuminated Telemetry Data Fragments */}
          <div className="pt-6 h-80 sm:h-96 w-full max-w-3xl mx-auto relative flex items-center justify-center">
            {/* Soft Radial Backlight behind Earth */}
            <motion.div
              variants={HERO_MOTION_VARIANTS.radialBacklight}
              initial="hidden"
              animate="visible"
              style={{ opacity: auraOpacity }}
              className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-radial from-[#2ED9A3]/25 via-[#3FB6E8]/10 to-transparent blur-[70px] pointer-events-none z-0"
            />

            {/* Earth Emergence with Scroll Parallax Anchor */}
            <motion.div
              variants={HERO_MOTION_VARIANTS.earthEmergence}
              initial="hidden"
              animate="visible"
              style={{ y: earthParallaxY }}
              className="w-full h-full relative z-10"
            >
              <EarthGlobe className="w-full h-full" />
            </motion.div>

            {/* Hero Statistic Data Fragment 1 */}
            <motion.div
              variants={HERO_MOTION_VARIANTS.telemetryLeft}
              initial="hidden"
              animate="visible"
              className="hidden sm:flex absolute top-12 left-4 p-3 rounded-[12px] bg-[#12161F]/90 border border-[#2ED9A3]/40 shadow-2xl backdrop-blur-md items-center gap-3 text-left z-20"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-[8px] bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 flex items-center justify-center text-[#2ED9A3] relative">
                  <Leaf className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2ED9A3] animate-ping" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#8891A3] block tracking-wider">Live Telemetry</span>
                  <span className="text-xs font-bold font-data text-[#2ED9A3]">620.0 t CO₂e / mo</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Statistic Data Fragment 2 */}
            <motion.div
              variants={HERO_MOTION_VARIANTS.telemetryRight}
              initial="hidden"
              animate="visible"
              className="hidden sm:flex absolute bottom-12 right-4 p-3 rounded-[12px] bg-[#12161F]/90 border border-[#8B7FFF]/40 shadow-2xl backdrop-blur-md items-center gap-3 text-left z-20"
            >
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-[8px] bg-[#8B7FFF]/10 border border-[#8B7FFF]/30 flex items-center justify-center text-[#8B7FFF] relative">
                  <Award className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#8B7FFF] animate-ping" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#8891A3] block tracking-wider">Green Score</span>
                  <span className="text-xs font-bold font-data text-[#8B7FFF]">84 / 100 Grade A</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </AuroraBackground>
    </div>
  );
};

export const LandingFeaturesGrid: React.FC<{ onGetStarted?: () => void }> = ({ onGetStarted }) => {
  const reduce = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const pillars = [
    {
      id: 'cap-carbon',
      title: 'Real-Time Carbon Accounting',
      desc: 'Automated Scope 1, 2, and 3 GHG Protocol accounting with India CEA and IPCC v20.0 factor libraries.',
      icon: Leaf,
      color: '#2ED9A3',
      chip: 'Scope 1/2/3 Live',
      busTag: 'GHG.01',
    },
    {
      id: 'cap-energy',
      title: 'Energy Anomaly Detection',
      desc: 'Machine learning monitors hourly HVAC, chiller, and feeder lines for immediate wastage alerts.',
      icon: Zap,
      color: '#3FB6E8',
      chip: 'Sub-hour Telemetry',
      busTag: 'IOT.02',
    },
    {
      id: 'cap-compliance',
      title: 'SEBI BRSR & EU CSRD Engine',
      desc: 'Automated alignment with SEBI Principle 6 Mandates and EU CSRD disclosures with 1-click audit PDFs.',
      icon: ShieldCheck,
      color: '#8B7FFF',
      chip: 'Audit Ready PDF',
      busTag: 'REG.03',
    },
    {
      id: 'cap-greenscore',
      title: 'Enterprise Green Score Rating',
      desc: 'A standardized 0-100 credit score for enterprise sustainability based on real operational logs.',
      icon: Award,
      color: '#F5A623',
      chip: 'Standardized Metric',
      busTag: 'MET.04',
    },
    {
      id: 'cap-copilot',
      title: 'GreenPulse AI Copilot',
      desc: 'Grounded LLM agent that answers natural language questions and calculates ROI for green projects.',
      icon: Bot,
      color: '#2ED9A3',
      chip: 'Grounded Insights',
      busTag: 'LLM.05',
    },
    {
      id: 'cap-waste',
      title: 'Circular Waste Streams',
      desc: 'Track industrial scrap, hazardous sludge, and waste diversion to meet zero-landfill goals.',
      icon: Trash2,
      color: '#3FB6E8',
      chip: '80% Diversion Target',
      busTag: 'WST.06',
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[#1A1F2A] relative overflow-hidden select-none">
      {/* Subtle Ambient Telemetry Background Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
        <div className="w-[600px] h-[350px] rounded-full bg-radial from-[#2ED9A3]/8 via-[#3FB6E8]/4 to-transparent blur-[100px]" />
      </div>

      {/* Subtle Connectivity Telemetry Bus Circuitry Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden lg:block opacity-30"
        viewBox="0 0 1152 700"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="busLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2ED9A3" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#3FB6E8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8B7FFF" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Horizontal & Inter-Row Cross Bus Vectors */}
        <path d="M 200 280 L 950 280" fill="none" stroke="url(#busLineGrad)" strokeWidth="0.8" strokeDasharray="3 9" />
        <path d="M 380 280 L 380 430" fill="none" stroke="#2ED9A3" strokeWidth="0.8" strokeDasharray="2 6" strokeOpacity="0.3" />
        <path d="M 760 280 L 760 430" fill="none" stroke="#3FB6E8" strokeWidth="0.8" strokeDasharray="2 6" strokeOpacity="0.3" />
        <path d="M 200 430 L 950 430" fill="none" stroke="url(#busLineGrad)" strokeWidth="0.8" strokeDasharray="3 9" />
      </svg>

      {/* Coordinated Scroll Entrance Header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-2xl mx-auto mb-16 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 mb-3"
        >
          <Badge variant="emerald">6 Core Architecture Pillars</Badge>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#F4F6F8] mb-3.5 font-display tracking-tight leading-tight"
        >
          Engineered for industrial rigor & regulatory precision
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-sm sm:text-base text-[#8891A3] max-w-xl mx-auto leading-relaxed"
        >
          Complete suite of AI intelligence tools designed for sustainability officers, facility managers, and ESG leadership.
        </motion.p>
      </motion.div>

      {/* 6 Capabilities Coordinated Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {pillars.map((p, idx) => (
          <CapabilityInstrumentCard
            key={p.id}
            pillar={p}
            index={idx}
            isHovered={hoveredIdx === idx}
            hasAnyHovered={hoveredIdx !== null}
            onHoverStart={() => setHoveredIdx(idx)}
            onHoverEnd={() => setHoveredIdx(null)}
            onGetStarted={onGetStarted}
            reduce={reduce}
          />
        ))}
      </div>
    </section>
  );
};

interface CapabilityInstrumentCardProps {
  pillar: {
    id: string;
    title: string;
    desc: string;
    icon: React.ElementType;
    color: string;
    chip: string;
    busTag: string;
  };
  index: number;
  isHovered: boolean;
  hasAnyHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onGetStarted?: () => void;
  reduce: boolean | null;
}

const CapabilityInstrumentCard: React.FC<CapabilityInstrumentCardProps> = ({
  pillar,
  index,
  isHovered,
  hasAnyHovered,
  onHoverStart,
  onHoverEnd,
  onGetStarted,
  reduce,
}) => {
  const [reflectionKey, setReflectionKey] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Micro tilt 1-2 degrees
    const tiltX = -((y - rect.height / 2) / (rect.height / 2)) * 2.2;
    const tiltY = ((x - rect.width / 2) / (rect.width / 2)) * 2.2;
    setCursorPos({ x, y, tiltX, tiltY });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    onHoverStart();
    setReflectionKey((prev) => prev + 1);
    handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    onHoverEnd();
    setCursorPos({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  };

  // Coordinated Row 1 (indices 0,1,2) vs Row 2 (indices 3,4,5) entrance
  const rowDelay = index < 3 ? 0.3 + index * 0.08 : 0.48 + (index - 3) * 0.08;

  // Active instrument hierarchy: hovered card is 1.0; other cards softly quiet down to 0.7
  const cardOpacity = hasAnyHovered ? (isHovered ? 1.0 : 0.68) : 1.0;
  const cardScale = hasAnyHovered ? (isHovered ? 1.015 : 0.99) : 1.0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: rowDelay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        opacity: cardOpacity,
        scale: cardScale,
      }}
      className="transition-all duration-300 h-full"
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform:
            !reduce && isHovered
              ? `perspective(800px) translateY(-3px) rotateX(${cursorPos.tiltX}deg) rotateY(${cursorPos.tiltY}deg)`
              : undefined,
          transformStyle: 'preserve-3d',
        }}
        className={cn(
          'relative h-full rounded-xl bg-[#0D121B]/85 backdrop-blur-xl border p-6 flex flex-col justify-between overflow-hidden group cursor-pointer transition-all duration-300',
          isHovered
            ? 'shadow-[0_12px_36px_rgba(0,0,0,0.5)]'
            : 'border-[#242B38] hover:border-[#3A4559]'
        )}
      >
        {/* Border Glow when hovered */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
          style={{
            borderColor: isHovered ? `${pillar.color}65` : 'transparent',
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: isHovered ? `0 0 20px ${pillar.color}15 inset` : 'none',
          }}
        />

        {/* Localized Cursor Spotlight Follower */}
        {isHovered && !reduce && (
          <div
            className="absolute pointer-events-none rounded-full w-48 h-48 -translate-x-1/2 -translate-y-1/2 opacity-25 z-0 transition-opacity"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              background: `radial-gradient(circle, ${pillar.color} 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Specular Diagonal Reflection Sweep on Trigger */}
        <motion.div
          key={reflectionKey}
          initial={{ x: '-140%', opacity: 0 }}
          animate={{ x: '240%', opacity: isHovered ? [0, 0.35, 0] : 0 }}
          transition={{ duration: 0.85, ease: 'easeInOut' }}
          className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none z-10"
        />

        {/* Top Header: Icon, Bus Tag & Badge */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[8px] bg-[#141A25] border border-[#242B38] flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{
                borderColor: isHovered ? `${pillar.color}60` : undefined,
                boxShadow: isHovered ? `0 0 12px ${pillar.color}25` : undefined,
              }}
            >
              <pillar.icon
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-3"
                style={{ color: pillar.color }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#8891A3]/70 tracking-widest hidden sm:inline-block">
              {pillar.busTag}
            </span>
          </div>

          <Badge
            variant="cyan"
            className={cn(
              'text-[10px] px-2.5 py-0.5 tracking-wide transition-all duration-300',
              isHovered ? 'border-[#3FB6E8]/70 shadow-sm shadow-[#3FB6E8]/20 bg-[#3FB6E8]/15 text-[#F4F6F8]' : ''
            )}
          >
            {pillar.chip}
          </Badge>
        </div>

        {/* Body Typography */}
        <div className="relative z-10 my-auto">
          <h3 className="text-base sm:text-lg font-semibold text-[#F4F6F8] mb-2 font-display tracking-tight transition-colors duration-200 group-hover:text-[#FFFFFF]">
            {pillar.title}
          </h3>
          <p className="text-xs text-[#8891A3] leading-relaxed mb-4">
            {pillar.desc}
          </p>
        </div>

        {/* Card Footer: Action Link */}
        <div className="relative z-10 pt-2 border-t border-[#1E2638]/50 flex items-center justify-between">
          <button
            onClick={onGetStarted}
            className="text-xs font-semibold flex items-center gap-1.5 transition-colors duration-200 cursor-pointer"
            style={{ color: pillar.color }}
          >
            <span>Explore Capability</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <span className="text-[9px] font-mono text-[#8891A3]/50 uppercase tracking-widest">
            ACTIVE
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export const LandingStandardsBadges: React.FC = () => {
  return (
    <section id="standards" className="py-16 px-4 bg-[#12161F]/50 border-y border-[#1A1F2A]">
      <ScrollReveal className="max-w-6xl mx-auto text-center space-y-6">
        <span className="text-xs font-semibold text-[#8891A3] uppercase tracking-wider block">
          Trusted Global Standards & Compliance Frameworks
        </span>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-80">
          {['SEBI BRSR', 'EU CSRD', 'GHG Protocol', 'ISO 14064', 'GRI Standards'].map((std, i) => (
            <motion.span
              key={std}
              whileHover={{ scale: 1.08, color: '#2ED9A3' }}
              className="font-display text-sm sm:text-base font-bold text-[#F4F6F8] cursor-default transition-colors"
            >
              {std}
            </motion.span>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};

export const LandingCtaBanner: React.FC<{ onGetStarted?: () => void }> = ({ onGetStarted }) => {
  const { greenScore } = useMetricsStore();
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [reflectionKey, setReflectionKey] = useState(0);

  // Micro tilt and cursor hotspot coordinates for physical card realism (active when CTA is focused)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; tiltX: number; tiltY: number; isHovered: boolean }>({
    x: 0,
    y: 0,
    tiltX: 0,
    tiltY: 0,
    isHovered: false,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = Math.min(Math.max(((y - centerY) / centerY) * -1.5, -2), 2);
    const tiltY = Math.min(Math.max(((x - centerX) / centerX) * 1.5, -2), 2);

    setCursorPos({ x, y, tiltX, tiltY, isHovered: true });
  };

  const handleMouseEnter = () => {
    setReflectionKey(prev => prev + 1);
  };

  const handleMouseLeave = () => {
    setCursorPos({ x: 0, y: 0, tiltX: 0, tiltY: 0, isHovered: false });
  };

  // Scroll Progress across the 8-phase cinematic planetary scene
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Phase 1 to Phase 8 Transformations
  // Phase 1 -> 2: CTA Card recedes smoothly [0.0 -> 0.20]
  // Phase 7 -> 8: CTA Card re-emerges to foreground [0.70 -> 0.92]
  const ctaOpacity = useTransform(scrollYProgress, [0, 0.18, 0.70, 0.90], [1, 0.1, 0.1, 1]);
  const ctaScale = useTransform(scrollYProgress, [0, 0.18, 0.70, 0.90], [1, 0.88, 0.88, 1]);
  const ctaY = useTransform(scrollYProgress, [0, 0.18, 0.70, 0.90], [0, -22, -22, 0]);
  const ctaPointerEvents = useTransform(scrollYProgress, v => (v < 0.16 || v > 0.72 ? 'auto' : 'none'));

  // Phase 3, 4, 6: Planetary 3D Earth emerges, blooms and settles [0.18 -> 0.70 -> 0.92]
  const earthScale = useTransform(scrollYProgress, [0, 0.18, 0.45, 0.68, 0.92], [0.72, 0.88, 1.2, 1.2, 0.92]);
  const earthOpacity = useTransform(scrollYProgress, [0, 0.18, 0.45, 0.68, 0.92], [0.22, 0.42, 0.96, 0.96, 0.38]);

  // Deep space ambient aurora & star glow
  const spaceGlowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.35, 1.0]);
  const spaceGlowOpacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.75, 1], [0.35, 0.65, 1.0, 0.75, 0.4]);

  // Phase 5: Orbital Intelligence Curved SVG Paths (6-8 paths) & signals
  const pathsOpacity = useTransform(scrollYProgress, [0, 0.2, 0.42, 0.68, 0.90], [0, 0.25, 0.9, 0.9, 0.3]);
  const signalsOpacity = useTransform(scrollYProgress, [0, 0.25, 0.42, 0.68, 0.88], [0, 0.3, 1, 1, 0.35]);

  // Phase 6: Center Intelligence Badge Focus when planet is dominant
  const centerIntelligenceOpacity = useTransform(scrollYProgress, [0, 0.32, 0.48, 0.66, 0.78], [0, 0.85, 1, 0.85, 0]);
  const centerIntelligenceScale = useTransform(scrollYProgress, [0.32, 0.48, 0.78], [0.85, 1, 0.85]);

  // 5 Environmental technical signal annotations
  const planetarySignals = [
    { label: 'CO₂', color: '#2ED9A3', pos: 'top-8 left-[6%] sm:left-[12%]', path: 'M 140 40 Q 300 80 400 140', delay: 0 },
    { label: 'ENERGY', color: '#3FB6E8', pos: 'top-16 right-[6%] sm:right-[12%]', path: 'M 660 60 Q 520 80 400 140', delay: 0.3 },
    { label: 'WASTE', color: '#8B7FFF', pos: 'bottom-24 left-[5%] sm:left-[10%]', path: 'M 120 280 Q 280 200 400 180', delay: 0.6 },
    { label: 'ESG', color: '#2ED9A3', pos: 'bottom-16 right-[8%] sm:right-[15%]', path: 'M 680 290 Q 540 220 400 180', delay: 0.9 },
    { label: 'COMPLIANCE', color: '#F5A623', pos: 'top-32 left-[3%] sm:left-[7%]', path: 'M 90 120 Q 260 110 400 160', delay: 1.2 },
  ];

  // If reduced motion is requested, render clean resting state directly
  if (reduce) {
    return (
      <section id="finale" className="py-24 sm:py-32 px-4 max-w-6xl mx-auto text-center relative overflow-hidden">
        <div className="relative z-10">
          <Card
            variant="raised"
            hasAccentGlow
            className="p-8 sm:p-14 space-y-7 relative overflow-hidden bg-[#0D121B]/85 backdrop-blur-xl border border-[#242B38]"
          >
            <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
              <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#12161F]/90 border border-[#2ED9A3]/30">
                <ScoreGaugeArc score={greenScore.score} size="compact" />
                <div className="text-left font-data">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#F4F6F8]">Enterprise Green Score</span>
                    <span className="text-[9px] font-mono font-bold text-[#2ED9A3] bg-[#2ED9A3]/15 px-1.5 py-0.2 rounded border border-[#2ED9A3]/30">
                      TIER 1
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8891A3]">Neural Telemetry Core • Live GHGP Verified</span>
                </div>
              </div>

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full aurora-gradient-bg mx-auto flex items-center justify-center shadow-xl shadow-[#2ED9A3]/30">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-[#0A0E14]" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-5xl font-semibold text-[#F4F6F8] font-display max-w-2xl mx-auto leading-tight relative z-10">
              Ready to turn carbon tracking into your competitive advantage?
            </h2>

            <p className="text-sm sm:text-base text-[#8891A3] max-w-xl mx-auto relative z-10 leading-relaxed">
              Join enterprise sustainability leaders automating carbon telemetry, cutting energy costs, and securing SEBI BRSR compliance.
            </p>

            <div className="text-xs text-[#2ED9A3] font-data tracking-wide relative z-10">
              A healthier enterprise creates a healthier planet.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative z-10">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="w-full sm:w-auto h-12 px-8 shadow-xl shadow-[#2ED9A3]/25 bg-[#2ED9A3] text-[#0A0E14] font-semibold hover:bg-[#2ED9A3]/90"
              >
                Launch Mission Control Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <div ref={containerRef} id="finale" className="relative h-[250vh] sm:h-[280vh]">
      {/* Sticky Viewport Stage for Smooth 8-Phase Cinematic Scroll Choreography */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-4">
        {/* Deep-Space Ambient Atmospheric Background Glow & Stars */}
        <motion.div
          style={{ opacity: spaceGlowOpacity, scale: spaceGlowScale }}
          className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center"
        >
          {/* Soft emerald planetary aurora atmosphere */}
          <div className="w-[540px] sm:w-[800px] h-[540px] sm:h-[800px] rounded-full bg-radial from-[#2ED9A3]/15 via-[#3FB6E8]/8 to-transparent blur-[120px]" />
          <div className="absolute w-[380px] h-[380px] rounded-full bg-radial from-[#8B7FFF]/14 to-transparent blur-[90px] -translate-y-12" />

          {/* Sparse space star points */}
          <div className="absolute inset-0 opacity-50">
            <div className="absolute top-[14%] left-[18%] w-1 h-1 rounded-full bg-[#F4F6F8] opacity-75 animate-ping" style={{ animationDuration: '4.5s' }} />
            <div className="absolute top-[26%] right-[20%] w-1 h-1 rounded-full bg-[#3FB6E8] opacity-60" />
            <div className="absolute bottom-[22%] left-[16%] w-1 h-1 rounded-full bg-[#2ED9A3] opacity-70" />
            <div className="absolute bottom-[34%] right-[14%] w-1.5 h-1.5 rounded-full bg-[#F4F6F8] opacity-50" />
            <div className="absolute top-[58%] left-[9%] w-1 h-1 rounded-full bg-[#8B7FFF] opacity-60" />
            <div className="absolute top-[12%] right-[32%] w-1 h-1 rounded-full bg-[#2ED9A3] opacity-80" />
          </div>
        </motion.div>

        {/* PHASE 3 & 4: Embedded 3D Living Earth Globe Layer */}
        <motion.div
          style={{
            scale: earthScale,
            opacity: earthOpacity,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] sm:w-[540px] h-[360px] sm:h-[540px] pointer-events-auto transition-opacity duration-300 z-0"
        >
          <EarthGlobe interactive={true} showBadge={false} />
        </motion.div>

        {/* PHASE 5: SVG Orbital Paths & Curved Intelligence Vector Streams */}
        <motion.svg
          style={{ opacity: pathsOpacity }}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden sm:block"
          viewBox="0 0 800 360"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2ED9A3" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#3FB6E8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8B7FFF" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B7FFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2ED9A3" stopOpacity="0.2" />
            </linearGradient>

            <filter id="signalGlowFinale" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 6 Luminous Orbital Trajectories */}
          <ellipse
            cx="400"
            cy="180"
            rx="330"
            ry="130"
            fill="none"
            stroke="url(#orbitGrad1)"
            strokeWidth="1"
            strokeDasharray="4 8"
            className="opacity-40"
          />
          <ellipse
            cx="400"
            cy="180"
            rx="370"
            ry="90"
            fill="none"
            stroke="url(#orbitGrad2)"
            strokeWidth="1"
            strokeDasharray="2 10"
            className="opacity-30 -rotate-6 origin-center"
          />
          <ellipse
            cx="400"
            cy="180"
            rx="280"
            ry="160"
            fill="none"
            stroke="#2ED9A3"
            strokeWidth="0.8"
            strokeDasharray="3 12"
            strokeOpacity="0.25"
            className="rotate-12 origin-center"
          />

          {/* Curved Intelligence Convergent Vector Paths */}
          {planetarySignals.map((sig, idx) => (
            <g key={`path-${sig.label}`}>
              <path
                d={sig.path}
                fill="none"
                stroke={sig.color}
                strokeWidth="1.2"
                strokeDasharray="3 5"
                strokeOpacity="0.35"
              />
              <circle r="2.5" fill={sig.color} filter="url(#signalGlowFinale)">
                <animateMotion
                  path={sig.path}
                  dur={`${3.2 + idx * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </motion.svg>

        {/* PHASE 4: Environmental Data Signals — Minimal Technical Annotations */}
        <motion.div
          style={{ opacity: signalsOpacity }}
          className="absolute inset-0 pointer-events-none z-10 hidden sm:block max-w-6xl mx-auto"
        >
          {planetarySignals.map(sig => (
            <div
              key={sig.label}
              className={cn(
                'absolute font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#0A0E14]/85 border backdrop-blur-md flex items-center gap-1.5 shadow-sm transition-transform duration-300',
                sig.pos
              )}
              style={{ borderColor: `${sig.color}35`, color: sig.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: sig.color }} />
              {sig.label}
            </div>
          ))}
        </motion.div>

        {/* PHASE 6: Center Planetary Intelligence Focus Overlay (Active during Planetary Dominance) */}
        <motion.div
          style={{
            opacity: centerIntelligenceOpacity,
            scale: centerIntelligenceScale,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15 flex flex-col items-center justify-center text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0E14]/90 border border-[#2ED9A3]/40 backdrop-blur-md shadow-lg shadow-[#2ED9A3]/15">
            <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-ping" />
            <span className="text-[11px] font-mono font-bold text-[#2ED9A3] uppercase tracking-wider">
              Planetary Telemetry Convergence
            </span>
          </div>
          <span className="text-xs text-[#8891A3] font-data">
            Global Signals → GreenPulse Neural Core → Standardized ESG Output
          </span>
        </motion.div>

        {/* PHASE 1, 2, 7 & 8: Main CTA Content Card with Cinematic Recede & Re-Emergence */}
        <motion.div
          style={{
            opacity: ctaOpacity,
            scale: ctaScale,
            y: ctaY,
            pointerEvents: ctaPointerEvents,
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative z-20 w-full max-w-5xl text-center"
        >
          <Card
            variant="raised"
            hasAccentGlow
            className="p-8 sm:p-14 space-y-7 relative overflow-hidden bg-[#0D121B]/90 backdrop-blur-xl border border-[#242B38] hover:border-[#2ED9A3]/50 transition-all duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            style={{
              transform:
                !reduce && cursorPos.isHovered
                  ? `perspective(1000px) rotateX(${cursorPos.tiltX}deg) rotateY(${cursorPos.tiltY}deg)`
                  : undefined,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Dynamic Cursor Light Hotspot */}
            {cursorPos.isHovered && (
              <div
                className="absolute pointer-events-none rounded-full w-80 h-80 -translate-x-1/2 -translate-y-1/2 opacity-25 z-0 transition-opacity"
                style={{
                  left: `${cursorPos.x}px`,
                  top: `${cursorPos.y}px`,
                  background: 'radial-gradient(circle, #2ED9A3 0%, #3FB6E8 40%, transparent 70%)',
                }}
              />
            )}

            {/* Single Specular Reflection Sweep on Hover */}
            <motion.div
              key={reflectionKey}
              initial={{ x: '-120%', opacity: 0 }}
              animate={{ x: '240%', opacity: cursorPos.isHovered ? [0, 0.45, 0] : 0 }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none z-10"
            />

            {/* Top Intelligence Badge & Icon Hub */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
              <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#12161F]/90 border border-[#2ED9A3]/30 backdrop-blur-md shadow-lg shadow-[#2ED9A3]/10">
                <ScoreGaugeArc score={greenScore.score} size="compact" />
                <div className="text-left font-data">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#F4F6F8]">Enterprise Green Score</span>
                    <span className="text-[9px] font-mono font-bold text-[#2ED9A3] bg-[#2ED9A3]/15 px-1.5 py-0.2 rounded border border-[#2ED9A3]/30">
                      TIER 1
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8891A3]">
                    Neural Telemetry Core • Live GHGP Verified
                  </span>
                </div>
              </div>

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full aurora-gradient-bg mx-auto flex items-center justify-center shadow-xl shadow-[#2ED9A3]/30 transition-transform duration-300 group-hover:scale-105">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-[#0A0E14]" />
              </div>
            </div>

            {/* Existing Preserved Headline */}
            <h2 className="text-3xl sm:text-5xl font-semibold text-[#F4F6F8] font-display max-w-2xl mx-auto leading-tight relative z-10">
              Ready to turn carbon tracking into your competitive advantage?
            </h2>

            {/* Existing Preserved Supporting Description */}
            <p className="text-sm sm:text-base text-[#8891A3] max-w-xl mx-auto relative z-10 leading-relaxed">
              Join enterprise sustainability leaders automating carbon telemetry, cutting energy costs, and securing SEBI BRSR compliance.
            </p>

            {/* Closing Sub-line */}
            <div className="text-xs text-[#2ED9A3] font-data tracking-wide relative z-10">
              A healthier enterprise creates a healthier planet.
            </div>

            {/* Existing Preserved Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative z-10">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto h-12 px-8 shadow-xl shadow-[#2ED9A3]/25 bg-[#2ED9A3] text-[#0A0E14] font-semibold hover:bg-[#2ED9A3]/90"
                >
                  Launch Mission Control Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-[#1A1F2A] bg-[#0A0E14] py-12 px-4 sm:px-8 text-xs text-[#8891A3]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-[6px] aurora-gradient-bg flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-[#0A0E14]" />
          </div>
          <span className="font-display font-semibold text-sm text-[#F4F6F8]">GreenPulse AI</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <span>Track 03 Sustainability & Green Technologies</span>
          <span>GHG Protocol Certified</span>
          <span>SEBI BRSR Compliant</span>
        </div>

        <p>© 2026 GreenPulse AI. All rights reserved.</p>
      </div>
    </footer>
  );
};

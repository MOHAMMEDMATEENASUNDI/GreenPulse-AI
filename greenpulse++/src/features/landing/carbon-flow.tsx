/**
 * @license
 * GreenPulse AI — Animated Carbon Flow & Telemetry Processing Diagram
 * Telemetry-to-Intelligence Telemetry Map with Sustainability Maturity Journey
 */

import React, { useState, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Zap, Leaf, ShieldCheck, Cpu, ArrowRight, Activity, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '../../utils/utils';

interface TelemetryNode {
  id: string;
  category: 'input' | 'processing' | 'output';
  title: string;
  metric: string;
  co2: string;
  type: string;
  maturity: 'BASELINE' | 'PROGRESS' | 'LEADER' | 'NET-ZERO' | 'VERIFIED';
  maturityDesc: string;
  icon: React.ElementType;
  accentColor: string;
  glowColor: string;
  materialStyle: string;
}

export const CarbonFlowDiagram: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string>('ai_engine');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [reflectionKeys, setReflectionKeys] = useState<Record<string, number>>({});
  const reduce = useReducedMotion();

  // Pointer hover coordinates per card for subtle physical light hotspot & 1-2 deg micro-tilt
  const [cursorPos, setCursorPos] = useState<{ id: string | null; x: number; y: number; tiltX: number; tiltY: number }>({
    id: null,
    x: 0,
    y: 0,
    tiltX: 0,
    tiltY: 0,
  });

  const effectiveActive = hoveredNodeId || activeNodeId;

  const nodes: TelemetryNode[] = [
    {
      id: 'solar',
      category: 'input',
      title: 'Solar PV Arrays',
      metric: '1.2 MW Peak',
      co2: '0.00 kg CO₂e/kWh',
      type: 'Renewable Source',
      maturity: 'BASELINE',
      maturityDesc: 'Clean On-Site Generation',
      icon: Zap,
      accentColor: '#2ED9A3',
      glowColor: 'rgba(46,217,163,0.25)',
      materialStyle: 'bg-[#12161F]/95 border-[#242B38] hover:border-[#2ED9A3]/70',
    },
    {
      id: 'grid',
      category: 'input',
      title: 'Industrial Grid Substation',
      metric: '4.8 MWh / day',
      co2: '0.82 kg CO₂e/kWh',
      type: 'Scope 2 Stream',
      maturity: 'PROGRESS',
      maturityDesc: 'Sub-Metered Feeder Telemetry',
      icon: Activity,
      accentColor: '#3FB6E8',
      glowColor: 'rgba(63,182,232,0.25)',
      materialStyle: 'bg-[#101520]/95 border-[#242B38] hover:border-[#3FB6E8]/70',
    },
    {
      id: 'ai_engine',
      category: 'processing',
      title: 'GreenPulse AI Engine',
      metric: '3,500 telemetry records/sec',
      co2: 'Live Optimization Active',
      type: 'Neural Processing',
      maturity: 'LEADER',
      maturityDesc: 'Real-Time GHGP Neural Core',
      icon: Cpu,
      accentColor: '#8B7FFF',
      glowColor: 'rgba(139,127,255,0.3)',
      materialStyle: 'bg-[#141926]/95 border-[#8B7FFF]/50 hover:border-[#8B7FFF]',
    },
    {
      id: 'green_score',
      category: 'output',
      title: 'Enterprise Green Score',
      metric: 'Score: 84 / 100',
      co2: 'Tier 1 Rating',
      type: 'Credit Metric',
      maturity: 'NET-ZERO',
      maturityDesc: 'Standardized ESG Credit Grade',
      icon: Leaf,
      accentColor: '#2ED9A3',
      glowColor: 'rgba(46,217,163,0.3)',
      materialStyle: 'bg-[#111921]/95 border-[#242B38] hover:border-[#2ED9A3]/70',
    },
    {
      id: 'brsr_report',
      category: 'output',
      title: 'SEBI BRSR Compliance',
      metric: 'Principle 6 Verified',
      co2: 'Audit Ready PDF',
      type: 'Regulatory Shield',
      maturity: 'VERIFIED',
      maturityDesc: 'Audit-Ready Board Disclosures',
      icon: ShieldCheck,
      accentColor: '#F5A623',
      glowColor: 'rgba(245,166,35,0.25)',
      materialStyle: 'bg-[#16171D]/95 border-[#242B38] hover:border-[#F5A623]/70',
    },
  ];

  const selectedNode = nodes.find(n => n.id === effectiveActive) || nodes[2];

  const triggerNodeHover = (nodeId: string) => {
    setHoveredNodeId(nodeId);
    setReflectionKeys(prev => ({
      ...prev,
      [nodeId]: (prev[nodeId] || 0) + 1,
    }));
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 1-2 degree micro tilt
    const tiltX = Math.min(Math.max(((y - centerY) / centerY) * -1.5, -2), 2);
    const tiltY = Math.min(Math.max(((x - centerX) / centerX) * 1.5, -2), 2);

    setCursorPos({
      id: nodeId,
      x,
      y,
      tiltX,
      tiltY,
    });
  };

  const handleCardMouseLeave = () => {
    setHoveredNodeId(null);
    setCursorPos({
      id: null,
      x: 0,
      y: 0,
      tiltX: 0,
      tiltY: 0,
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Cinematic scroll depth progression
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const flowScale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [reduce ? 1 : 0.96, 1, 1, reduce ? 1 : 0.97]);
  const flowOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.5]);
  const flowY = useTransform(scrollYProgress, [0, 0.25], [reduce ? 0 : 30, 0]);

  // Determine active flow branch states for SVG connections
  const isSolarActive = effectiveActive === 'solar' || effectiveActive === 'ai_engine' || effectiveActive === 'green_score';
  const isGridActive = effectiveActive === 'grid' || effectiveActive === 'ai_engine' || effectiveActive === 'brsr_report';
  const isGreenScoreActive = effectiveActive === 'green_score' || effectiveActive === 'solar' || effectiveActive === 'ai_engine';
  const isBrsrActive = effectiveActive === 'brsr_report' || effectiveActive === 'grid' || effectiveActive === 'ai_engine';

  return (
    <motion.div
      ref={containerRef}
      style={{
        scale: flowScale,
        opacity: flowOpacity,
        y: flowY,
      }}
      className="will-change-transform"
    >
      <Card variant="surface" className="p-6 sm:p-8 relative overflow-hidden border border-[#242B38]">
      {/* Top Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#171C27] border border-[#242B38] text-[11px] text-[#2ED9A3] mb-2 font-data">
            <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-pulse" />
            Live Carbon Pipeline Flow Architecture
          </div>
          <h3 className="text-xl font-semibold text-[#F4F6F8]">Telemetry-to-Intelligence Telemetry Map</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="emerald" className="shadow-sm shadow-[#2ED9A3]/20">
            Real-time Telemetry Stream
          </Badge>
        </div>
      </motion.div>

      {/* SVG Interactive Flow Map Canvas */}
      <div className="relative min-h-[360px] bg-[#0A0E14] rounded-[14px] p-4 sm:p-7 border border-[#1A1F2A] flex flex-col justify-between overflow-hidden">
        {/* Ambient Engine Backdrop Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none transition-all duration-700 blur-[80px]"
          style={{
            background:
              effectiveActive === 'solar'
                ? 'radial-gradient(circle, rgba(46,217,163,0.18) 0%, transparent 70%)'
                : effectiveActive === 'grid'
                ? 'radial-gradient(circle, rgba(63,182,232,0.18) 0%, transparent 70%)'
                : effectiveActive === 'green_score'
                ? 'radial-gradient(circle, rgba(46,217,163,0.22) 0%, transparent 70%)'
                : effectiveActive === 'brsr_report'
                ? 'radial-gradient(circle, rgba(245,166,35,0.18) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(139,127,255,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Animated Connecting SVG Lines (Desktop / Tablet) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden md:block" preserveAspectRatio="none">
          <defs>
            {/* Gradients for Dynamic Paths */}
            <linearGradient id="solarToAiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2ED9A3" stopOpacity={isSolarActive ? 0.95 : 0.25} />
              <stop offset="100%" stopColor="#8B7FFF" stopOpacity={isSolarActive ? 0.95 : 0.25} />
            </linearGradient>

            <linearGradient id="gridToAiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3FB6E8" stopOpacity={isGridActive ? 0.95 : 0.25} />
              <stop offset="100%" stopColor="#8B7FFF" stopOpacity={isGridActive ? 0.95 : 0.25} />
            </linearGradient>

            <linearGradient id="aiToGreenScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B7FFF" stopOpacity={isGreenScoreActive ? 0.95 : 0.25} />
              <stop offset="100%" stopColor="#2ED9A3" stopOpacity={isGreenScoreActive ? 1 : 0.25} />
            </linearGradient>

            <linearGradient id="aiToBrsrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B7FFF" stopOpacity={isBrsrActive ? 0.95 : 0.25} />
              <stop offset="100%" stopColor="#F5A623" stopOpacity={isBrsrActive ? 0.95 : 0.25} />
            </linearGradient>

            {/* Glowing signal filter */}
            <filter id="signalGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Path 1: Solar Ingest -> AI Core */}
          <line
            x1="22%"
            y1="28%"
            x2="50%"
            y2="50%"
            stroke="url(#solarToAiGrad)"
            strokeWidth={isSolarActive ? '2.5' : '1.5'}
            strokeDasharray={isSolarActive ? '6 4' : '4 6'}
            className="transition-all duration-300"
          />

          {/* Path 2: Grid Ingest -> AI Core */}
          <line
            x1="22%"
            y1="72%"
            x2="50%"
            y2="50%"
            stroke="url(#gridToAiGrad)"
            strokeWidth={isGridActive ? '2.5' : '1.5'}
            strokeDasharray={isGridActive ? '6 4' : '4 6'}
            className="transition-all duration-300"
          />

          {/* Path 3: AI Core -> Green Score Out */}
          <line
            x1="50%"
            y1="50%"
            x2="78%"
            y2="28%"
            stroke="url(#aiToGreenScoreGrad)"
            strokeWidth={isGreenScoreActive ? '2.5' : '1.5'}
            strokeDasharray={isGreenScoreActive ? '6 4' : '4 6'}
            className="transition-all duration-300"
          />

          {/* Path 4: AI Core -> BRSR Compliance Out */}
          <line
            x1="50%"
            y1="50%"
            x2="78%"
            y2="72%"
            stroke="url(#aiToBrsrGrad)"
            strokeWidth={isBrsrActive ? '2.5' : '1.5'}
            strokeDasharray={isBrsrActive ? '6 4' : '4 6'}
            className="transition-all duration-300"
          />

          {/* Moving Signal Light Particles */}
          {!reduce && (
            <>
              {/* Solar to AI particle */}
              <circle r={isSolarActive ? '3.5' : '2'} fill="#2ED9A3" filter="url(#signalGlow)">
                <animateMotion
                  path="M 220 100 L 500 180"
                  dur={isSolarActive ? '2.2s' : '4s'}
                  repeatCount="indefinite"
                />
              </circle>

              {/* Grid to AI particle */}
              <circle r={isGridActive ? '3.5' : '2'} fill="#3FB6E8" filter="url(#signalGlow)">
                <animateMotion
                  path="M 220 260 L 500 180"
                  dur={isGridActive ? '2.5s' : '4.5s'}
                  repeatCount="indefinite"
                />
              </circle>

              {/* AI to Green Score particle */}
              <circle r={isGreenScoreActive ? '4' : '2'} fill="#2ED9A3" filter="url(#signalGlow)">
                <animateMotion
                  path="M 500 180 L 780 100"
                  dur={isGreenScoreActive ? '2s' : '3.8s'}
                  repeatCount="indefinite"
                />
              </circle>

              {/* AI to BRSR particle */}
              <circle r={isBrsrActive ? '3.5' : '2'} fill="#F5A623" filter="url(#signalGlow)">
                <animateMotion
                  path="M 500 180 L 780 260"
                  dur={isBrsrActive ? '2.4s' : '4.2s'}
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </svg>

        {/* Nodes Grid Layout — Staggered Pipeline Entry */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-auto">
          {/* ================= COLUMN 1: OPERATIONAL TELEMETRY IN ================= */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="flex items-center justify-between mb-2"
            >
              <span className="text-[10px] font-semibold text-[#8891A3] uppercase tracking-wider block font-mono">
                1. Operational Telemetry In
              </span>
            </motion.div>

            {nodes
              .filter(n => n.category === 'input')
              .map((n, idx) => {
                const isActive = effectiveActive === n.id;
                const isHovered = hoveredNodeId === n.id;
                const Icon = n.icon;

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 + idx * 0.1 }}
                    onMouseMove={e => handleCardMouseMove(e, n.id)}
                    onMouseEnter={() => triggerNodeHover(n.id)}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={() => setActiveNodeId(n.id)}
                    style={{
                      transform:
                        !reduce && cursorPos.id === n.id
                          ? `perspective(1000px) rotateX(${cursorPos.tiltX}deg) rotateY(${cursorPos.tiltY}deg) translateY(-2px)`
                          : undefined,
                      transformStyle: 'preserve-3d',
                    }}
                    className={cn(
                      'group relative w-full p-4 rounded-[12px] border text-left transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-md',
                      n.materialStyle,
                      isActive
                        ? 'border-[#2ED9A3] shadow-lg scale-[1.01]'
                        : 'border-[#242B38] hover:border-[#2ED9A3]/50'
                    )}
                  >
                    {/* Cursor Light Hotspot */}
                    {cursorPos.id === n.id && (
                      <div
                        className="absolute pointer-events-none rounded-full w-48 h-48 -translate-x-1/2 -translate-y-1/2 opacity-20 z-0 transition-opacity"
                        style={{
                          left: `${cursorPos.x}px`,
                          top: `${cursorPos.y}px`,
                          background: `radial-gradient(circle, ${n.accentColor} 0%, transparent 70%)`,
                        }}
                      />
                    )}

                    {/* Single Glass Reflection Sweep */}
                    <motion.div
                      key={reflectionKeys[n.id] || 0}
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '200%', opacity: isHovered ? [0, 0.6, 0] : 0 }}
                      transition={{ duration: 0.7, ease: 'easeInOut' }}
                      className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none z-10"
                    />

                    {/* Card Content */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-[8px] bg-[#171C27] flex items-center justify-center border transition-all duration-200',
                            isActive ? 'border-[#2ED9A3] shadow-md shadow-[#2ED9A3]/20' : 'border-[#242B38]'
                          )}
                        >
                          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: n.accentColor }} />
                        </div>
                        <div>
                          {/* Maturity State Badge / Eyebrow */}
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={cn(
                                'text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.2 rounded transition-colors',
                                isActive
                                  ? 'bg-[#2ED9A3]/20 text-[#2ED9A3] border border-[#2ED9A3]/30'
                                  : 'bg-[#171C27] text-[#8891A3] border border-[#242B38]'
                              )}
                            >
                              {n.maturity}
                            </span>
                            <span className="text-[10px] text-[#8891A3] hidden group-hover:inline transition-opacity">
                              {n.type}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-[#F4F6F8] block group-hover:text-[#F4F6F8]">
                            {n.title}
                          </span>
                          <span className="text-[11px] font-data text-[#8891A3] block">
                            {n.metric}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        className={cn(
                          'w-4 h-4 text-[#8891A3] transition-transform duration-200',
                          isActive ? 'text-[#2ED9A3] translate-x-1' : 'group-hover:translate-x-0.5'
                        )}
                      />
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* ================= COLUMN 2: AI INTELLIGENCE CORE ================= */}
          <div className="flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-center mb-2"
            >
              <span className="text-[10px] font-semibold text-[#8891A3] uppercase tracking-wider block font-mono">
                2. AI Intelligence Core
              </span>
            </motion.div>

            {(() => {
              const aiNode = nodes[2];
              const isActive = effectiveActive === 'ai_engine';
              const isHovered = hoveredNodeId === 'ai_engine';

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  onMouseMove={e => handleCardMouseMove(e, 'ai_engine')}
                  onMouseEnter={() => triggerNodeHover('ai_engine')}
                  onMouseLeave={handleCardMouseLeave}
                  onClick={() => setActiveNodeId('ai_engine')}
                  style={{
                    transform:
                      !reduce && cursorPos.id === 'ai_engine'
                        ? `perspective(1000px) rotateX(${cursorPos.tiltX}deg) rotateY(${cursorPos.tiltY}deg) scale(1.02)`
                        : undefined,
                    transformStyle: 'preserve-3d',
                  }}
                  className={cn(
                    'group relative w-full max-w-xs p-5 rounded-[14px] bg-[#141926]/95 border text-center transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl',
                    isActive
                      ? 'border-[#8B7FFF] shadow-[0_0_30px_rgba(139,127,255,0.25)] ring-1 ring-[#8B7FFF]/40 scale-[1.02]'
                      : 'border-[#242B38] hover:border-[#8B7FFF]/70'
                  )}
                >
                  {/* Cursor Hotspot Light */}
                  {cursorPos.id === 'ai_engine' && (
                    <div
                      className="absolute pointer-events-none rounded-full w-56 h-56 -translate-x-1/2 -translate-y-1/2 opacity-25 z-0"
                      style={{
                        left: `${cursorPos.x}px`,
                        top: `${cursorPos.y}px`,
                        background: 'radial-gradient(circle, #8B7FFF 0%, transparent 70%)',
                      }}
                    />
                  )}

                  {/* Single Specular Reflection Sweep */}
                  <motion.div
                    key={reflectionKeys['ai_engine'] || 0}
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '200%', opacity: isHovered ? [0, 0.7, 0] : 0 }}
                    transition={{ duration: 0.75, ease: 'easeInOut' }}
                    className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#8B7FFF]/30 to-transparent -skew-x-12 pointer-events-none z-10"
                  />

                  {/* Center Hub Graphic */}
                  <div className="relative z-10">
                    <div
                      className={cn(
                        'w-13 h-13 rounded-full aurora-gradient-bg mx-auto flex items-center justify-center shadow-lg mb-3 transition-transform duration-300',
                        isActive ? 'scale-110 shadow-[#8B7FFF]/40' : 'group-hover:scale-105'
                      )}
                    >
                      <Cpu className="w-6 h-6 text-[#0A0E14] animate-pulse" />
                    </div>

                    {/* Maturity State Eyebrow */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#8B7FFF]/20 border border-[#8B7FFF]/30 text-[9px] font-mono font-bold text-[#8B7FFF] mb-1.5 uppercase">
                      <Sparkles className="w-2.5 h-2.5" />
                      {aiNode.maturity}
                    </div>

                    <h4 className="text-sm font-semibold text-[#F4F6F8]">{aiNode.title}</h4>
                    <p
                      className={cn(
                        'text-[11px] font-data mt-1 transition-colors',
                        isActive ? 'text-[#2ED9A3] font-bold' : 'text-[#2ED9A3]'
                      )}
                    >
                      {aiNode.metric}
                    </p>

                    <div className="inline-flex items-center gap-1 mt-2 text-[10px] text-[#8891A3] bg-[#0A0E14]/60 px-2.5 py-1 rounded-full border border-[#1E2638]">
                      <CheckCircle2 className="w-3 h-3 text-[#2ED9A3]" /> GHGP Factor Mapping Active
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>

          {/* ================= COLUMN 3: AUDIT & GREEN SCORE OUT ================= */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="flex items-center justify-between mb-2"
            >
              <span className="text-[10px] font-semibold text-[#8891A3] uppercase tracking-wider block font-mono">
                3. Audit & Green Score Out
              </span>
            </motion.div>

            {nodes
              .filter(n => n.category === 'output')
              .map((n, idx) => {
                const isActive = effectiveActive === n.id;
                const isHovered = hoveredNodeId === n.id;
                const Icon = n.icon;

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                    onMouseMove={e => handleCardMouseMove(e, n.id)}
                    onMouseEnter={() => triggerNodeHover(n.id)}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={() => setActiveNodeId(n.id)}
                    style={{
                      transform:
                        !reduce && cursorPos.id === n.id
                          ? `perspective(1000px) rotateX(${cursorPos.tiltX}deg) rotateY(${cursorPos.tiltY}deg) translateY(-2px)`
                          : undefined,
                      transformStyle: 'preserve-3d',
                    }}
                    className={cn(
                      'group relative w-full p-4 rounded-[12px] border text-left transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-md',
                      n.materialStyle,
                      isActive
                        ? n.id === 'green_score'
                          ? 'border-[#2ED9A3] shadow-lg shadow-[#2ED9A3]/15 scale-[1.01]'
                          : 'border-[#F5A623] shadow-lg shadow-[#F5A623]/15 scale-[1.01]'
                        : 'border-[#242B38]'
                    )}
                  >
                    {/* Cursor Light Hotspot */}
                    {cursorPos.id === n.id && (
                      <div
                        className="absolute pointer-events-none rounded-full w-48 h-48 -translate-x-1/2 -translate-y-1/2 opacity-20 z-0"
                        style={{
                          left: `${cursorPos.x}px`,
                          top: `${cursorPos.y}px`,
                          background: `radial-gradient(circle, ${n.accentColor} 0%, transparent 70%)`,
                        }}
                      />
                    )}

                    {/* Single Glass Reflection Sweep */}
                    <motion.div
                      key={reflectionKeys[n.id] || 0}
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '200%', opacity: isHovered ? [0, 0.6, 0] : 0 }}
                      transition={{ duration: 0.7, ease: 'easeInOut' }}
                      className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none z-10"
                    />

                    {/* Card Content */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-[8px] bg-[#171C27] flex items-center justify-center border transition-all duration-200',
                            isActive
                              ? n.id === 'green_score'
                                ? 'border-[#2ED9A3] shadow-md shadow-[#2ED9A3]/25'
                                : 'border-[#F5A623] shadow-md shadow-[#F5A623]/25'
                              : 'border-[#242B38]'
                          )}
                        >
                          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: n.accentColor }} />
                        </div>
                        <div>
                          {/* Maturity State Badge / Eyebrow */}
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={cn(
                                'text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.2 rounded transition-colors',
                                isActive
                                  ? n.id === 'green_score'
                                    ? 'bg-[#2ED9A3]/20 text-[#2ED9A3] border border-[#2ED9A3]/30'
                                    : 'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30'
                                  : 'bg-[#171C27] text-[#8891A3] border border-[#242B38]'
                              )}
                            >
                              {n.maturity}
                            </span>
                            <span className="text-[10px] text-[#8891A3] hidden group-hover:inline transition-opacity">
                              {n.type}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-[#F4F6F8] block group-hover:text-[#F4F6F8]">
                            {n.title}
                          </span>
                          <span
                            className={cn(
                              'text-[11px] font-data block transition-colors',
                              isActive && n.id === 'green_score'
                                ? 'text-[#2ED9A3] font-bold'
                                : isActive && n.id === 'brsr_report'
                                ? 'text-[#F5A623] font-bold'
                                : 'text-[#8891A3]'
                            )}
                          >
                            {n.metric}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        className={cn(
                          'w-4 h-4 text-[#8891A3] transition-transform duration-200',
                          isActive ? 'text-[#2ED9A3] translate-x-1' : 'group-hover:translate-x-0.5'
                        )}
                      />
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ENGINE INSPECTOR ================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-4 p-4 rounded-[12px] bg-[#12161F]/90 backdrop-blur-md border border-[#242B38] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group"
      >
        {/* Subtle Light Scan Line on Inspector Reactivity */}
        <motion.div
          key={effectiveActive}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '200%', opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-[#2ED9A3]/20 to-transparent -skew-x-12 pointer-events-none"
        />

        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-[8px] bg-[#171C27] border border-[#242B38] flex items-center justify-center transition-all duration-300"
            style={{
              borderColor: `${selectedNode.accentColor}50`,
              boxShadow: `0 0 15px ${selectedNode.glowColor}`,
            }}
          >
            <selectedNode.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" style={{ color: selectedNode.accentColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F4F6F8] block">
                {selectedNode.title} Inspector
              </span>
              <span
                className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border"
                style={{
                  color: selectedNode.accentColor,
                  borderColor: `${selectedNode.accentColor}40`,
                  backgroundColor: `${selectedNode.accentColor}15`,
                }}
              >
                {selectedNode.maturity}
              </span>
            </div>
            <span className="text-xs text-[#8891A3]">
              {selectedNode.type} • {selectedNode.co2}
            </span>
          </div>
        </div>

        <div className="font-data text-xs bg-[#171C27] px-3.5 py-2 rounded-[8px] border border-[#242B38] flex items-center gap-2 relative z-10">
          <span className="text-[#8891A3] uppercase text-[10px] font-mono">Current Metric:</span>
          <motion.span
            key={selectedNode.metric}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-bold font-data"
            style={{ color: selectedNode.accentColor }}
          >
            {selectedNode.metric}
          </motion.span>
        </div>
      </motion.div>
    </Card>
  </motion.div>
  );
};

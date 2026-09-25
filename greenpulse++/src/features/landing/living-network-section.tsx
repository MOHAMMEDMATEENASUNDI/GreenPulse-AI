/**
 * @license
 * GreenPulse AI — Living Carbon Intelligence Network
 * Cinematic Biological Intelligence Mesh: Carbon, Energy, ESG, AI, Compliance, Green Score
 */

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { LuminousTechGrid } from '../../components/motion/motion-components';
import { Sparkles, Activity } from 'lucide-react';
import { cn } from '../../utils/utils';

interface NetworkNode {
  id: string;
  category: 'Carbon' | 'Energy' | 'ESG' | 'AI' | 'Compliance' | 'Green Score';
  label: string;
  value: string;
  color: string;
  pathId: string;
  dur: string;
  begin?: string;
  depth: 'near' | 'mid' | 'far';
  baseScale: number;
}

const NETWORK_NODES: NetworkNode[] = [
  {
    id: 'node-1',
    category: 'Carbon',
    label: 'Scope 1 Fuel',
    value: '240.5 tCO₂e',
    color: '#2ED9A3',
    pathId: 'streamPath1',
    dur: '14s',
    depth: 'near',
    baseScale: 1.1,
  },
  {
    id: 'node-2',
    category: 'Energy',
    label: 'Grid Power Intake',
    value: '4,280 MWh',
    color: '#3FB6E8',
    pathId: 'orbitPath1',
    dur: '16s',
    depth: 'near',
    baseScale: 1.0,
  },
  {
    id: 'node-3',
    category: 'ESG',
    label: 'BRSR Principle 6',
    value: 'Verified',
    color: '#8B7FFF',
    pathId: 'streamPath2',
    dur: '18s',
    begin: '3s',
    depth: 'mid',
    baseScale: 0.95,
  },
  {
    id: 'node-4',
    category: 'AI',
    label: 'Anomaly Copilot',
    value: 'Active 24/7',
    color: '#F5A623',
    pathId: 'loopPath1',
    dur: '13s',
    begin: '2s',
    depth: 'near',
    baseScale: 1.05,
  },
  {
    id: 'node-5',
    category: 'Compliance',
    label: 'CSRD Disclosure',
    value: 'Audit Ready',
    color: '#2ED9A3',
    pathId: 'orbitPath2',
    dur: '20s',
    depth: 'far',
    baseScale: 0.85,
  },
  {
    id: 'node-6',
    category: 'Green Score',
    label: 'Enterprise Rating',
    value: '84 / 100 A',
    color: '#3FB6E8',
    pathId: 'infinityPath',
    dur: '15s',
    begin: '1s',
    depth: 'near',
    baseScale: 1.1,
  },
  {
    id: 'node-7',
    category: 'Carbon',
    label: 'Scope 3 Supply',
    value: '380.2 tCO₂e',
    color: '#8B7FFF',
    pathId: 'orbitPath2',
    dur: '22s',
    begin: '6s',
    depth: 'far',
    baseScale: 0.85,
  },
  {
    id: 'node-8',
    category: 'Energy',
    label: 'Solar Microgrid',
    value: '1.2 MW Peak',
    color: '#2ED9A3',
    pathId: 'streamPath1',
    dur: '15s',
    begin: '7s',
    depth: 'mid',
    baseScale: 0.95,
  },
  {
    id: 'node-9',
    category: 'AI',
    label: 'Optimization AI',
    value: '99.4% Precision',
    color: '#F5A623',
    pathId: 'infinityPath',
    dur: '17s',
    begin: '5s',
    depth: 'near',
    baseScale: 1.0,
  },
  {
    id: 'node-10',
    category: 'Compliance',
    label: 'EU Taxonomy',
    value: '100% Aligned',
    color: '#3FB6E8',
    pathId: 'streamPath2',
    dur: '19s',
    begin: '8s',
    depth: 'mid',
    baseScale: 0.9,
  },
  {
    id: 'node-11',
    category: 'ESG',
    label: 'Water Circularity',
    value: '94.2% Recycled',
    color: '#8B7FFF',
    pathId: 'arcPath1',
    dur: '12s',
    depth: 'far',
    baseScale: 0.85,
  },
  {
    id: 'node-12',
    category: 'Green Score',
    label: 'Carbon Intensity',
    value: '-18.4% YoY',
    color: '#2ED9A3',
    pathId: 'arcPath2',
    dur: '13s',
    begin: '4s',
    depth: 'mid',
    baseScale: 0.95,
  },
];

// SVG Path definitions for organic radial network
const PATH_DEFINITIONS = {
  orbitPath1: 'M 250,320 C 250,190 750,190 750,320 C 750,450 250,450 250,320 Z',
  orbitPath2: 'M 140,320 C 140,110 860,110 860,320 C 860,530 140,530 140,320 Z',
  streamPath1: 'M 70,100 C 250,170 380,270 500,320 C 620,370 750,470 930,540',
  streamPath2: 'M 80,540 C 250,470 380,370 500,320 C 620,270 750,170 920,100',
  infinityPath: 'M 500,320 C 360,190 220,290 340,380 C 440,430 560,210 660,260 C 780,350 640,450 500,320 Z',
  loopPath1: 'M 500,200 C 630,200 650,370 500,440 C 350,440 370,200 500,200 Z',
  arcPath1: 'M 180,150 C 370,250 630,250 820,150',
  arcPath2: 'M 160,490 C 350,390 650,390 840,490',
};

export const LivingNetworkSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isEngineHovered, setIsEngineHovered] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Scroll Progress linking for subtle rotational and opacity evolution
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacityEvolve = useTransform(scrollYProgress, [0.08, 0.35, 0.7, 0.92], [0.25, 1, 1, 0.25]);

  return (
    <section
      ref={containerRef}
      className="py-24 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[#1A1F2A] relative overflow-hidden select-none"
    >
      {/* Ambient background tech grid */}
      <LuminousTechGrid />

      {/* Header — Restrained, Cinematic Hierarchy */}
      <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12161F]/90 border border-[#2ED9A3]/30 text-xs font-semibold text-[#2ED9A3] mb-3 shadow-lg backdrop-blur-md">
          <Activity className="w-3.5 h-3.5 text-[#2ED9A3] animate-pulse" />
          Living Carbon Intelligence Network
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#F4F6F8] mb-3 font-display tracking-tight leading-tight">
          Biological dataset mesh
        </h2>

        <p className="text-sm sm:text-base text-[#8891A3] max-w-xl mx-auto leading-relaxed">
          Continuous, living telemetry streams converging from carbon, energy, ESG, and compliance vectors into GreenPulse AI.
        </p>

        {/* Floating Telemetry Category Filter Tags */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-6">
          {['Carbon', 'Energy', 'ESG', 'AI', 'Compliance', 'Green Score'].map((cat) => {
            const isActive = activeCategory === cat;
            const categoryColors: Record<string, string> = {
              Carbon: '#2ED9A3',
              Energy: '#3FB6E8',
              ESG: '#8B7FFF',
              AI: '#F5A623',
              Compliance: '#2ED9A3',
              'Green Score': '#3FB6E8',
            };
            const accentColor = categoryColors[cat] || '#2ED9A3';

            return (
              <button
                key={cat}
                onMouseEnter={() => setActiveCategory(cat)}
                onMouseLeave={() => setActiveCategory(null)}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase transition-all duration-300 border flex items-center gap-1.5 backdrop-blur-md cursor-pointer',
                  isActive
                    ? 'bg-[#12161F] text-[#F4F6F8] shadow-lg shadow-[#2ED9A3]/15 scale-105'
                    : 'bg-[#0E131C]/60 text-[#8891A3] border-[#1E2638] hover:border-[#2ED9A3]/40 hover:text-[#F4F6F8]'
                )}
                style={{
                  borderColor: isActive ? accentColor : undefined,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full transition-transform duration-300"
                  style={{
                    backgroundColor: accentColor,
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Living Radial Network Canvas */}
      <div className="relative w-full h-[460px] sm:h-[600px] flex items-center justify-center">
        {/* Soft Radial Atmospheric Bloom behind central core */}
        <motion.div
          style={{ opacity: opacityEvolve }}
          className="absolute w-[360px] h-[360px] sm:w-[540px] sm:h-[540px] rounded-full bg-radial from-[#2ED9A3]/16 via-[#3FB6E8]/8 to-transparent blur-[90px] pointer-events-none"
        />

        <svg
          className="w-full h-full relative z-10 overflow-visible"
          viewBox="0 0 1000 640"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Organic Network Gradient Trajectories */}
            <linearGradient id="netGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2ED9A3" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#3FB6E8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#8B7FFF" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="netGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B7FFF" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#F5A623" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#2ED9A3" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="coreAuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2ED9A3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3FB6E8" stopOpacity="0.8" />
            </linearGradient>

            {/* Glowing filter for nodes and telemetry pulse */}
            <filter id="softNodeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Luminous Organic Curved Orbital Paths */}
          <g className="transition-opacity duration-500">
            {/* Primary Inner Orbit */}
            <path
              id="orbitPath1"
              d={PATH_DEFINITIONS.orbitPath1}
              fill="none"
              stroke="url(#netGrad1)"
              strokeWidth={activeCategory ? 1.0 : 1.4}
              strokeDasharray="4 6"
              className={cn('transition-all duration-300', activeCategory ? 'opacity-40' : 'opacity-65')}
            />

            {/* Outer Orbit */}
            <path
              id="orbitPath2"
              d={PATH_DEFINITIONS.orbitPath2}
              fill="none"
              stroke="url(#netGrad2)"
              strokeWidth={activeCategory ? 0.8 : 1.2}
              strokeDasharray="2 8"
              className={cn('transition-all duration-300', activeCategory ? 'opacity-30' : 'opacity-45')}
            />

            {/* Convergent Diagonal S-Stream 1 */}
            <path
              id="streamPath1"
              d={PATH_DEFINITIONS.streamPath1}
              fill="none"
              stroke="url(#netGrad1)"
              strokeWidth={activeCategory ? 1.0 : 1.3}
              strokeDasharray="5 7"
              className={cn('transition-all duration-300', activeCategory ? 'opacity-40' : 'opacity-60')}
            />

            {/* Convergent Diagonal S-Stream 2 */}
            <path
              id="streamPath2"
              d={PATH_DEFINITIONS.streamPath2}
              fill="none"
              stroke="url(#netGrad2)"
              strokeWidth={activeCategory ? 1.0 : 1.3}
              strokeDasharray="5 7"
              className={cn('transition-all duration-300', activeCategory ? 'opacity-40' : 'opacity-60')}
            />

            {/* Infinity Figure-8 Orbital Flow */}
            <path
              id="infinityPath"
              d={PATH_DEFINITIONS.infinityPath}
              fill="none"
              stroke="url(#netGrad1)"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              className={cn('transition-all duration-300', activeCategory ? 'opacity-30' : 'opacity-50')}
            />

            {/* Concentric Eccentric Core Loop */}
            <path
              id="loopPath1"
              d={PATH_DEFINITIONS.loopPath1}
              fill="none"
              stroke="url(#netGrad2)"
              strokeWidth="1.0"
              strokeDasharray="4 6"
              className={cn('transition-all duration-300', activeCategory ? 'opacity-30' : 'opacity-45')}
            />

            {/* Upper Telemetry Arc */}
            <path
              id="arcPath1"
              d={PATH_DEFINITIONS.arcPath1}
              fill="none"
              stroke="#8B7FFF"
              strokeWidth="0.9"
              strokeDasharray="3 9"
              strokeOpacity="0.35"
            />

            {/* Lower Telemetry Arc */}
            <path
              id="arcPath2"
              d={PATH_DEFINITIONS.arcPath2}
              fill="none"
              stroke="#2ED9A3"
              strokeWidth="0.9"
              strokeDasharray="3 9"
              strokeOpacity="0.35"
            />
          </g>

          {/* 2. Fast Luminous Telemetry Travel Pulses along selected streams */}
          {!reduce && (
            <g className="pointer-events-none">
              {/* Pulse 1: Emerald telemetry stream */}
              <circle r="3" fill="#2ED9A3" filter="url(#pulseGlow)">
                <animateMotion
                  path={PATH_DEFINITIONS.streamPath1}
                  dur="4.5s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Pulse 2: Cyan telemetry stream */}
              <circle r="3" fill="#3FB6E8" filter="url(#pulseGlow)">
                <animateMotion
                  path={PATH_DEFINITIONS.streamPath2}
                  dur="5.2s"
                  begin="1.2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Pulse 3: Violet ESG stream */}
              <circle r="2.5" fill="#8B7FFF" filter="url(#pulseGlow)">
                <animateMotion
                  path={PATH_DEFINITIONS.infinityPath}
                  dur="6.8s"
                  begin="2.5s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Pulse 4: Amber AI stream */}
              <circle r="2.5" fill="#F5A623" filter="url(#pulseGlow)">
                <animateMotion
                  path={PATH_DEFINITIONS.orbitPath1}
                  dur="6.0s"
                  begin="3.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

          {/* 3. Central Intelligence Core: GreenPulse Engine Anchor */}
          <g
            transform="translate(500, 320)"
            className="cursor-pointer"
            onMouseEnter={() => setIsEngineHovered(true)}
            onMouseLeave={() => setIsEngineHovered(false)}
          >
            {/* Outer Emerald Breathing Halo */}
            <circle
              r={isEngineHovered ? 82 : 74}
              fill="#2ED9A3"
              fillOpacity={isEngineHovered ? 0.12 : 0.06}
              filter="url(#pulseGlow)"
              className="transition-all duration-500"
            />

            {/* Rotating Technical Calibrated Ring */}
            <circle
              r="68"
              fill="none"
              stroke="#2ED9A3"
              strokeWidth="1.2"
              strokeDasharray="4 8"
              strokeOpacity={isEngineHovered ? 0.9 : 0.55}
              className="transition-all duration-300"
            >
              {!reduce && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="24s"
                  repeatCount="indefinite"
                />
              )}
            </circle>

            {/* Counter-rotating cyan secondary ring */}
            <circle
              r="58"
              fill="none"
              stroke="#3FB6E8"
              strokeWidth="0.9"
              strokeDasharray="2 6"
              strokeOpacity={isEngineHovered ? 0.8 : 0.4}
              className="transition-all duration-300"
            >
              {!reduce && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="360"
                  to="0"
                  dur="18s"
                  repeatCount="indefinite"
                />
              )}
            </circle>

            {/* Dark Core Obsidian Body */}
            <circle
              r="48"
              fill="#0A0E14"
              stroke="url(#coreAuraGrad)"
              strokeWidth="1.8"
              filter="url(#softNodeGlow)"
            />

            {/* Inner Core Ambient Glow */}
            <circle
              r="38"
              fill="#121824"
              fillOpacity="0.9"
              stroke="#3FB6E8"
              strokeWidth="1"
              strokeOpacity="0.6"
            >
              {!reduce && (
                <animate
                  attributeName="r"
                  values="36;39;36"
                  dur="3.6s"
                  repeatCount="indefinite"
                />
              )}
            </circle>

            {/* Center Core Typography & Sparkle */}
            <foreignObject x="-44" y="-44" width="88" height="88" className="pointer-events-none">
              <div className="w-full h-full flex flex-col items-center justify-center text-center select-none">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full bg-[#2ED9A3]/20 flex items-center justify-center text-[#2ED9A3] mb-0.5 border border-[#2ED9A3]/40 transition-transform duration-300',
                    isEngineHovered ? 'scale-110 shadow-lg shadow-[#2ED9A3]/30' : ''
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#2ED9A3]" />
                </div>
                <span className="text-[7.5px] font-mono font-bold uppercase tracking-widest text-[#2ED9A3] block leading-none">
                  GREENPULSE
                </span>
                <span className="text-[9.5px] font-bold text-[#F4F6F8] leading-tight font-display tracking-wide mt-0.5">
                  ENGINE
                </span>
              </div>
            </foreignObject>
          </g>

          {/* 4. Organically Distributed Traveling Telemetry Nodes */}
          {NETWORK_NODES.map((node) => {
            const isCategoryMatch = activeCategory ? node.category === activeCategory : true;
            const isHovered = hoveredNodeId === node.id;
            const pathData = (PATH_DEFINITIONS as Record<string, string>)[node.pathId];

            // Opacity and scale based on depth tier
            const depthOpacity = node.depth === 'near' ? 1.0 : node.depth === 'mid' ? 0.85 : 0.65;
            const finalOpacity = isCategoryMatch ? (isHovered ? 1.0 : depthOpacity) : 0.18;

            return (
              <g
                key={node.id}
                className="transition-opacity duration-300 cursor-pointer"
                opacity={finalOpacity}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                <g>
                  {!reduce && pathData && (
                    <animateMotion
                      path={pathData}
                      dur={node.dur}
                      begin={node.begin || '0s'}
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  )}

                  {/* Luminous Node Core */}
                  <circle
                    r={isHovered ? 6.5 : 4.5 * node.baseScale}
                    fill={node.color}
                    filter="url(#softNodeGlow)"
                  />

                  {/* Outer delicate ring */}
                  <circle
                    r={isHovered ? 12 : 9 * node.baseScale}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="0.8"
                    strokeDasharray="2 3"
                    strokeOpacity={isHovered ? 0.9 : 0.5}
                  />

                  {/* Minimal Technical Typography (Non-card floating metadata) */}
                  <g className="pointer-events-none select-none">
                    <text
                      x="0"
                      y="-11"
                      textAnchor="middle"
                      fill="#F4F6F8"
                      fontSize="9"
                      fontWeight="600"
                      className="font-data tracking-tight"
                      fillOpacity={isHovered ? 1 : 0.9}
                    >
                      {node.label}
                    </text>
                    <text
                      x="0"
                      y="18"
                      textAnchor="middle"
                      fill={node.color}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="700"
                      letterSpacing="0.02em"
                      fillOpacity={isHovered ? 1 : 0.85}
                    >
                      {node.value}
                    </text>
                  </g>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary Technical Indicator Footer */}
      <div className="mt-6 text-center relative z-10">
        <p className="text-xs text-[#8891A3] font-mono flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-ping" />
          Autonomous node synchronization: 12 telemetry streams active
        </p>
      </div>
    </section>
  );
};


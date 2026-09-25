/**
 * @license
 * GreenPulse AI — Interactive Embedded Dashboard Sandbox Preview Widget
 * Live interactive preview widget embedded inside the landing page with
 * premium physical material response, glass reflection sweep, and AI impact reveal.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, type Variants } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScoreGaugeArc } from '../../components/ui/score-gauge-arc';
import {
  LayoutDashboard,
  Leaf,
  Zap,
  ShieldCheck,
  Bot,
  ArrowRight,
  Sliders,
  Sparkles,
  Check,
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/utils';

export const InteractiveDashboardPreview: React.FC<{ onLaunch?: () => void }> = ({ onLaunch }) => {
  const [activeTab, setActiveTab] = useState<'score' | 'carbon' | 'energy' | 'esg' | 'copilot'>('score');
  const [direction, setDirection] = useState<number>(1);
  const [hvacLoadShift, setHvacLoadShift] = useState<number>(30); // % shift
  const [isSliderActive, setIsSliderActive] = useState<boolean>(false);
  const [reflectionKey, setReflectionKey] = useState<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const TAB_INDEX_MAP: Record<string, number> = {
    score: 0,
    carbon: 1,
    energy: 2,
    esg: 3,
    copilot: 4,
  };

  const handleTabSelect = (tabId: 'score' | 'carbon' | 'energy' | 'esg' | 'copilot') => {
    if (tabId === activeTab) return;
    const prevIndex = TAB_INDEX_MAP[activeTab];
    const nextIndex = TAB_INDEX_MAP[tabId];
    setDirection(nextIndex > prevIndex ? 1 : -1);
    setActiveTab(tabId);
    setReflectionKey((prev) => prev + 1);
  };

  // Pointer hover & 3D tilt state (max 3-4px translation, 1-2 deg tilt)
  const [hoverState, setHoverState] = useState({
    isHovered: false,
    x: 0,
    y: 0,
    tiltX: 0,
    tiltY: 0,
  });

  // Dynamic calculated score based on slider
  const baseScore = 78;
  const calculatedScore = Math.min(100, Math.round(baseScore + (hvacLoadShift / 100) * 12));
  const calculatedSavings = Math.round((hvacLoadShift / 100) * 125000);

  // Trigger glass reflection sweep & emerald highlight when slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setHvacLoadShift(val);
    setIsSliderActive(true);
    setReflectionKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!isSliderActive) return;
    const timer = setTimeout(() => setIsSliderActive(false), 800);
    return () => clearTimeout(timer);
  }, [hvacLoadShift, isSliderActive]);

  // Handle subtle 3D tilt & cursor light source (max 1-2deg tilt)
  const handlePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Constrain tilt between -1.8deg and +1.8deg
    const tiltX = Math.min(Math.max(((y - centerY) / centerY) * -1.8, -1.8), 1.8);
    const tiltY = Math.min(Math.max(((x - centerX) / centerX) * 1.8, -1.8), 1.8);

    setHoverState({
      isHovered: true,
      x,
      y,
      tiltX,
      tiltY,
    });
  };

  const handlePanelMouseLeave = () => {
    setHoverState({
      isHovered: false,
      x: 0,
      y: 0,
      tiltX: 0,
      tiltY: 0,
    });
  };

  // MotionView-inspired intelligence layer depth transition variants
  const layerVariants: Variants = {
    enter: (dir: number) => ({
      opacity: 0,
      y: reduce ? 0 : dir * 14,
      x: reduce ? 0 : dir * 6,
      scale: reduce ? 1 : 0.975,
      rotateX: reduce ? 0 : dir * -1.2,
      rotateZ: reduce ? 0 : dir * 0.8,
    }),
    center: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      rotateX: 0,
      rotateZ: 0,
      transition: {
        duration: 0.42,
        ease: [0.16, 1, 0.3, 1] as unknown as [number, number, number, number],
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      y: reduce ? 0 : dir * -14,
      x: reduce ? 0 : dir * -6,
      scale: reduce ? 1 : 0.97,
      rotateX: reduce ? 0 : dir * 1.2,
      rotateZ: reduce ? 0 : dir * -0.8,
      transition: {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1] as unknown as [number, number, number, number],
      },
    }),
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Cinematic scroll depth progression
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const sandboxScale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [reduce ? 1 : 0.95, 1, 1, reduce ? 1 : 0.96]);
  const sandboxOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.5]);
  const sandboxY = useTransform(scrollYProgress, [0, 0.25], [reduce ? 0 : 35, 0]);

  return (
    <motion.div
      ref={containerRef}
      style={{
        scale: sandboxScale,
        opacity: sandboxOpacity,
        y: sandboxY,
      }}
      className="will-change-transform"
    >
      <Card variant="surface" className="p-4 sm:p-8 border border-[#242B38] relative overflow-hidden select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#171C27] border border-[#242B38] text-[11px] text-[#2ED9A3] mb-2 font-data">
            <Sparkles className="w-3.5 h-3.5 text-[#2ED9A3]" />
            Live Interactive Sandbox Preview
          </div>
          <h3 className="text-xl font-semibold text-[#F4F6F8]">Test GreenPulse OS Engine</h3>
        </div>
        <Button size="sm" onClick={onLaunch}>
          Launch Full Mission Control
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      {/* Embedded Window Shell Header */}
      <div className="rounded-[12px] bg-[#0A0E14] border border-[#1A1F2A] overflow-hidden shadow-2xl relative">
        {/* Top Control Bar */}
        <div className="h-10 bg-[#12161F] border-b border-[#1A1F2A] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F0554C]/80" />
            <span className="w-3 h-3 rounded-full bg-[#F5A623]/80" />
            <span className="w-3 h-3 rounded-full bg-[#2ED9A3]/80" />
            <span className="text-[11px] text-[#8891A3] font-data ml-2">https://greenpulse.ai/sandbox-demo</span>
          </div>
          <Badge variant="emerald">100% Live Simulated Pipeline</Badge>
        </div>

        {/* Tab Switcher Bar */}
        <div className="flex items-center gap-2 p-2 bg-[#12161F]/60 border-b border-[#1A1F2A] overflow-x-auto relative">
          {[
            { id: 'score', label: 'Green Score', icon: Leaf },
            { id: 'carbon', label: 'Scope 1/2/3', icon: BarChart3 },
            { id: 'energy', label: 'HVAC Anomaly', icon: Zap },
            { id: 'esg', label: 'BRSR Compliance', icon: ShieldCheck },
            { id: 'copilot', label: 'AI Copilot', icon: Bot },
          ].map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabSelect(t.id as any)}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors whitespace-nowrap z-10 cursor-pointer',
                  isActive ? 'text-[#2ED9A3]' : 'text-[#8891A3] hover:text-[#F4F6F8]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-[#171C27] border border-[#2ED9A3]/50 rounded-[6px] -z-10 shadow-sm shadow-[#2ED9A3]/20"
                  />
                )}
                <t.icon className={cn('w-3.5 h-3.5 transition-colors', isActive ? 'text-[#2ED9A3]' : 'text-[#8891A3]')} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Layer Depth Light Sweep across Sandbox Surface */}
        <motion.div
          key={reflectionKey}
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: '220%', opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#2ED9A3]/15 to-transparent -skew-x-12 pointer-events-none z-20"
        />

        {/* Sandbox Stacked Tab Content with MotionView Layer Transitions */}
        <div
          style={{ perspective: reduce ? undefined : '1200px' }}
          className="p-6 bg-[#0A0E14] min-h-[340px] flex flex-col justify-between relative overflow-hidden"
        >
          <AnimatePresence mode="wait" custom={direction}>
            {activeTab === 'score' && (
              <motion.div
                key="tab-score"
                custom={direction}
                variants={layerVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="space-y-6 will-change-transform"
              >
                {/* Enhanced Premium Green Score Glass Panel */}
                <div
                  ref={panelRef}
                  onMouseMove={handlePanelMouseMove}
                  onMouseLeave={handlePanelMouseLeave}
                  style={{
                    transform: !reduce && hoverState.isHovered ? `perspective(1000px) rotateX(${hoverState.tiltX}deg) rotateY(${hoverState.tiltY}deg)` : undefined,
                    transformStyle: 'preserve-3d',
                  }}
                  className={cn(
                    'relative flex flex-col md:flex-row items-center justify-between gap-6 p-5 rounded-[12px] bg-[#12161F]/90 backdrop-blur-xl border transition-all duration-300 overflow-hidden',
                    hoverState.isHovered || isSliderActive
                      ? 'border-[#2ED9A3] shadow-lg shadow-[#2ED9A3]/15'
                      : 'border-[#242B38]'
                  )}
                >
                  {/* Cursor Light Hotspot */}
                  {hoverState.isHovered && hoverState.x > 0 && (
                    <div
                      className="absolute pointer-events-none rounded-full w-64 h-64 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 opacity-20 z-0"
                      style={{
                        left: `${hoverState.x}px`,
                        top: `${hoverState.y}px`,
                        background: 'radial-gradient(circle, #2ED9A3 0%, transparent 70%)',
                      }}
                    />
                  )}

                  {/* Left: Gauge & Title */}
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                      <ScoreGaugeArc score={calculatedScore} size="hero" />
                      {/* Energy pulse around gauge during slider adjustment */}
                      {isSliderActive && (
                        <span className="absolute inset-0 rounded-full border border-[#2ED9A3] animate-ping opacity-60 pointer-events-none" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-[#F4F6F8]">Calculated Green Score</h4>
                        {hvacLoadShift >= 50 && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#2ED9A3]/20 text-[#2ED9A3] border border-[#2ED9A3]/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> AI Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8891A3] max-w-sm leading-relaxed">
                        Adjust the slider below to simulate shifting peak chiller load to off-peak renewable hours.
                      </p>
                    </div>
                  </div>

                  {/* Right: Simulated Monthly Savings Metric */}
                  <div className="text-right font-data relative z-10 bg-[#0A0E14]/70 p-3.5 rounded-[10px] border border-[#1E2638]">
                    <span className="text-[10px] uppercase text-[#8891A3] block font-mono font-bold tracking-wider mb-0.5">
                      Simulated Monthly Savings
                    </span>
                    <motion.span
                      animate={{ scale: isSliderActive ? 1.06 : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={cn(
                        'text-2xl font-extrabold font-data block transition-colors duration-300',
                        isSliderActive ? 'text-[#3FB6E8]' : 'text-[#2ED9A3]'
                      )}
                    >
                      ₹{calculatedSavings.toLocaleString()}
                    </motion.span>
                    <span className="text-[10px] text-[#2ED9A3] font-mono flex items-center justify-end gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +{(hvacLoadShift * 0.4).toFixed(1)}% Efficiency Boost
                    </span>
                  </div>
                </div>

                {/* Interactive Simulation Slider */}
                <div className="p-4 rounded-[10px] bg-[#12161F] border border-[#242B38] space-y-3 relative">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F4F6F8] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#3FB6E8]" /> Off-Peak Load Shift Percentage
                    </span>
                    <span className="font-data text-[#3FB6E8] font-bold px-2 py-0.5 bg-[#171C27] rounded border border-[#3FB6E8]/30">
                      {hvacLoadShift}% Shifted
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={hvacLoadShift}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-[#171C27] rounded-lg appearance-none cursor-pointer accent-[#2ED9A3]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8891A3] font-data">
                    <span>0% (Current Baseline)</span>
                    <span className={cn(hvacLoadShift >= 50 ? 'text-[#2ED9A3] font-bold' : '')}>
                      50% (Recommended)
                    </span>
                    <span className={cn(hvacLoadShift === 100 ? 'text-[#3FB6E8] font-bold' : '')}>
                      100% (Maximum Green)
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'carbon' && (
              <motion.div
                key="tab-carbon"
                custom={direction}
                variants={layerVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="space-y-4 will-change-transform"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-[8px] bg-[#12161F] border border-[#242B38]">
                    <span className="text-[10px] uppercase text-[#8891A3] block">Scope 1 (Direct)</span>
                    <span className="font-data text-lg font-bold text-[#F4F6F8]">184.2 t CO₂e</span>
                  </div>
                  <div className="p-4 rounded-[8px] bg-[#12161F] border border-[#242B38]">
                    <span className="text-[10px] uppercase text-[#8891A3] block">Scope 2 (Electricity)</span>
                    <span className="font-data text-lg font-bold text-[#2ED9A3]">340.8 t CO₂e</span>
                  </div>
                  <div className="p-4 rounded-[8px] bg-[#12161F] border border-[#242B38]">
                    <span className="text-[10px] uppercase text-[#8891A3] block">Scope 3 (Supply Chain)</span>
                    <span className="font-data text-lg font-bold text-[#8B7FFF]">620.5 t CO₂e</span>
                  </div>
                </div>
                <p className="text-xs text-[#8891A3] text-center pt-2">
                  Automated GHGP emission factor mapping updated against India Central Electricity Authority (CEA) v20.0 factors.
                </p>
              </motion.div>
            )}

            {activeTab === 'energy' && (
              <motion.div
                key="tab-energy"
                custom={direction}
                variants={layerVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="p-4 rounded-[10px] bg-[#12161F] border border-[#F0554C]/40 space-y-3 will-change-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F0554C]">Active Anomaly: Floor 3 HVAC Spike</span>
                  <Badge variant="error">+40% vs Baseline</Badge>
                </div>
                <p className="text-xs text-[#8891A3]">
                  AI detected unoptimized cooling cycle at 14:30 PM during maximum tariff window.
                </p>
                <Button size="sm" onClick={onLaunch}>
                  Apply AI Mitigation Rule
                </Button>
              </motion.div>
            )}

            {activeTab === 'esg' && (
              <motion.div
                key="tab-esg"
                custom={direction}
                variants={layerVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="space-y-2 will-change-transform"
              >
                <div className="p-3 rounded-[8px] bg-[#12161F] border border-[#242B38] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F4F6F8]">SEBI BRSR Principle 6 (Environment)</span>
                  <Badge variant="emerald">100% Validated</Badge>
                </div>
                <div className="p-3 rounded-[8px] bg-[#12161F] border border-[#242B38] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F4F6F8]">EU CSRD Scope 1 & 2 Disclosures</span>
                  <Badge variant="emerald">Audit Ready</Badge>
                </div>
              </motion.div>
            )}

            {activeTab === 'copilot' && (
              <motion.div
                key="tab-copilot"
                custom={direction}
                variants={layerVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="p-4 rounded-[10px] bg-[#12161F] border border-[#8B7FFF]/40 space-y-2 will-change-transform"
              >
                <span className="text-xs font-semibold text-[#8B7FFF] block">Copilot Prompt Preview:</span>
                <p className="text-xs text-[#F4F6F8] italic bg-[#0A0E14] p-2.5 rounded-[6px] border border-[#242B38]">
                  "How can Pune plant achieve a 15% reduction in Scope 2 carbon before Q4 BRSR filing?"
                </p>
                <p className="text-xs text-[#2ED9A3] font-data pt-1">
                  Copilot Solution: Re-route 400 kWh off-peak load to Solar PV storage array. Est. ROI: 22 days.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  </motion.div>
  );
};


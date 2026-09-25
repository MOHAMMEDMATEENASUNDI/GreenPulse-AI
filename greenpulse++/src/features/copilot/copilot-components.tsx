/**
 * @license
 * GreenPulse AI — Enterprise Copilot Intelligence Center
 * Grounded sustainability copilot with markdown rendering, progressive disclosure layers,
 * human-in-the-loop approvals, inline citations, structured step-trace loading, and currency standardization (₹).
 * Enhanced with bespoke motion choreography, smooth accordion chevrons, staggered audit chains, and restrained glass feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { triggerGlassSweep } from '../../utils/glass-sweep';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  CopilotMessage,
  CopilotPromptTemplate,
  SUGGESTED_PROMPTS,
  INITIAL_CONVERSATION,
  PRESET_KNOWLEDGE_RESPONSES,
  CopilotRecommendation,
  CopilotCitation,
} from './copilot-data';
import {
  Bot,
  Send,
  Sparkles,
  Flame,
  Zap,
  ShieldCheck,
  Truck,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  X,
  BarChart3,
  Sliders,
  CheckCircle2,
  FileText,
  Clock,
  Info,
} from 'lucide-react';
import { cn } from '../../utils/utils';

/* ==========================================================================
   HELPER: Prompt category icon mapping
   ========================================================================== */
const renderPromptIcon = (name: string) => {
  switch (name) {
    case 'Flame':
      return <Flame className="w-3.5 h-3.5 text-[#F0554C]" />;
    case 'Zap':
      return <Zap className="w-3.5 h-3.5 text-[#F5A623]" />;
    case 'ShieldCheck':
      return <ShieldCheck className="w-3.5 h-3.5 text-[#2ED9A3]" />;
    case 'Sparkles':
      return <Sparkles className="w-3.5 h-3.5 text-[#8B7FFF]" />;
    case 'Truck':
      return <Truck className="w-3.5 h-3.5 text-[#3FB6E8]" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-[#2ED9A3]" />;
  }
};

/* ==========================================================================
   1. MARKDOWN RENDERER COMPONENT WITH REFINED GREENPULSE STYLING
   ========================================================================== */
export const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-invert text-xs max-w-none font-sans leading-relaxed text-[#D6DBE4] space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-[#F4F6F8] font-display mt-2.5 mb-1.5">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-[#F4F6F8] font-display mt-2 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-[#2ED9A3] font-display mt-2.5 mb-1 tracking-wide uppercase">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-2 leading-relaxed text-[#D6DBE4] last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#F4F6F8] text-[#2ED9A3]/90">{children}</strong>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1.5 text-[#D6DBE4]">{children}</ul>,
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-1.5 text-[#D6DBE4]">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-[#0A0E14] border border-[#242B38] text-[11px] font-data text-[#3FB6E8]">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#8B7FFF] pl-2.5 py-0.5 my-2 text-[#8891A3] italic bg-[#0A0E14]/40 rounded-r">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-[8px] border border-[#242B38]">
              <table className="w-full border-collapse text-[11px] font-data">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-[#242B38] bg-[#0A0E14] px-2.5 py-1.5 text-left font-semibold text-[#2ED9A3]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[#1A1F2A] px-2.5 py-1.5 text-[#D6DBE4]">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

/* ==========================================================================
   2. INLINE CHART COMPONENT FOR CONVERSATIONS (WITH BAR DRAW-IN ANIMATION)
   ========================================================================== */
const MessageInlineChart: React.FC<{
  chart: CopilotMessage['chart'];
  isActive?: boolean;
  onFocus?: () => void;
}> = ({ chart, isActive = false, onFocus }) => {
  const reduceMotion = useReducedMotion();
  if (!chart) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
      onClick={onFocus}
      className={cn(
        'p-3.5 rounded-[12px] bg-[#0A0E14] border transition-all duration-200 space-y-2',
        isActive
          ? 'border-[#3FB6E8]/60 ring-1 ring-[#3FB6E8]/25 shadow-[0_4px_16px_rgba(63,182,232,0.12)]'
          : 'border-[#242B38] hover:border-[#384252]'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-[#3FB6E8]" />
          <span className="text-xs font-semibold text-[#F4F6F8] font-data">{chart.title}</span>
        </div>
        <span className="text-[10px] text-[#2ED9A3] font-data font-bold px-2 py-0.5 rounded bg-[#2ED9A3]/10 border border-[#2ED9A3]/20">
          Unit: {chart.unit}
        </span>
      </div>

      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'area' ? (
            <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ED9A3" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#2ED9A3" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1F2A" />
              <XAxis dataKey="name" stroke="#8891A3" fontSize={10} tickLine={false} />
              <YAxis stroke="#8891A3" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12161F',
                  borderColor: '#242B38',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#2ED9A3' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2ED9A3"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chartGrad)"
                isAnimationActive={!reduceMotion}
                animationDuration={650}
                animationEasing="ease-out"
              />
            </AreaChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1F2A" />
              <XAxis dataKey="name" stroke="#8891A3" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#8891A3"
                fontSize={10}
                tickLine={false}
                tickFormatter={val => (chart.unit === '₹' ? `₹${(val / 1000).toFixed(0)}k` : `${val}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12161F',
                  borderColor: '#242B38',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(val: number) => [
                  chart.unit === '₹' ? `₹${val.toLocaleString('en-IN')}` : `${val} ${chart.unit}`,
                  'Tariff Cost',
                ]}
                itemStyle={{ color: '#3FB6E8' }}
              />
              <Bar
                dataKey="value"
                fill="#3FB6E8"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!reduceMotion}
                animationDuration={650}
                animationEasing="ease-out"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

/* ==========================================================================
   3. HUMAN-IN-THE-LOOP ACTION CARD COMPONENT (WITH BESPOKE SUCCESS SEQUENCE)
   ========================================================================== */
const MessageRecommendationCard: React.FC<{
  rec: CopilotRecommendation;
  greenScoreImpact?: CopilotMessage['greenScoreImpact'];
  isActive?: boolean;
  onFocus?: () => void;
  onApplyAction?: (rec: CopilotRecommendation) => void;
}> = ({ rec, greenScoreImpact, isActive = false, onFocus, onApplyAction }) => {
  const reduceMotion = useReducedMotion();
  const [actionState, setActionState] = useState<'pending' | 'applied' | 'dismissed'>(
    rec.status === 'Applied' ? 'applied' : 'pending'
  );
  const [appliedTime, setAppliedTime] = useState<string | null>(
    rec.status === 'Applied' ? '10:45 AM' : null
  );
  const [isSuccessPulsing, setIsSuccessPulsing] = useState(false);

  const handleApprove = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActionState('applied');
    setAppliedTime(timeStr);
    setIsSuccessPulsing(true);
    setTimeout(() => setIsSuccessPulsing(false), 900);
    onApplyAction?.(rec);
  };

  const handleDismiss = () => {
    setActionState('dismissed');
  };

  const isApplied = actionState === 'applied';
  const isDismissed = actionState === 'dismissed';

  return (
    <motion.div
      layout
      onClick={onFocus}
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: isDismissed ? 0.58 : 1,
        scale: isDismissed ? 0.98 : 1,
        y: 0,
        boxShadow: isSuccessPulsing
          ? '0 0 24px rgba(46,217,163,0.38)'
          : isApplied
          ? '0 4px 20px rgba(46,217,163,0.12)'
          : isActive
          ? '0 4px 18px rgba(139,127,255,0.14)'
          : '0 2px 10px rgba(0,0,0,0.2)',
      }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'p-4 rounded-[12px] border transition-colors duration-200 relative overflow-hidden',
        isDismissed
          ? 'bg-[#0A0E14]/70 border-[#242B38]'
          : isApplied
          ? 'bg-[#2ED9A3]/5 border-[#2ED9A3]/40'
          : isActive
          ? 'bg-[#12161F]/95 border-[#8B7FFF]/60 ring-1 ring-[#8B7FFF]/25'
          : 'bg-[#12161F]/90 border-[#8B7FFF]/30 hover:border-[#8B7FFF]/50'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <motion.div
            key={actionState}
            initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : isApplied
                ? { scale: [0, 1.22, 1], opacity: 1, rotate: [0, -6, 0] }
                : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 text-xs shadow-sm',
              isApplied
                ? 'bg-[#2ED9A3] text-[#0A0E14]'
                : isDismissed
                ? 'bg-[#242B38] text-[#8891A3]'
                : 'bg-[#8B7FFF]/20 text-[#8B7FFF]'
            )}
          >
            {isApplied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Zap className="w-3.5 h-3.5" />}
          </motion.div>
          <span className="text-xs font-bold text-[#F4F6F8] font-display truncate">{rec.title}</span>
        </div>

        {isApplied ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Badge variant="emerald" icon={<CheckCircle2 className="w-3 h-3" />}>
              Applied to SCADA
            </Badge>
          </motion.div>
        ) : isDismissed ? (
          <Badge variant="neutral">Dismissed</Badge>
        ) : (
          <Badge variant="violet">{rec.category}</Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 font-data text-xs mb-3">
        <div className="p-2 rounded-[8px] bg-[#0A0E14]/80 border border-[#1A1F2A]">
          <span className="text-[10px] text-[#8891A3] block uppercase tracking-wider">Est. Savings</span>
          <span className="font-bold text-[#2ED9A3]">{rec.estimatedSavings}</span>
        </div>
        <div className="p-2 rounded-[8px] bg-[#0A0E14]/80 border border-[#1A1F2A]">
          <span className="text-[10px] text-[#8891A3] block uppercase tracking-wider">CO₂ Abatement</span>
          <span className="font-bold text-[#3FB6E8]">{rec.co2Reduction}</span>
        </div>
        <div className="p-2 rounded-[8px] bg-[#0A0E14]/80 border border-[#1A1F2A]">
          <span className="text-[10px] text-[#8891A3] block uppercase tracking-wider">Payback</span>
          <span className="font-bold text-[#F5A623]">{rec.roiMonths} mo</span>
        </div>
      </div>

      {/* Projected vs Achieved Green Score Impact */}
      {greenScoreImpact && (
        <motion.div
          layout
          className={cn(
            'p-2.5 rounded-[8px] border text-xs font-data flex items-center justify-between mb-3 transition-colors duration-200',
            isApplied
              ? 'bg-[#2ED9A3]/10 border-[#2ED9A3]/30 text-[#2ED9A3]'
              : 'bg-[#0A0E14] border-[#242B38] text-[#8891A3]'
          )}
        >
          <span className="text-[11px]">
            {isApplied ? 'Green Score Impact Achieved:' : 'Projected Green Score Impact:'}
          </span>
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold', isApplied ? 'text-[#F4F6F8]' : 'text-[#8891A3]')}>
              {greenScoreImpact.current} → {greenScoreImpact.potential}
            </span>
            <Badge variant={isApplied ? 'emerald' : 'neutral'}>
              {isApplied ? greenScoreImpact.delta : `Projected ${greenScoreImpact.delta}`}
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Decision Controls */}
      <div className="pt-2 border-t border-[#1A1F2A] flex items-center justify-between gap-3 min-h-[34px]">
        {actionState === 'pending' ? (
          <>
            <span className="text-[11px] text-[#8891A3] font-data flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#8B7FFF]" />
              Human approval required prior to SCADA dispatch
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.15)' }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.14 }}
                onClick={handleDismiss}
                className="h-7 px-2.5 rounded-[6px] text-xs font-data text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#1A1F2A] border border-transparent hover:border-[#242B38] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#8891A3]/40 focus-visible:outline-none"
              >
                Dismiss
              </motion.button>
              <motion.button
                whileHover={reduceMotion ? {} : { y: -1.5, filter: 'brightness(1.08)' }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.14 }}
                onClick={handleApprove}
                className="h-7 px-3 rounded-[6px] text-xs bg-[#2ED9A3] text-[#0A0E14] font-semibold hover:bg-[#25C492] shadow-sm flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2ED9A3]/50 focus-visible:outline-none"
              >
                <Check className="w-3.5 h-3.5" />
                Approve & Apply
              </motion.button>
            </div>
          </>
        ) : isApplied ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            className="w-full flex items-center justify-between text-[11px] font-data text-[#2ED9A3]"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3]" />
              Applied at {appliedTime || '10:45 AM'} via Automated SCADA Gateway
            </span>
            <span className="text-[10px] text-[#8891A3] font-mono">Status: Verified</span>
          </motion.div>
        ) : (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full flex items-center justify-between text-[11px] font-data text-[#8891A3]"
          >
            <span>Recommendation dismissed by operator</span>
            <motion.button
              whileHover={reduceMotion ? {} : { y: -1 }}
              whileTap={reduceMotion ? {} : { scale: 0.97 }}
              onClick={() => setActionState('pending')}
              className="text-[11px] text-[#8B7FFF] hover:text-[#2ED9A3] transition-colors underline cursor-pointer font-medium focus-visible:outline-none"
            >
              Reconsider
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/* ==========================================================================
   4. CITATION CHIP COMPONENT (WITH HOVER TOOLTIP DETAIL)
   ========================================================================== */
const CitationPill: React.FC<{ citation: CopilotCitation }> = ({ citation }) => {
  const reduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.span
        whileHover={reduceMotion ? {} : { y: -1, borderColor: 'rgba(63, 182, 232, 0.75)', backgroundColor: '#141A24' }}
        transition={{ duration: 0.14 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#12161F] border border-[#242B38] text-[10px] text-[#3FB6E8] font-data transition-colors cursor-help select-none"
      >
        <FileText className="w-3 h-3 text-[#3FB6E8] shrink-0" />
        <span className="truncate max-w-[170px]">{citation.title}</span>
      </motion.span>

      {/* Detail Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 p-2 rounded-[8px] bg-[#0E131C] border border-[#3FB6E8]/40 shadow-[0_8px_20px_rgba(0,0,0,0.5)] z-50 pointer-events-none text-left font-data text-[10px] space-y-1 backdrop-blur-md"
          >
            <div className="flex items-center justify-between text-[#3FB6E8] font-semibold border-b border-[#1E2636] pb-1">
              <span className="truncate">{citation.title}</span>
              <Info className="w-2.5 h-2.5 text-[#3FB6E8] shrink-0" />
            </div>
            <p className="text-[#F4F6F8] leading-tight text-[10px]">{citation.source}</p>
            <p className="text-[#8891A3] leading-tight text-[9px]">{citation.relevance}</p>
            {/* Pointer arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0E131C] border-r border-b border-[#3FB6E8]/40 rotate-45 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==========================================================================
   5. SINGLE MESSAGE COMPONENT (WITH PROGRESSIVE DISCLOSURE & ROTATING CHEVRONS)
   ========================================================================== */
const MessageItem: React.FC<{
  message: CopilotMessage;
  onApplyAction?: (rec: CopilotRecommendation) => void;
}> = ({ message, onApplyAction }) => {
  const reduceMotion = useReducedMotion();
  const [showChart, setShowChart] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [activeSection, setActiveSection] = useState<'chart' | 'action' | 'reasoning' | null>(null);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const isAssistant = message.sender === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleChart = () => {
    const next = !showChart;
    setShowChart(next);
    if (next) setActiveSection('chart');
    else if (activeSection === 'chart') setActiveSection(null);
  };

  const toggleAction = () => {
    const next = !showAction;
    setShowAction(next);
    if (next) setActiveSection('action');
    else if (activeSection === 'action') setActiveSection(null);
  };

  const toggleReasoning = () => {
    const next = !showReasoning;
    setShowReasoning(next);
    if (next) setActiveSection('reasoning');
    else if (activeSection === 'reasoning') setActiveSection(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex gap-3 max-w-[92%] sm:max-w-[88%]', isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse')}
    >
      {/* Avatar */}
      <motion.div
        whileHover={reduceMotion ? {} : { scale: 1.05 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 text-xs font-bold font-data shadow-md border',
          isAssistant
            ? 'bg-gradient-to-br from-[#8B7FFF] to-[#2ED9A3] text-[#0A0E14] border-[#8B7FFF]/30'
            : 'bg-[#2ED9A3] text-[#0A0E14] border-[#2ED9A3]/40'
        )}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : 'YOU'}
      </motion.div>

      {/* Bubble Container */}
      <motion.div layout className="space-y-2 flex-1 min-w-0">
        <div
          className={cn(
            'p-4 rounded-[14px] text-xs leading-relaxed space-y-3 shadow-lg backdrop-blur-md transition-all duration-200',
            isAssistant
              ? 'bg-[#12161F]/90 border border-[#242B38] text-[#F4F6F8] rounded-tl-none border-l-2 border-l-[#8B7FFF] hover:border-[#384252]'
              : 'bg-[#2ED9A3]/15 border border-[#2ED9A3]/30 text-[#F4F6F8] rounded-tr-none'
          )}
        >
          {/* Layer 1: Always Visible Direct Markdown Response */}
          <div className="font-sans">
            <MarkdownContent content={message.text} />
          </div>

          {/* Inline Grounded Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#8891A3] font-data">Grounded In:</span>
              {message.citations.map(c => (
                <CitationPill key={c.id} citation={c} />
              ))}
            </div>
          )}

          {/* Progressive Disclosure Section for Assistant */}
          {isAssistant && (message.chart || message.recommendationCard || (message.reasoningSteps && message.reasoningSteps.length > 0)) && (
            <motion.div layout className="pt-2.5 border-t border-[#1A1F2A] space-y-2.5">
              {/* Layer Toggles Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Supporting Chart Toggle */}
                {message.chart && (
                  <motion.button
                    whileHover={reduceMotion ? {} : { y: -1, borderColor: 'rgba(63, 182, 232, 0.6)' }}
                    whileTap={reduceMotion ? {} : { scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    onClick={toggleChart}
                    className={cn(
                      'px-2.5 py-1 rounded-[8px] text-[11px] font-data border transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3FB6E8]/40 focus-visible:outline-none',
                      showChart
                        ? 'bg-[#3FB6E8]/15 border-[#3FB6E8]/40 text-[#3FB6E8]'
                        : 'bg-[#0A0E14] border-[#242B38] text-[#8891A3] hover:text-[#F4F6F8]'
                    )}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{showChart ? 'Hide Supporting Chart' : 'Show Supporting Chart'}</span>
                    <motion.span
                      animate={{ rotate: showChart ? 180 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="inline-flex items-center justify-center"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </motion.span>
                  </motion.button>
                )}

                {/* 2. Recommended Action Toggle */}
                {message.recommendationCard && (
                  <motion.button
                    whileHover={reduceMotion ? {} : { y: -1, borderColor: 'rgba(46, 217, 163, 0.6)' }}
                    whileTap={reduceMotion ? {} : { scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    onClick={toggleAction}
                    className={cn(
                      'px-2.5 py-1 rounded-[8px] text-[11px] font-data border transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2ED9A3]/40 focus-visible:outline-none',
                      showAction
                        ? 'bg-[#2ED9A3]/15 border-[#2ED9A3]/40 text-[#2ED9A3]'
                        : 'bg-[#0A0E14] border-[#242B38] text-[#8891A3] hover:text-[#F4F6F8]'
                    )}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{showAction ? 'Hide Recommended Action' : 'Show Recommended Action'}</span>
                    <motion.span
                      animate={{ rotate: showAction ? 180 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="inline-flex items-center justify-center"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </motion.span>
                  </motion.button>
                )}

                {/* 3. AI Reasoning Toggle */}
                {message.reasoningSteps && message.reasoningSteps.length > 0 && (
                  <motion.button
                    whileHover={reduceMotion ? {} : { y: -1, borderColor: 'rgba(139, 127, 255, 0.6)' }}
                    whileTap={reduceMotion ? {} : { scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    onClick={toggleReasoning}
                    className={cn(
                      'px-2.5 py-1 rounded-[8px] text-[11px] font-data border transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#8B7FFF]/40 focus-visible:outline-none',
                      showReasoning
                        ? 'bg-[#8B7FFF]/15 border-[#8B7FFF]/40 text-[#8B7FFF]'
                        : 'bg-[#0A0E14] border-[#242B38] text-[#8891A3] hover:text-[#F4F6F8]'
                    )}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{showReasoning ? 'Hide AI Reasoning' : 'Show AI Reasoning & Source Queries'}</span>
                    <motion.span
                      animate={{ rotate: showReasoning ? 180 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="inline-flex items-center justify-center"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </motion.span>
                  </motion.button>
                )}
              </div>

              {/* Layer 2: Expandable Supporting Chart */}
              <AnimatePresence>
                {showChart && message.chart && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="pt-1"
                  >
                    <MessageInlineChart
                      chart={message.chart}
                      isActive={activeSection === 'chart'}
                      onFocus={() => setActiveSection('chart')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Layer 3: Expandable Recommended Action Card */}
              <AnimatePresence>
                {showAction && message.recommendationCard && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="pt-1"
                  >
                    <MessageRecommendationCard
                      rec={message.recommendationCard}
                      greenScoreImpact={message.greenScoreImpact}
                      isActive={activeSection === 'action'}
                      onFocus={() => setActiveSection('action')}
                      onApplyAction={onApplyAction}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Layer 4: Expandable AI Reasoning Trace (WITH STAGGERED LIST REVEAL) */}
              <AnimatePresence>
                {showReasoning && message.reasoningSteps && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setActiveSection('reasoning')}
                    className={cn(
                      'p-3.5 rounded-[10px] bg-[#0A0E14] border space-y-2 font-data text-[11px] text-[#8891A3] transition-all duration-200',
                      activeSection === 'reasoning'
                        ? 'border-[#8B7FFF]/60 ring-1 ring-[#8B7FFF]/25 shadow-[0_4px_16px_rgba(139,127,255,0.12)]'
                        : 'border-[#1A1F2A] hover:border-[#384252]'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[#2ED9A3] uppercase text-[10px] tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2ED9A3]" />
                      <span>Verification Chain & Telemetry Audit:</span>
                    </div>
                    <ul className="space-y-1.5 pl-1">
                      {message.reasoningSteps.map((step, sIdx) => (
                        <motion.li
                          key={sIdx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.22,
                            delay: reduceMotion ? 0 : sIdx * 0.12,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="flex items-start gap-2 leading-relaxed text-[#D6DBE4]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B7FFF] shrink-0 mt-1.5" />
                          <span>{step}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Message Footer Controls */}
        {isAssistant && (
          <div className="flex items-center justify-between text-[10px] font-data text-[#8891A3] px-1">
            <span>{message.timestamp}</span>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={reduceMotion ? {} : { scale: 1.15, color: '#F4F6F8' }}
                whileTap={reduceMotion ? {} : { scale: 0.9 }}
                transition={{ duration: 0.12 }}
                onClick={handleCopy}
                className="hover:text-[#F4F6F8] transition-colors cursor-pointer p-0.5"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2ED9A3]" /> : <Copy className="w-3.5 h-3.5" />}
              </motion.button>
              <motion.button
                whileHover={reduceMotion ? {} : { scale: 1.15 }}
                whileTap={reduceMotion ? {} : { scale: 0.9 }}
                transition={{ duration: 0.12 }}
                onClick={() => setLiked(true)}
                className={cn('hover:text-[#2ED9A3] cursor-pointer transition-colors p-0.5', liked === true && 'text-[#2ED9A3]')}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileHover={reduceMotion ? {} : { scale: 1.15 }}
                whileTap={reduceMotion ? {} : { scale: 0.9 }}
                transition={{ duration: 0.12 }}
                onClick={() => setLiked(false)}
                className={cn('hover:text-[#F0554C] cursor-pointer transition-colors p-0.5', liked === false && 'text-[#F0554C]')}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ==========================================================================
   6. STRUCTURED STEP-TRACE LOADING INDICATOR
   ========================================================================== */
const CopilotThinkingTrace: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Reading telemetry & SCADA meter feeds',
    'Cross-referencing GHG Protocol & tariffs',
    'Synthesizing grounded recommendation',
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 380);
    const timer2 = setTimeout(() => setCurrentStep(2), 760);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="p-3.5 rounded-[12px] bg-[#12161F]/90 border border-[#242B38] max-w-md space-y-2.5 font-data text-xs shadow-lg"
    >
      <div className="flex items-center gap-2 text-[#8B7FFF] font-display font-semibold text-xs">
        <Sparkles className="w-4 h-4 animate-spin text-[#8B7FFF]" />
        <span>GreenPulse Intelligence Engine</span>
      </div>

      <div className="space-y-1.5 pl-1">
        {steps.map((label, idx) => {
          const isDone = currentStep > idx;
          const isActive = currentStep === idx;
          return (
            <motion.div
              key={idx}
              initial={false}
              animate={{ opacity: isDone ? 0.9 : isActive ? 1 : 0.4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-[11px]"
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3] shrink-0" />
              ) : isActive ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#8B7FFF] border-t-transparent animate-spin shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-[#242B38] shrink-0" />
              )}
              <span
                className={cn(
                  isDone ? 'text-[#2ED9A3]' : isActive ? 'text-[#F4F6F8] font-medium' : 'text-[#8891A3]/60'
                )}
              >
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ==========================================================================
   7. COPILOT FULL WORKSPACE EXPERIENCE
   ========================================================================== */
export const CopilotFullWorkspace: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<CopilotMessage[]>(INITIAL_CONVERSATION);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState('Chakan Pune HQ');
  const [selectedScope, setSelectedScope] = useState('All Scopes');
  const [selectedTimeframe, setSelectedTimeframe] = useState('2026 YTD');
  const [isScopePopoverOpen, setIsScopePopoverOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close scope popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsScopePopoverOpen(false);
      }
    };
    if (isScopePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isScopePopoverOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim()) return;

    const userMessage: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: promptText,
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // AI Simulation Response Logic
    setTimeout(() => {
      let matchedResponse: Partial<CopilotMessage> = {};

      const lower = promptText.toLowerCase();
      if (lower.includes('surge') || lower.includes('chakan') || lower.includes('emissions')) {
        matchedResponse = PRESET_KNOWLEDGE_RESPONSES.surge;
      } else if (lower.includes('load') || lower.includes('hvac') || lower.includes('tariff') || lower.includes('energy')) {
        matchedResponse = PRESET_KNOWLEDGE_RESPONSES.load;
      } else if (lower.includes('brsr') || lower.includes('esg') || lower.includes('sebi')) {
        matchedResponse = PRESET_KNOWLEDGE_RESPONSES.brsr;
      } else if (lower.includes('score') || lower.includes('green') || lower.includes('audit')) {
        matchedResponse = PRESET_KNOWLEDGE_RESPONSES.score;
      } else {
        matchedResponse = {
          text: `Analyzing enterprise logs for **"${promptText}"** across **${selectedFacility}**.\n\nBased on real-time SCADA telemetry, current facility power demand is 8,580 MW across renewable PPAs. No critical emission anomalies detected in the selected reporting window (${selectedTimeframe}).`,
          reasoningSteps: [
            `Queried SCADA sub-meter DB filtered by ${selectedFacility}`,
            `Checked GHG Protocol Scope 1/2/3 accounting boundary under ${selectedScope}`,
          ],
        };
      }

      const assistantMsg: CopilotMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: matchedResponse.text || 'Analysis complete.',
        reasoningSteps: matchedResponse.reasoningSteps,
        citations: matchedResponse.citations,
        recommendationCard: matchedResponse.recommendationCard,
        chart: matchedResponse.chart,
        greenScoreImpact: matchedResponse.greenScoreImpact,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
      triggerGlassSweep();
    }, 1100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative flex flex-col h-[calc(100vh-140px)] min-h-[620px] rounded-[14px] bg-[#0E121A]/90 backdrop-blur-xl border border-[#242B38]/90 shadow-[0_12px_36px_rgba(0,0,0,0.35)] overflow-hidden"
    >
      {/* Workspace Header */}
      <div className="p-4 bg-[#12161F]/95 border-b border-[#242B38] flex items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={reduceMotion ? {} : { scale: 1.05 }}
            transition={{ duration: 0.15 }}
            className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#8B7FFF] to-[#2ED9A3] flex items-center justify-center text-[#0A0E14] shadow-md border border-[#8B7FFF]/30 shrink-0"
          >
            <Bot className="w-5 h-5" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm font-bold text-[#F4F6F8] font-display">
                GreenPulse AI Enterprise Copilot
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 text-[11px] font-data text-[#2ED9A3] shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ED9A3] animate-pulse" />
                Live SCADA Sync
              </span>
            </div>

            {/* Compact Context Breadcrumb with Edit Popover Trigger */}
            <div className="flex items-center gap-2 text-xs font-data mt-0.5 flex-wrap">
              <span className="text-[#8891A3]">
                Context: <span className="text-[#2ED9A3] font-medium">{selectedFacility}</span> • Scope:{' '}
                <span className="text-[#3FB6E8] font-medium">{selectedScope}</span> • Window:{' '}
                <span className="text-[#8B7FFF] font-medium">{selectedTimeframe}</span>
              </span>

              <motion.button
                whileHover={reduceMotion ? {} : { y: -1, borderColor: 'rgba(139, 127, 255, 0.6)', backgroundColor: '#171D29' }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.14 }}
                onClick={() => setIsScopePopoverOpen(!isScopePopoverOpen)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#0A0E14] border border-[#242B38] text-[10px] text-[#8891A3] hover:text-[#F4F6F8] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#8B7FFF]/40 focus-visible:outline-none"
                title="Edit Scope Context"
              >
                <Sliders className="w-3 h-3 text-[#8B7FFF]" />
                <span>Edit Scope</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Clear Chat Button */}
        <motion.button
          whileHover={reduceMotion ? {} : { y: -1, borderColor: 'rgba(56, 66, 82, 1)' }}
          whileTap={reduceMotion ? {} : { scale: 0.97 }}
          transition={{ duration: 0.14 }}
          onClick={() => setMessages(INITIAL_CONVERSATION)}
          className="px-2.5 py-1.5 rounded-[8px] bg-[#12161F] border border-[#242B38] text-xs font-data text-[#8891A3] hover:text-[#F4F6F8] transition-colors flex items-center gap-1.5 group cursor-pointer shadow-sm shrink-0 focus-visible:ring-2 focus-visible:ring-[#8891A3]/40 focus-visible:outline-none"
          title="Reset conversation state"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#8891A3] group-hover:text-[#2ED9A3] group-hover:-rotate-45 transition-transform duration-200" />
          <span>Clear Chat</span>
        </motion.button>

        {/* Popover Scope Configuration Dropdown */}
        <AnimatePresence>
          {isScopePopoverOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-16 top-16 w-80 p-4 rounded-[12px] bg-[#12161F] border border-[#242B38] shadow-[0_12px_32px_rgba(0,0,0,0.5)] z-50 space-y-3 font-data text-xs backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-[#1A1F2A] pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F4F6F8] font-display">
                  <Sliders className="w-3.5 h-3.5 text-[#8B7FFF]" />
                  <span>Configure Copilot Context</span>
                </div>
                <motion.button
                  whileHover={reduceMotion ? {} : { scale: 1.1 }}
                  whileTap={reduceMotion ? {} : { scale: 0.9 }}
                  onClick={() => setIsScopePopoverOpen(false)}
                  className="text-[#8891A3] hover:text-[#F4F6F8] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#8891A3] uppercase tracking-wider block mb-1">
                  Target Facility
                </label>
                <select
                  value={selectedFacility}
                  onChange={e => setSelectedFacility(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[8px] bg-[#0A0E14] border border-[#242B38] text-xs font-data text-[#F4F6F8] focus:outline-none focus:border-[#2ED9A3]"
                >
                  <option>All Facilities</option>
                  <option>Chakan Pune HQ</option>
                  <option>Jamnagar Refinery Hub</option>
                  <option>Chennai Tech Park</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#8891A3] uppercase tracking-wider block mb-1">
                  GHG Protocol Scope
                </label>
                <select
                  value={selectedScope}
                  onChange={e => setSelectedScope(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[8px] bg-[#0A0E14] border border-[#242B38] text-xs font-data text-[#F4F6F8] focus:outline-none focus:border-[#3FB6E8]"
                >
                  <option>All Scopes</option>
                  <option>Scope 1 Direct</option>
                  <option>Scope 2 Electricity</option>
                  <option>Scope 3 Supply Chain</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#8891A3] uppercase tracking-wider block mb-1">
                  Reporting Window
                </label>
                <select
                  value={selectedTimeframe}
                  onChange={e => setSelectedTimeframe(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[8px] bg-[#0A0E14] border border-[#242B38] text-xs font-data text-[#F4F6F8] focus:outline-none focus:border-[#8B7FFF]"
                >
                  <option>2026 YTD</option>
                  <option>Q2 2026</option>
                  <option>July 2026</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#1A1F2A] flex justify-end">
                <motion.button
                  whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.08)' }}
                  whileTap={reduceMotion ? {} : { scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  onClick={() => setIsScopePopoverOpen(false)}
                  className="h-7 px-3 rounded-[6px] text-xs bg-[#2ED9A3] text-[#0A0E14] font-semibold hover:bg-[#25C492] cursor-pointer focus-visible:outline-none"
                >
                  Apply Context
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Feed Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
        {messages.map(m => (
          <MessageItem key={m.id} message={m} onApplyAction={rec => triggerGlassSweep()} />
        ))}

        {/* Consistent Step-Trace Loading Indicator */}
        <AnimatePresence mode="popLayout">
          {isTyping && <CopilotThinkingTrace key="thinking-trace" />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Horizontal Suggested Queries Chip Row (with lift and hover feedback) */}
      <div className="px-4 py-2 bg-[#10141D] border-t border-[#1A1F2A] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-[#8891A3] uppercase font-display whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#2ED9A3]" /> Suggested:
        </span>
        {SUGGESTED_PROMPTS.map(p => (
          <motion.button
            key={p.id}
            whileHover={
              reduceMotion
                ? {}
                : {
                    y: -1.5,
                    scale: 1.04,
                    borderColor: 'rgba(46, 217, 163, 0.55)',
                    backgroundColor: '#161C26',
                  }
            }
            whileTap={reduceMotion ? {} : { scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => handleSendMessage(p.prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A0E14] border border-[#242B38] text-xs font-data text-[#D6DBE4] hover:text-[#F4F6F8] whitespace-nowrap transition-colors cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-[#2ED9A3]/40 focus-visible:outline-none"
          >
            {renderPromptIcon(p.iconName)}
            <span>{p.category}</span>
          </motion.button>
        ))}
      </div>

      {/* Composer Input Bar */}
      <div className="p-3 bg-[#12161F]/95 border-t border-[#242B38] space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Copilot about emissions, SEBI BRSR Principle 6, or HVAC tariff shifts..."
            className="flex-1 h-10 px-4 rounded-[10px] bg-[#0A0E14] border border-[#242B38] text-xs text-[#F4F6F8] placeholder-[#8891A3]/60 focus:outline-none focus:border-[#8B7FFF] transition-colors font-sans"
          />

          <motion.button
            whileHover={reduceMotion ? {} : input.trim() ? { y: -1, filter: 'brightness(1.08)' } : {}}
            whileTap={reduceMotion ? {} : input.trim() ? { scale: 0.97 } : {}}
            transition={{ duration: 0.14 }}
            onClick={() => handleSendMessage()}
            disabled={!input.trim()}
            className={cn(
              'h-10 px-4 rounded-[10px] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[#2ED9A3]/50 focus-visible:outline-none',
              input.trim()
                ? 'bg-[#2ED9A3] text-[#0A0E14] hover:bg-[#25C492]'
                : 'bg-[#1A1F2A] text-[#8891A3] cursor-not-allowed opacity-60'
            )}
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </motion.button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-data text-[#8891A3] px-1">
          <span>Powered by Gemini Grounded Architecture</span>
          <span>Grounded in SEBI BRSR & GHG Protocol v19</span>
        </div>
      </div>
    </motion.div>
  );
};

export const CopilotChatWindow = CopilotFullWorkspace;


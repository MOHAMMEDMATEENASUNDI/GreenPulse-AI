/**
 * @license
 * GreenPulse AI — Penalty Shield Compliance Gap-Analysis Component
 * Real SEBI BRSR / NGRBC 9-principle compliance telemetry backed by GET /api/v1/esg/score.
 * Preserves exact GreenPulse visual language, motion choreography, and design aesthetics.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { PenaltyShieldData, PenaltyShieldPrinciple } from '../../types/domain';
import { EsgService, AddEvidencePayload } from '../../services/esg-service';
import { ReportService } from '../../services/report-service';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Layers,
  Database,
  RefreshCw,
  Info,
  PlusCircle,
  X,
  FileCheck,
  Loader2,
  ArrowRight,
  FileText,
} from 'lucide-react';

/**
 * Animated number counter component for smooth numerical count-ups on mount.
 */
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 750 }) => {
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setCount(value);
      return;
    }
    const startTime = performance.now();
    let animFrame: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Premium easeOutExpo curve
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * value));
      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [value, duration, reduceMotion]);

  return <span>{count}</span>;
};

/**
 * Helper to normalize backend status string to canonical lowercase
 */
const normalizeStatus = (status: string | undefined): 'complete' | 'partial' | 'missing' => {
  const s = (status || '').toLowerCase();
  if (s === 'complete') return 'complete';
  if (s === 'partial') return 'partial';
  return 'missing';
};

/**
 * Judge-friendly plain language descriptions for compliance statuses
 */
const getStatusDescription = (status: 'complete' | 'partial' | 'missing'): string => {
  switch (status) {
    case 'complete':
      return 'Requirements covered';
    case 'partial':
      return 'Some information is missing';
    case 'missing':
      return 'Information is not available yet';
  }
};

/**
 * Render provenance badge for telemetry and disclosure evidence
 */
const renderProvenanceText = (rawText: string) => {
  if (!rawText) return null;

  let badgeType: 'operational' | 'seeded' | 'pending' | 'seeded-evidence' | null = null;
  let cleanText = rawText;

  if (rawText.startsWith('[OPERATIONAL EVIDENCE]')) {
    badgeType = 'operational';
    cleanText = rawText.replace(/^\[OPERATIONAL EVIDENCE\]\s*/i, '');
  } else if (rawText.startsWith('[OPERATIONAL]')) {
    badgeType = 'operational';
    cleanText = rawText.replace(/^\[OPERATIONAL\]\s*/i, '');
  } else if (rawText.startsWith('[SEEDED DEMO EVIDENCE]')) {
    badgeType = 'seeded-evidence';
    cleanText = rawText.replace(/^\[SEEDED DEMO EVIDENCE\]\s*/i, '');
  } else if (rawText.startsWith('[DEMO EVIDENCE]')) {
    badgeType = 'seeded-evidence';
    cleanText = rawText.replace(/^\[DEMO EVIDENCE\]\s*/i, '');
  } else if (rawText.startsWith('[SEEDED DEMO]')) {
    badgeType = 'seeded';
    cleanText = rawText.replace(/^\[SEEDED DEMO\]\s*/i, '');
  } else if (rawText.startsWith('[DEMO/SEEDED]')) {
    badgeType = 'seeded';
    cleanText = rawText.replace(/^\[DEMO\/SEEDED\]\s*/i, '');
  } else if (rawText.startsWith('[PENDING AUDIT]')) {
    badgeType = 'pending';
    cleanText = rawText.replace(/^\[PENDING AUDIT\]\s*/i, '');
  }

  return (
    <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
      {badgeType === 'operational' && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-data uppercase tracking-wider bg-[#2ED9A3]/15 text-[#2ED9A3] border border-[#2ED9A3]/30 shrink-0">
          [OPERATIONAL]
        </span>
      )}
      {badgeType === 'seeded-evidence' && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-data uppercase tracking-wider bg-[#3FB6E8]/15 text-[#3FB6E8] border border-[#3FB6E8]/35 shrink-0">
          [SEEDED DEMO EVIDENCE]
        </span>
      )}
      {badgeType === 'seeded' && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-data uppercase tracking-wider bg-[#8891A3]/20 text-[#8891A3] border border-[#8891A3]/35 shrink-0">
          [SEEDED DEMO]
        </span>
      )}
      {badgeType === 'pending' && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-data uppercase tracking-wider bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30 shrink-0">
          [PENDING AUDIT]
        </span>
      )}
      <span className="leading-snug text-[#F4F6F8]">{cleanText}</span>
    </div>
  );
};

/**
 * Real data service for Penalty Shield status assessment.
 * Follows the async pattern of existing GreenPulse API services.
 */
export async function getPenaltyShieldStatus(): Promise<PenaltyShieldData> {
  const data = await EsgService.getEsgScore();
  const rawPrinciples = Array.isArray(data?.principles) ? data.principles : [];

  const principles: PenaltyShieldPrinciple[] = rawPrinciples.map((p) => {
    const status = normalizeStatus(p.status);
    const coverage = typeof p.coveragePercent === 'number' && !isNaN(p.coveragePercent)
      ? p.coveragePercent
      : 0;

    return {
      number: p.number,
      name: p.name || `Principle ${p.number}`,
      status,
      coveragePercent: coverage,
      activeDataSources: Array.isArray(p.activeDataSources) ? p.activeDataSources : [],
      mappedEvidence: Array.isArray(p.mappedEvidence) ? p.mappedEvidence : [],
      specificGaps: Array.isArray(p.specificGaps) ? p.specificGaps : [],
      // Backwards compatibility aliases
      principleNumber: p.number,
      displayLabel: p.name || `Principle ${p.number}`,
      coveragePct: coverage,
      missingDataPoints: Array.isArray(p.specificGaps) ? p.specificGaps : [],
      mappedDataSources: Array.isArray(p.mappedEvidence) && p.mappedEvidence.length > 0
        ? p.mappedEvidence
        : Array.isArray(p.activeDataSources)
        ? p.activeDataSources
        : [],
    };
  });

  const total = data?.summary?.total ?? principles.length;
  const complete = data?.summary?.complete ?? principles.filter((p) => p.status === 'complete').length;
  const partial = data?.summary?.partial ?? principles.filter((p) => p.status === 'partial').length;
  const missing = data?.summary?.missing ?? principles.filter((p) => p.status === 'missing').length;

  return {
    principles,
    lastAssessed: new Date().toISOString(),
    summary: {
      total,
      complete,
      partial,
      missing,
    },
  };
}

export const PenaltyShield: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<PenaltyShieldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPrinciples, setExpandedPrinciples] = useState<Record<number, boolean>>({});
  const [focusedPrinciple, setFocusedPrinciple] = useState<number | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'GAPS_ONLY'>('ALL');

  // Evidence modal and resolution states
  const [selectedPrincipleForEvidence, setSelectedPrincipleForEvidence] = useState<PenaltyShieldPrinciple | null>(null);
  const [evidenceItemsList, setEvidenceItemsList] = useState<
    Array<{ name: string; reference: string; targetGap?: string; selected: boolean }>
  >([]);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [evidenceSubmitError, setEvidenceSubmitError] = useState<string | null>(null);

  // Post-evidence report generation prompt & feedback
  const [postEvidenceNotice, setPostEvidenceNotice] = useState<{
    principleNumber: number;
    principleName: string;
  } | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportSuccessNotice, setReportSuccessNotice] = useState<string | null>(null);

  const openEvidenceModal = (p: PenaltyShieldPrinciple) => {
    setSelectedPrincipleForEvidence(p);
    setEvidenceSubmitError(null);

    let items: Array<{ name: string; reference: string; targetGap?: string; selected: boolean }> = [];
    if (p.number === 2) {
      items = [
        {
          name: 'Raw Material Procurement Ledger',
          reference: 'DEMO-PR-001',
          targetGap: p.specificGaps?.[0] || 'Raw Material Procurement',
          selected: true,
        },
        {
          name: 'Life Cycle Assessment',
          reference: 'DEMO-LCA-001',
          targetGap:
            p.specificGaps?.find((g) => g.toLowerCase().includes('lca') || g.toLowerCase().includes('life cycle')) ||
            p.specificGaps?.[0] ||
            'Life Cycle Assessment',
          selected: true,
        },
        {
          name: 'Recycled Input Material',
          reference: 'DEMO-RIM-001',
          targetGap:
            p.specificGaps?.find((g) => g.toLowerCase().includes('recycled')) ||
            p.specificGaps?.[1] ||
            'Recycled input material',
          selected: true,
        },
      ];
    } else if (p.specificGaps && p.specificGaps.length > 0) {
      items = p.specificGaps.map((gap, idx) => {
        const cleanName = gap
          .replace(/^\[PENDING AUDIT\]\s*/i, '')
          .replace(/^Missing:\s*/i, '')
          .split(/[;.,]/)[0]
          .trim();
        return {
          name: cleanName.length > 45 ? cleanName.slice(0, 45) + ' Audit Ledger' : cleanName,
          reference: `DEMO-EV-${String(p.number).padStart(2, '0')}-${String(idx + 1).padStart(3, '0')}`,
          targetGap: gap,
          selected: true,
        };
      });
    } else {
      items = [
        {
          name: `${p.name} Compliance Ledger`,
          reference: `DEMO-P${p.number}-001`,
          selected: true,
        },
      ];
    }

    setEvidenceItemsList(items);
  };

  const closeEvidenceModal = () => {
    if (isSubmittingEvidence) return;
    setSelectedPrincipleForEvidence(null);
    setEvidenceSubmitError(null);
  };

  const toggleEvidenceItem = (index: number) => {
    setEvidenceItemsList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleAttachEvidence = async () => {
    if (!selectedPrincipleForEvidence) return;
    const selected = evidenceItemsList.filter((i) => i.selected);
    if (selected.length === 0) return;

    setIsSubmittingEvidence(true);
    setEvidenceSubmitError(null);

    try {
      const payload: AddEvidencePayload = {
        evidenceType: 'demo',
        evidenceItems: selected.map((item) => ({
          name: item.name,
          reference: item.reference,
          targetGap: item.targetGap,
        })),
      };

      await EsgService.addPrincipleEvidence(selectedPrincipleForEvidence.number, payload);

      // Re-fetch backend truth
      await fetchEsgData();

      const pNum = selectedPrincipleForEvidence.number;
      const pName = selectedPrincipleForEvidence.name;

      closeEvidenceModal();

      // Show report flow prompt
      setPostEvidenceNotice({
        principleNumber: pNum,
        principleName: pName,
      });
    } catch (err: any) {
      setEvidenceSubmitError(err?.message || 'Failed to attach evidence. Please verify backend connection.');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleGenerateNewReport = async () => {
    setIsGeneratingReport(true);
    setReportSuccessNotice(null);

    try {
      await ReportService.generateReport({
        reportType: 'SEBI_BRSR',
        period: '2026-08',
      });

      setPostEvidenceNotice(null);
      setReportSuccessNotice(
        'New audit report compilation initiated (SEBI BRSR). Latest ESG evidence state captured.'
      );
    } catch (err: any) {
      setEvidenceSubmitError(err?.message || 'Failed to generate report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const fetchEsgData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPenaltyShieldStatus();
      setData(res);

      // Auto-expand gap rows by default for visibility
      const defaultExpanded: Record<number, boolean> = {};
      let firstFocus: number | null = null;

      res.principles.forEach((p) => {
        const normSt = normalizeStatus(p.status);
        if (normSt === 'partial' || normSt === 'missing') {
          defaultExpanded[p.number] = true;
          if (firstFocus === null) firstFocus = p.number;
        }
      });

      // If all are complete, default to Principle 6 or Principle 1
      if (firstFocus === null && res.principles.length > 0) {
        const p6 = res.principles.find((p) => p.number === 6);
        const targetNum = p6 ? p6.number : res.principles[0].number;
        defaultExpanded[targetNum] = true;
        firstFocus = targetNum;
      }

      setExpandedPrinciples(defaultExpanded);
      setFocusedPrinciple(firstFocus);
    } catch (err: any) {
      setError(
        err?.message || 'Unable to connect to ESG compliance telemetry. Please verify backend connectivity.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEsgData();
  }, []);

  const toggleExpand = (principleNumber: number) => {
    const isCurrentlyExpanded = !!expandedPrinciples[principleNumber];
    const willBeExpanded = !isCurrentlyExpanded;

    setExpandedPrinciples((prev) => ({
      ...prev,
      [principleNumber]: willBeExpanded,
    }));

    if (willBeExpanded) {
      setFocusedPrinciple(principleNumber);
    } else {
      const remainingOpen = Object.entries(expandedPrinciples)
        .filter(([num, isOpen]) => Number(num) !== principleNumber && isOpen)
        .map(([num]) => Number(num));

      if (remainingOpen.length > 0) {
        setFocusedPrinciple(remainingOpen[0]);
      } else {
        setFocusedPrinciple(null);
      }
    }
  };

  // 1. Loading Skeleton State
  if (loading && !data) {
    return (
      <Card variant="surface" className="p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1A1F2A] animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-[#242B38] rounded" />
            <div className="h-6 w-80 bg-[#1A1F2A] rounded" />
            <div className="h-3 w-96 bg-[#1A1F2A] rounded" />
          </div>
          <div className="h-8 w-64 bg-[#242B38] rounded-[8px]" />
        </div>
        <div className="py-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-[8px] bg-white/[0.02] border border-white/5 animate-pulse"
            />
          ))}
        </div>
      </Card>
    );
  }

  // 2. Error State with Retry
  if (error && !data) {
    return (
      <Card variant="surface" className="p-6 mb-6">
        <div className="p-5 rounded-[10px] bg-[#F0554C]/10 border border-[#F0554C]/30 text-xs text-[#F0554C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#F0554C]" />
            <div className="space-y-0.5">
              <span className="font-bold text-sm block">ESG Telemetry Unavailable</span>
              <p className="text-[#8891A3]">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchEsgData}
            className="px-4 py-2 rounded-[6px] bg-[#F0554C]/20 hover:bg-[#F0554C]/30 text-[#F4F6F8] font-semibold border border-[#F0554C]/40 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            Retry Connection
          </button>
        </div>
      </Card>
    );
  }

  // 3. Normal Data Calculation
  const total = data?.summary?.total ?? 0;
  const complete = data?.summary?.complete ?? 0;
  const partial = data?.summary?.partial ?? 0;
  const missing = data?.summary?.missing ?? 0;

  // Real calculated overall ESG compliance percentage across the 9 principles
  const overallCoverage =
    total > 0
      ? Math.round(
          (data?.principles || []).reduce((acc, p) => acc + (p.coveragePercent || 0), 0) / total
        )
      : 0;

  const filteredPrinciples = (data?.principles || []).filter((p) => {
    const norm = normalizeStatus(p.status);
    if (filter === 'GAPS_ONLY') {
      return norm === 'partial' || norm === 'missing';
    }
    return true;
  });

  const hasAnyFocus = focusedPrinciple !== null && !!expandedPrinciples[focusedPrinciple];

  return (
    <Card variant="surface" className="p-5 sm:p-6 mb-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1A1F2A]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-[5px] bg-[#2ED9A3]/10 text-[#2ED9A3] border border-[#2ED9A3]/30 text-[10px] font-data font-bold tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2ED9A3]" />
              PENALTY SHIELD
            </span>
            <span className="text-[11px] font-data text-[#8891A3]">
              BRSR / NGRBC Disclosure Gap Analyzer
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#F4F6F8] font-display tracking-tight">
            Penalty Shield — Compliance Disclosure Gap Checklist
          </h3>
          <p className="text-xs text-[#8891A3] mt-1 max-w-2xl">
            Continuously maps enterprise telemetry and uploaded ledgers against the 9 BRSR/NGRBC principles to detect missing disclosure data.
          </p>
        </div>

        {/* Dynamic Summary Stats Pill with Count-up Animation */}
        <div className="flex flex-col sm:items-end gap-2 self-start sm:self-center shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEsgData}
              disabled={loading}
              title="Refresh ESG compliance data"
              className="p-1.5 rounded-lg border border-[#242B38] text-[#8891A3] hover:text-[#F4F6F8] hover:border-[#2ED9A3]/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="px-3 py-1.5 rounded-[8px] bg-[#171C27] border border-[#242B38] text-xs font-data text-[#F4F6F8] flex items-center gap-2 shadow-sm">
              <span className="font-semibold text-[#F4F6F8]">
                <AnimatedNumber value={total} /> Principles
              </span>
              <span className="text-[#8891A3]">·</span>
              <span className="text-[#2ED9A3] font-semibold">
                <AnimatedNumber value={complete} /> Complete
              </span>
              <span className="text-[#8891A3]">·</span>
              <span className="text-[#F5A623] font-semibold">
                <AnimatedNumber value={partial} /> Partial
              </span>
              <span className="text-[#8891A3]">·</span>
              <span className="text-[#F0554C] font-semibold">
                <AnimatedNumber value={missing} /> Missing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-data text-[#8891A3]">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#3FB6E8]" />
              <span>Overall BRSR Coverage:</span>
              <span className="font-bold text-[#F4F6F8]">{overallCoverage}%</span>
            </div>
            <span>·</span>
            <span>Live telemetry synced</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-2 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-data transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-[#242B38] text-[#F4F6F8] font-semibold'
                : 'text-[#8891A3] hover:text-[#F4F6F8]'
            }`}
          >
            All 9 Principles ({total})
          </button>
          <button
            onClick={() => setFilter('GAPS_ONLY')}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-data transition-colors flex items-center gap-1.5 cursor-pointer ${
              filter === 'GAPS_ONLY'
                ? 'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/40 font-semibold'
                : 'text-[#8891A3] hover:text-[#F4F6F8]'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-[#F5A623]" />
            <span>Disclosure Gaps Only ({partial + missing})</span>
          </button>
        </div>

        <span className="text-[11px] font-data text-[#8891A3] hidden sm:inline-block">
          Click row to inspect disclosure evidence & gaps
        </span>
      </div>

      {/* Empty State */}
      {filteredPrinciples.length === 0 && (
        <div className="p-8 text-center rounded-[8px] bg-[#12161F] border border-[#242B38] text-xs text-[#8891A3]">
          <CheckCircle2 className="w-8 h-8 text-[#2ED9A3] mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-[#F4F6F8]">No disclosure gaps identified.</p>
          <p className="mt-1">All filtered principles have met mandatory reporting requirements.</p>
        </div>
      )}

      {/* Post-Evidence Update Notice & Report Flow Banner */}
      <AnimatePresence>
        {postEvidenceNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-4 rounded-[10px] bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2ED9A3]/20 flex items-center justify-center shrink-0 text-[#2ED9A3]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F4F6F8]">
                  Evidence updated. Generate a new audit report to reflect the resolved state.
                </p>
                <p className="text-[11px] text-[#8891A3]">
                  Principle {postEvidenceNotice.principleNumber} ({postEvidenceNotice.principleName}) updated. Compliance state is persisted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleGenerateNewReport}
                disabled={isGeneratingReport}
                className="h-8 px-3.5 rounded-[6px] text-xs font-semibold bg-[#2ED9A3] hover:bg-[#25C492] text-[#0A0E14] inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling Snapshot…</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generate New Report</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPostEvidenceNotice(null)}
                className="p-1 rounded text-[#8891A3] hover:text-[#F4F6F8] cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Report Success Banner */}
      <AnimatePresence>
        {reportSuccessNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 p-3 rounded-[8px] bg-[#3FB6E8]/10 border border-[#3FB6E8]/30 flex items-center justify-between text-xs text-[#3FB6E8]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reportSuccessNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/app/reports');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="font-semibold underline hover:text-[#F4F6F8] ml-2 cursor-pointer flex items-center gap-1"
            >
              <span>View Reports</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9 Checklist Rows with Staggered Entrance and Layout Reflow */}
      <div className="space-y-2.5 relative">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredPrinciples.map((p, index) => {
            const statusType = normalizeStatus(p.status);
            const isExpanded = !!expandedPrinciples[p.number];
            const hasGaps = statusType === 'partial' || statusType === 'missing';
            const pNumberFormatted = String(p.number).padStart(2, '0');
            const safeCoverage = typeof p.coveragePercent === 'number' && !isNaN(p.coveragePercent)
              ? p.coveragePercent
              : 0;

            const isFocused = hasAnyFocus && focusedPrinciple === p.number && isExpanded;
            const isReceded = hasAnyFocus && (!isExpanded || focusedPrinciple !== p.number);

            // Compute dynamic border and shadow styling based on status and focus
            let borderStyle = 'border-[#242B38]';
            let bgStyle = 'bg-[#12161F]/80';
            let shadowStyle = '';

            if (statusType === 'complete') {
              if (isFocused) {
                borderStyle = 'border-[#2ED9A3]/70';
                shadowStyle = 'shadow-[0_8px_24px_-4px_rgba(46,217,163,0.25)]';
              } else {
                borderStyle = 'border-[#242B38] hover:border-[#3A4559]';
              }
            } else if (statusType === 'partial') {
              if (isFocused) {
                borderStyle = 'border-[#F5A623]/70';
                bgStyle = 'bg-[#F5A623]/[0.04]';
                shadowStyle = 'shadow-[0_8px_24px_-4px_rgba(245,166,35,0.25)]';
              } else {
                borderStyle = 'border-[#F5A623]/30 hover:border-[#F5A623]/50';
                bgStyle = 'bg-[#F5A623]/[0.02]';
              }
            } else {
              // missing
              if (isFocused) {
                borderStyle = 'border-[#F0554C]/80';
                bgStyle = 'bg-[#F0554C]/[0.06]';
                shadowStyle = 'shadow-[0_8px_28px_-4px_rgba(240,85,76,0.3)]';
              } else {
                borderStyle = 'border-[#F0554C]/40 hover:border-[#F0554C]/60';
                bgStyle = 'bg-[#F0554C]/[0.03]';
              }
            }

            return (
              <motion.div
                key={p.number}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: isReceded ? (reduceMotion ? 0.6 : 0.45) : 1,
                  y: 0,
                  scale: reduceMotion ? 1 : isFocused ? 1.02 : isReceded ? 0.98 : 1,
                  filter: isReceded && !reduceMotion ? 'grayscale(25%)' : 'grayscale(0%)',
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                  y: -6,
                  transition: { duration: 0.18, ease: 'easeIn' },
                }}
                transition={{
                  delay: reduceMotion ? 0 : index * 0.04,
                  type: 'spring',
                  stiffness: 350,
                  damping: 30,
                  mass: 1,
                }}
                style={{ zIndex: isFocused ? 10 : 1 }}
                className={`rounded-[8px] border transition-colors duration-200 overflow-hidden relative ${bgStyle} ${borderStyle} ${shadowStyle}`}
              >
                {/* Row Header - Clickable for expand/collapse */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(p.number)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(p.number);
                    }
                  }}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#171C27]/50 cursor-pointer select-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Principle Number */}
                    <span className="font-data text-xs sm:text-sm font-bold text-[#8891A3] shrink-0 w-6">
                      {pNumberFormatted}
                    </span>

                    {/* Status Indicator Icon */}
                    <div className="shrink-0">
                      {statusType === 'complete' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#2ED9A3]" />
                      ) : statusType === 'partial' ? (
                        <AlertTriangle className="w-4 h-4 text-[#F5A623]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#F0554C]" />
                      )}
                    </div>

                    {/* Principle Display Label & Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-[#F4F6F8] truncate">
                          {p.name}
                        </span>
                        {p.number === 6 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-data bg-[#2ED9A3]/10 text-[#2ED9A3] border border-[#2ED9A3]/25">
                            LIVE TELEMETRY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-data text-[#8891A3] mt-0.5">
                        <span className="text-[#F4F6F8] font-medium">Coverage: {safeCoverage}%</span>
                        <span>·</span>
                        <span className="italic">{getStatusDescription(statusType)}</span>
                        <span>·</span>
                        <span>{(p.mappedEvidence?.length || p.activeDataSources?.length || 0)} sources</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge, Add Evidence Action, and Expand Chevron */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Add Evidence action for principles with gaps */}
                    {(hasGaps || (p.specificGaps && p.specificGaps.length > 0)) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEvidenceModal(p);
                        }}
                        className="px-2.5 py-1 rounded-[6px] text-xs font-semibold font-data bg-[#2ED9A3]/15 hover:bg-[#2ED9A3]/25 text-[#2ED9A3] border border-[#2ED9A3]/35 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        title="Resolve disclosure gap with demo evidence"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Evidence</span>
                      </button>
                    )}

                    {statusType === 'complete' && (
                      <Badge variant="emerald" className="font-data font-bold">
                        Complete ✓
                      </Badge>
                    )}
                    {statusType === 'partial' && (
                      <Badge variant="warning" className="font-data font-bold">
                        Partial ⚠
                      </Badge>
                    )}
                    {statusType === 'missing' && (
                      <Badge variant="error" className="font-data font-bold">
                        Missing 🔴
                      </Badge>
                    )}

                    {/* Chevron with smooth 180deg rotation */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="text-[#8891A3] p-1 flex items-center justify-center"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>

                {/* Expandable Disclosure Details & Warnings */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 sm:p-4 pt-1 border-t border-[#1A1F2A] bg-[#0A0E14]/60 space-y-3">
                        {/* Plain Language Status Explanation Banner */}
                        <div
                          className={`p-3 rounded-[6px] border flex items-start gap-2.5 text-xs font-data ${
                            statusType === 'complete'
                              ? 'bg-[#2ED9A3]/10 border-[#2ED9A3]/30 text-[#2ED9A3]'
                              : statusType === 'partial'
                              ? 'bg-[#F5A623]/10 border-[#F5A623]/30 text-[#F5A623]'
                              : 'bg-[#F0554C]/10 border-[#F0554C]/30 text-[#F0554C]'
                          }`}
                        >
                          {statusType === 'complete' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2ED9A3]" />
                          ) : statusType === 'partial' ? (
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#F5A623]" />
                          ) : (
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F0554C]" />
                          )}
                          <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-bold">
                                {getStatusDescription(statusType)}
                              </span>
                              <span className="text-[11px] font-data font-semibold text-[#F4F6F8]">
                                Principle Coverage: {safeCoverage}%
                              </span>
                            </div>

                            {/* Plain Language Summary */}
                            <p className="text-[11px] text-[#8891A3] leading-relaxed">
                              {p.number === 6 ? (
                                safeCoverage === 100
                                  ? 'Real-time energy telemetry and operational waste records are verified, fulfilling statutory environmental reporting.'
                                  : safeCoverage === 50
                                  ? 'Energy data is available, but waste records are missing.'
                                  : safeCoverage === 40
                                  ? 'Waste records are available, but energy telemetry is missing.'
                                  : 'No operational energy or waste records have been uploaded yet.'
                              ) : statusType === 'complete' ? (
                                'Statutory corporate governance disclosures and compliance records for this principle are verified.'
                              ) : statusType === 'partial' ? (
                                'Core policy documentation is registered, but additional verifiable audit records are required.'
                              ) : (
                                'Mandatory reporting records have not been submitted yet for this compliance principle.'
                              )}
                            </p>

                            {/* Actionable "What is needed" guidance */}
                            {statusType !== 'complete' && (
                              <p className="text-[11px] text-[#F4F6F8]/90 font-medium pt-0.5">
                                <span className="text-[#F5A623] font-semibold">What is needed: </span>
                                {p.number === 6 ? (
                                  safeCoverage === 50
                                    ? "Add the company's waste records to improve ESG coverage."
                                    : safeCoverage === 40
                                    ? "Upload facility energy data to improve ESG coverage."
                                    : 'Upload company energy and waste data to activate environmental compliance.'
                                ) : (
                                  'Upload the required operational audit documentation to achieve complete status.'
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* What GreenPulse Found: Mapped Evidence & Operational Data Sources */}
                        {((p.mappedEvidence && p.mappedEvidence.length > 0) ||
                          (p.activeDataSources && p.activeDataSources.length > 0)) && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ED9A3] flex items-center gap-1 font-data">
                              <Database className="w-3 h-3" /> What GreenPulse Found:
                            </span>
                            <ul className="space-y-1 pl-1">
                              {(p.mappedEvidence && p.mappedEvidence.length > 0
                                ? p.mappedEvidence
                                : p.activeDataSources || []
                              ).map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs font-data text-[#8891A3] flex items-start gap-2 bg-[#12161F] px-2.5 py-1.5 rounded-[4px] border border-[#1A1F2A]"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3] shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">{renderProvenanceText(item)}</div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Specific Disclosure Gaps Identified */}
                        {p.specificGaps && p.specificGaps.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5A623] flex items-center gap-1 font-data">
                                <AlertTriangle className="w-3 h-3" /> Specific Disclosure Gaps Identified:
                              </span>
                              <button
                                type="button"
                                onClick={() => openEvidenceModal(p)}
                                className="px-2 py-0.5 rounded-[5px] text-[11px] font-semibold font-data bg-[#2ED9A3]/15 hover:bg-[#2ED9A3]/25 text-[#2ED9A3] border border-[#2ED9A3]/35 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>Add Evidence</span>
                              </button>
                            </div>
                            <ul className="space-y-1 pl-1">
                              {p.specificGaps.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs font-data text-[#F4F6F8] flex items-start gap-2 bg-[#171C27] px-2.5 py-1.5 rounded-[4px] border border-[#242B38]"
                                >
                                  <span className="text-[#F0554C] font-bold shrink-0 mt-0.5">Missing:</span>
                                  <div className="min-w-0 flex-1">
                                    {renderProvenanceText(item.replace(/^Missing:\s*/i, ''))}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Resolve Disclosure Gap Compact Modal */}
      <AnimatePresence>
        {selectedPrincipleForEvidence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0E14]/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl bg-[#12161F] border border-[#242B38] rounded-[16px] shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1A1F2A]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[9px] bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 flex items-center justify-center text-[#2ED9A3]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#F4F6F8] font-display">
                      Resolve Disclosure Gap
                    </h3>
                    <p className="text-xs text-[#8891A3]">
                      Principle {String(selectedPrincipleForEvidence.number).padStart(2, '0')} — {selectedPrincipleForEvidence.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeEvidenceModal}
                  disabled={isSubmittingEvidence}
                  className="p-1.5 rounded-[8px] text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#1A1F2A] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Identified Disclosure Gaps List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold font-data text-[#8891A3] uppercase tracking-wider block">
                  Current Disclosure Gaps:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedPrincipleForEvidence.specificGaps && selectedPrincipleForEvidence.specificGaps.length > 0 ? (
                    selectedPrincipleForEvidence.specificGaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-data text-[#F4F6F8] p-2 rounded-[6px] bg-[#171C27] border border-[#242B38] flex items-start gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F5A623] shrink-0 mt-0.5" />
                        <span className="leading-snug">{gap}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#8891A3] italic p-2 bg-[#171C27] rounded-[6px]">
                      No unresolved gaps identified for this principle.
                    </div>
                  )}
                </div>
              </div>

              {/* Demo Evidence Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold font-data text-[#2ED9A3] uppercase tracking-wider block">
                    Confirm Evidence to Attach:
                  </span>
                  <span className="text-[10px] font-data text-[#3FB6E8] bg-[#3FB6E8]/10 border border-[#3FB6E8]/25 px-2 py-0.5 rounded">
                    Demo evidence — for demonstration only
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {evidenceItemsList.map((item, idx) => (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-[8px] border transition-all cursor-pointer select-none ${
                        item.selected
                          ? 'bg-[#2ED9A3]/[0.06] border-[#2ED9A3]/40 text-[#F4F6F8]'
                          : 'bg-[#171C27] border-[#242B38] text-[#8891A3] hover:border-[#3A4559]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleEvidenceItem(idx)}
                        className="mt-0.5 rounded border-[#242B38] text-[#2ED9A3] focus:ring-0 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[#F4F6F8]">{item.name}</span>
                          <span className="font-data text-[10px] text-[#3FB6E8] px-1.5 py-0.2 rounded bg-[#3FB6E8]/10 border border-[#3FB6E8]/20">
                            {item.reference}
                          </span>
                          <span className="font-data text-[9px] text-[#8891A3] px-1 py-0.2 rounded bg-[#242B38]">
                            [DEMO EVIDENCE]
                          </span>
                        </div>
                        {item.targetGap && (
                          <p className="text-[10px] text-[#8891A3] truncate">
                            Resolves: {item.targetGap}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error banner if submission fails */}
              {evidenceSubmitError && (
                <div className="p-3 rounded-[6px] bg-[#F0554C]/10 border border-[#F0554C]/30 text-xs text-[#F0554C] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{evidenceSubmitError}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-[#1A1F2A] flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#8891A3]">
                  {evidenceItemsList.filter((i) => i.selected).length} of {evidenceItemsList.length} evidence item(s) selected
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeEvidenceModal}
                    disabled={isSubmittingEvidence}
                    className="px-3 py-1.5 rounded-[6px] text-xs font-medium text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#1A1F2A] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAttachEvidence}
                    disabled={isSubmittingEvidence || evidenceItemsList.filter((i) => i.selected).length === 0}
                    className="px-4 py-1.5 rounded-[6px] text-xs font-semibold bg-[#2ED9A3] hover:bg-[#25C492] text-[#0A0E14] inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingEvidence ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Attaching…</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Attach Evidence</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
};

/**
 * @license
 * GreenPulse AI — Phase 7I Audit Reports Feature Components
 * Verified PDF exports formatted for SEBI BRSR and GRI auditors.
 * Connected to real backend endpoints:
 * - GET /api/v1/reports
 * - GET /api/v1/reports/:id
 * - GET /api/v1/reports/:id/download
 * - POST /api/v1/reports
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  FileText,
  Download,
  Plus,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  X,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { cn } from '../../utils/utils';
import {
  ReportService,
  BackendReportType,
  BackendReportStatus,
  BackendReportDetail,
} from '../../services/report-service';
import {
  FormattedReportItem,
  formatBackendReport,
  formatReportStatusInfo,
} from '../../utils/report-helpers';

export interface ReportsHistoryViewProps {
  onNavigate?: (path: string) => void;
}

/* ==========================================================================
   STATUS BADGE WITH RESTRAINED CONFIRMATION & ATTENTION MOTION
   ========================================================================== */
interface ReportStatusBadgeProps {
  status: BackendReportStatus;
  justCompleted?: boolean;
}

const ReportStatusBadge: React.FC<ReportStatusBadgeProps> = ({ status, justCompleted }) => {
  const reduceMotion = useReducedMotion();
  const info = formatReportStatusInfo(status);

  if (status === 'ready') {
    return (
      <motion.div
        key="ready-badge"
        initial={
          reduceMotion
            ? { opacity: 1 }
            : justCompleted
            ? { scale: 0.85, opacity: 0 }
            : { opacity: 1, scale: 1 }
        }
        animate={
          reduceMotion
            ? { opacity: 1 }
            : justCompleted
            ? {
                scale: [0.85, 1.15, 1],
                opacity: 1,
                boxShadow: [
                  '0 0 0px rgba(46,217,163,0)',
                  '0 0 16px rgba(46,217,163,0.45)',
                  '0 0 0px rgba(46,217,163,0)',
                ],
              }
            : { opacity: 1, scale: 1, boxShadow: '0 0 0px rgba(46,217,163,0)' }
        }
        transition={{
          duration: justCompleted && !reduceMotion ? 0.45 : 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        title={info.explanation}
      >
        <Badge variant="emerald" icon={<CheckCircle2 className="w-3 h-3 text-[#2ED9A3]" />}>
          Ready
        </Badge>
      </motion.div>
    );
  }

  if (status === 'generating') {
    return (
      <motion.div
        key="generating-badge"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: [1, 0.85, 1],
                scale: 1,
              }
        }
        transition={{
          repeat: Infinity,
          duration: 1.8,
          ease: 'easeInOut',
        }}
        title={info.explanation}
      >
        <Badge variant="cyan" icon={<Loader2 className="w-3 h-3 animate-spin text-[#3FB6E8]" />}>
          Generating...
        </Badge>
      </motion.div>
    );
  }

  if (status === 'needs_review') {
    return (
      <motion.div
        key="needs-review-badge"
        initial={{ opacity: 1 }}
        animate={
          reduceMotion
            ? { opacity: 1 }
            : {
                opacity: [1, 0.88, 1],
                boxShadow: [
                  '0 0 0px rgba(245,166,35,0)',
                  '0 0 10px rgba(245,166,35,0.22)',
                  '0 0 0px rgba(245,166,35,0)',
                ],
              }
        }
        transition={{
          repeat: Infinity,
          duration: 2.8,
          ease: 'easeInOut',
        }}
        className="rounded-full"
        title={info.explanation}
      >
        <Badge variant="warning" icon={<AlertTriangle className="w-3 h-3 text-[#F5A623]" />}>
          Needs Review
        </Badge>
      </motion.div>
    );
  }

  if (status === 'failed') {
    return (
      <span title={info.explanation}>
        <Badge variant="error" icon={<AlertTriangle className="w-3 h-3 text-[#F0554C]" />}>
          Failed
        </Badge>
      </span>
    );
  }

  return null;
};

/* ==========================================================================
   REPORT ROW COMPONENT WITH REAL BACKEND DATA & ACCESSIBLE DOWNLOAD
   ========================================================================== */
interface ReportRowProps {
  report: FormattedReportItem;
  detail?: BackendReportDetail | null;
  index: number;
  isExpanded: boolean;
  isDownloading: boolean;
  onToggleExpand: () => void;
  onDownload: (e: React.MouseEvent) => void;
  onNavigateToEsg: (e: React.MouseEvent) => void;
}

const ReportRow: React.FC<ReportRowProps> = ({
  report,
  detail,
  index,
  isExpanded,
  isDownloading,
  onToggleExpand,
  onDownload,
  onNavigateToEsg,
}) => {
  const reduceMotion = useReducedMotion();
  const isGenerating = report.status === 'generating';
  const isNeedsReview = report.status === 'needs_review';
  const isFailed = report.status === 'failed';

  const snapshot = detail?.snapshotSummary;

  return (
    <motion.div
      layout
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.28,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'rounded-[8px] border transition-colors duration-200 overflow-hidden',
        isExpanded
          ? 'bg-[#171C27] border-[#384252]'
          : 'bg-[#171C27] border-[#242B38] hover:border-[#384252]'
      )}
    >
      {/* Main Row */}
      <div
        onClick={onToggleExpand}
        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <FileText
            className={cn(
              'w-5 h-5 shrink-0 transition-colors duration-200',
              isNeedsReview
                ? 'text-[#F5A623]'
                : isGenerating
                ? 'text-[#3FB6E8]'
                : isFailed
                ? 'text-[#F0554C]'
                : 'text-[#2ED9A3]'
            )}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F4F6F8] truncate">{report.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-data bg-[#12161F] text-[#8891A3] border border-[#242B38] shrink-0">
                {report.badgeLabel}
              </span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center justify-center shrink-0"
              >
                <ChevronDown className="w-3.5 h-3.5 text-[#8891A3]" />
              </motion.span>
            </div>
            <span className="text-[10px] text-[#8891A3] block mt-0.5">
              Period: {report.periodFormatted} ({report.periodRaw}) • Generated: {report.dateFormatted}
            </span>
          </div>
        </div>

        {/* Status & Single Row Action Slot */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          {/* Real Status Badge */}
          <ReportStatusBadge status={report.status} />

          {/* Action Slot */}
          {isNeedsReview ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToEsg}
                className="group text-[11px] text-[#F5A623] hover:text-[#F4F6F8] flex items-center gap-1 font-medium cursor-pointer transition-colors duration-150 focus-visible:outline-none"
              >
                <span className="group-hover:underline">
                  {report.gapsCount} disclosure gap{report.gapsCount === 1 ? '' : 's'} detected — see Penalty Shield
                </span>
                <ArrowRight className="w-3 h-3 text-[#F5A623] group-hover:text-[#F4F6F8] group-hover:translate-x-1 transition-all duration-150" />
              </button>

              <motion.button
                whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.08)' }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.14 }}
                disabled={isGenerating || isFailed}
                onClick={onDownload}
                className={cn(
                  'h-8 px-3 text-xs inline-flex items-center justify-center font-medium rounded-[6px] border border-[#242B38] bg-transparent text-[#F4F6F8] hover:bg-[#12161F] hover:border-[#8891A3] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400'
                )}
                title="Download verified PDF report"
              >
                {isDownloading ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-[#2ED9A3]" /> Downloaded
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1 text-[#8891A3]" /> PDF
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.08)' }}
              whileTap={reduceMotion ? {} : { scale: 0.97 }}
              transition={{ duration: 0.14 }}
              disabled={isGenerating || isFailed}
              onClick={onDownload}
              className={cn(
                'h-8 px-3 text-xs inline-flex items-center justify-center font-medium rounded-[6px] border border-[#242B38] bg-transparent text-[#F4F6F8] hover:bg-[#12161F] hover:border-[#8891A3] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400'
              )}
              title="Download verified PDF report"
            >
              {isDownloading ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-[#2ED9A3]" /> Downloaded
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-[#3FB6E8]" /> Preparing
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1 text-[#8891A3]" /> PDF
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Inline Report Preview */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[#242B38] bg-[#12161F] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#F4F6F8]">Report Executive Summary</span>
              <div className="flex items-center gap-3 text-[10px] text-[#8891A3] font-data">
                {snapshot?.greenScore != null && (
                  <span className="text-[#2ED9A3] bg-[#2ED9A3]/10 px-2 py-0.5 rounded border border-[#2ED9A3]/20">
                    Green Score: {snapshot.greenScore}/100
                  </span>
                )}
                <span>
                  {report.periodFormatted} • {report.dateFormatted}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#CAD1DB] leading-relaxed">
              <div>
                <span className="text-[#8891A3] font-medium">Framework: </span>
                <span>{report.summary.framework}</span>
              </div>
              <div>
                <span className="text-[#8891A3] font-medium">Measurements & Scope: </span>
                <span>{report.summary.scopeMetrics}</span>
              </div>
              <div>
                <span className="text-[#8891A3] font-medium">Audit Level: </span>
                <span>{report.summary.assuranceLevel}</span>
              </div>
              <div>
                <span className="text-[#8891A3] font-medium">Key Finding: </span>
                <span>{report.summary.keyHighlight}</span>
              </div>
            </div>

            {isNeedsReview && (
              <div className="p-2.5 rounded-[6px] bg-[#F5A623]/10 border border-[#F5A623]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#F5A623]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Action Required: {report.gapsCount} disclosure principles still need attention.</span>
                </div>
                <button
                  onClick={onNavigateToEsg}
                  className="text-[11px] text-[#F5A623] underline font-medium hover:text-[#F4F6F8] shrink-0 cursor-pointer focus-visible:outline-none"
                >
                  Open Penalty Shield →
                </button>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#8891A3] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#8891A3]/70" />
                {report.statusExplanation}
              </span>

              <motion.button
                whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.08)' }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.14 }}
                disabled={isGenerating || isFailed}
                onClick={onDownload}
                className="h-8 px-3 text-xs inline-flex items-center justify-center font-medium rounded-[6px] border border-[#242B38] bg-transparent text-[#F4F6F8] hover:bg-[#171C27] hover:border-[#8891A3] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {isDownloading ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 text-[#2ED9A3]" /> Downloaded PDF
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1.5 text-[#8891A3]" /> Download Verified PDF
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ==========================================================================
   LOADING SKELETON
   ========================================================================== */
const ReportsLoadingSkeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-20 rounded-[8px] bg-[#171C27]/60 border border-[#242B38] p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-[#242B38]" />
          <div className="space-y-2">
            <div className="w-48 h-3.5 rounded bg-[#242B38]" />
            <div className="w-32 h-2.5 rounded bg-[#242B38]/60" />
          </div>
        </div>
        <div className="w-20 h-6 rounded bg-[#242B38]" />
      </div>
    ))}
  </div>
);

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */
const ReportsEmptyState: React.FC<{ onGenerateClick: () => void }> = ({ onGenerateClick }) => (
  <div className="rounded-[10px] bg-[#12161F]/60 border border-[#242B38] p-8 text-center space-y-3">
    <div className="w-10 h-10 rounded-full bg-[#171C27] flex items-center justify-center mx-auto text-[#8891A3]">
      <FileText className="w-5 h-5 text-[#8891A3]/80" />
    </div>
    <h3 className="text-sm font-semibold text-[#F4F6F8]">No reports yet</h3>
    <p className="text-xs text-[#8891A3] max-w-sm mx-auto">
      No compliance reports have been generated yet. Use the "Generate New Report" button to create an audit-ready compliance export.
    </p>
    <button
      onClick={onGenerateClick}
      className="px-3.5 py-1.5 rounded-[6px] text-xs font-semibold bg-[#2ED9A3] text-[#0A0E14] hover:bg-[#28c493] transition-all cursor-pointer shadow-sm"
    >
      Generate Report
    </button>
  </div>
);

/* ==========================================================================
   MAIN AUDIT REPORTS HISTORY VIEW (CONNECTED TO REAL BACKEND)
   ========================================================================== */
export const ReportsHistoryView: React.FC<ReportsHistoryViewProps> = ({ onNavigate }) => {
  const reduceMotion = useReducedMotion();

  const [reports, setReports] = useState<FormattedReportItem[]>([]);
  const [detailsCache, setDetailsCache] = useState<Record<string, BackendReportDetail>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Form state for generating a real report
  const [selectedType, setSelectedType] = useState<BackendReportType>('SEBI_BRSR');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Fetch reports from real backend
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ReportService.getReports();
      const formatted = (data || []).map(formatBackendReport);
      setReports(formatted);
    } catch (err: any) {
      console.error('Failed to load reports from backend:', err);
      setError(err?.message || 'Failed to load compliance reports. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Polling helper when a report is generating
  const pollReportStatus = useCallback((reportId: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const detail = await ReportService.getReportById(reportId);
        if (detail.status !== 'generating' || attempts >= maxAttempts) {
          clearInterval(interval);
          const formatted = formatBackendReport(detail);
          setReports((prev) =>
            prev.map((r) => (r.id === reportId ? formatted : r))
          );
          setDetailsCache((prev) => ({ ...prev, [reportId]: detail }));
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }
    }, 2000);
  }, []);

  // Handle row click to toggle inline preview and load detail
  const handleRowClick = async (id: string) => {
    const isOpening = activePreviewId !== id;
    setActivePreviewId(isOpening ? id : null);

    if (isOpening && !detailsCache[id]) {
      try {
        const detail = await ReportService.getReportById(id);
        setDetailsCache((prev) => ({ ...prev, [id]: detail }));
      } catch (err) {
        console.warn('Failed to load report detail snapshot for id:', id, err);
      }
    }
  };

  // Secure download using real backend signed URL
  const handleDownload = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDownloadingId(id);
    setDownloadError(null);
    try {
      const access = await ReportService.getReportDownloadAccess(id);
      if (!access.downloadUrl) {
        throw new Error('Download URL not provided by server');
      }

      const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001/api/v1';
      const origin = apiBase.replace(/\/api\/v1\/?$/, '');
      const fullUrl = access.downloadUrl.startsWith('http')
        ? access.downloadUrl
        : `${origin}${access.downloadUrl.startsWith('/') ? access.downloadUrl : `/${access.downloadUrl}`}`;

      const link = document.createElement('a');
      link.href = fullUrl;
      link.target = '_blank';
      link.setAttribute('download', `report_${access.period || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Keep visual acknowledgement
      setTimeout(() => {
        setDownloadingId((curr) => (curr === id ? null : curr));
      }, 2500);
    } catch (err: any) {
      console.error('Failed to download report:', err);
      setDownloadError('Report download failed. Please try again.');
      setDownloadingId(null);
    }
  };

  // Safe navigation back to Penalty Shield on ESG Compliance page
  const handleNavigateToEsg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate('/app/esg');
    } else {
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const esgBtn = buttons.find((b) => b.textContent?.includes('ESG Compliance')) as HTMLElement | undefined;
      if (esgBtn) {
        esgBtn.click();
      }
    }
  };

  // Initiate real report compilation via POST /api/v1/reports
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGenerationError(null);

    try {
      const initiated = await ReportService.generateReport({
        reportType: selectedType,
        period: selectedPeriod,
      });

      const formatted = formatBackendReport(initiated);
      // Prepend to active list
      setReports((prev) => [formatted, ...prev.filter((r) => r.id !== formatted.id)]);
      setIsGenerateOpen(false);
      setActivePreviewId(formatted.id);

      // Start status poller until completion
      pollReportStatus(formatted.id);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setGenerationError(err?.message || 'Report generation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="surface" className="p-6">
      {/* Header with single primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#F4F6F8] font-display flex items-center gap-2">
            Audit-Ready Compliance Reports
          </h2>
          <p className="text-xs text-[#8891A3] mt-0.5">
            Verified PDF exports formatted for SEBI BRSR and GRI auditors.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="h-8 px-2.5 rounded-[6px] text-xs font-data text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#171C27] border border-[#242B38] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh reports"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading ? 'animate-spin' : '')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <motion.button
            whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.08)' }}
            whileTap={reduceMotion ? {} : { scale: 0.97 }}
            transition={{ duration: 0.14 }}
            onClick={() => {
              setIsGenerateOpen((prev) => !prev);
              setGenerationError(null);
            }}
            className="h-8 px-3 text-xs inline-flex items-center justify-center font-semibold rounded-[6px] bg-[#2ED9A3] text-[#0A0E14] hover:bg-[#25C492] shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Generate New Report
          </motion.button>
        </div>
      </div>

      {/* Download Error Alert */}
      {downloadError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-[8px] bg-[#F0554C]/10 border border-[#F0554C]/30 text-[#F0554C] text-xs flex items-center justify-between"
        >
          <span>{downloadError}</span>
          <button
            onClick={() => setDownloadError(null)}
            className="text-current hover:opacity-80 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Inline Generate New Report Form */}
      <AnimatePresence>
        {isGenerateOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 overflow-hidden"
          >
            <form
              onSubmit={handleGenerateReport}
              className="p-4 rounded-[8px] bg-[#12161F] border border-[#242B38] space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#F4F6F8] block">Configure Compliance Report</span>
                  <span className="text-[10px] text-[#8891A3]">
                    Immutable report snapshot generated directly from real facility measurements.
                  </span>
                </div>
                <motion.button
                  whileHover={reduceMotion ? {} : { scale: 1.1 }}
                  whileTap={reduceMotion ? {} : { scale: 0.9 }}
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="text-[#8891A3] hover:text-[#F4F6F8] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {generationError && (
                <div className="p-2.5 rounded-[6px] bg-[#F0554C]/10 border border-[#F0554C]/30 text-[#F0554C] text-xs">
                  {generationError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-[#8891A3] block mb-1 font-medium">Report Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as BackendReportType)}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0A0E14] border border-[#242B38] text-xs text-[#F4F6F8] focus:outline-none focus:border-[#2ED9A3] cursor-pointer"
                  >
                    <option value="SEBI_BRSR">SEBI BRSR Core (9 Principles)</option>
                    <option value="SCOPE_1_2_GHG">Scope 1 & 2 GHG Emissions Inventory</option>
                    <option value="GRI_STANDARDS">GRI Standards Sustainability Report</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8891A3] block mb-1 font-medium">Reporting Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0A0E14] border border-[#242B38] text-xs text-[#F4F6F8] focus:outline-none focus:border-[#2ED9A3] cursor-pointer"
                  >
                    <option value="2026-08">August 2026 (2026-08)</option>
                    <option value="2026-07">July 2026 (2026-07)</option>
                    <option value="2026-06">June 2026 (2026-06)</option>
                    <option value="2026-05">May 2026 (2026-05)</option>
                    <option value="2026-04">April 2026 (2026-04)</option>
                    <option value="2026-03">March 2026 (2026-03)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <motion.button
                  whileHover={reduceMotion ? {} : { y: -1 }}
                  whileTap={reduceMotion ? {} : { scale: 0.97 }}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsGenerateOpen(false)}
                  className="h-8 px-3 text-xs inline-flex items-center justify-center font-medium rounded-[6px] bg-transparent text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#171C27] transition-colors cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.08)' }}
                  whileTap={reduceMotion ? {} : { scale: 0.97 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="h-8 px-3.5 text-xs inline-flex items-center justify-center font-semibold rounded-[6px] bg-[#2ED9A3] text-[#0A0E14] hover:bg-[#25C492] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Initiating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      {isLoading ? (
        <ReportsLoadingSkeleton />
      ) : error ? (
        <div className="rounded-[10px] bg-[#F0554C]/10 border border-[#F0554C]/30 p-6 text-center space-y-3">
          <AlertTriangle className="w-6 h-6 text-[#F0554C] mx-auto" />
          <h3 className="text-sm font-semibold text-[#F4F6F8]">Failed to load compliance reports</h3>
          <p className="text-xs text-[#8891A3] max-w-sm mx-auto">{error}</p>
          <button
            onClick={fetchReports}
            className="px-3.5 py-1.5 rounded-[6px] text-xs font-semibold bg-[#171C27] hover:bg-[#1E2533] text-[#F4F6F8] border border-[#242B38] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <ReportsEmptyState onGenerateClick={() => setIsGenerateOpen(true)} />
      ) : (
        <motion.div layout className="space-y-4">
          {reports.map((r, idx) => (
            <ReportRow
              key={r.id}
              report={r}
              detail={detailsCache[r.id] || null}
              index={idx}
              isExpanded={activePreviewId === r.id}
              isDownloading={downloadingId === r.id}
              onToggleExpand={() => handleRowClick(r.id)}
              onDownload={(e) => handleDownload(e, r.id)}
              onNavigateToEsg={handleNavigateToEsg}
            />
          ))}
        </motion.div>
      )}
    </Card>
  );
};

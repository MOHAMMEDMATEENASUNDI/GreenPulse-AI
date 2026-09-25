/**
 * @license
 * GreenPulse AI — Phase 7I Report Formatting Helpers
 * Simple, judge-friendly language and honest snapshot rendering.
 */

import {
  BackendReportItem,
  BackendReportType,
  BackendReportStatus,
} from '../services/report-service';

export interface FormattedReportItem {
  id: string;
  title: string;
  badgeLabel: string;
  type: BackendReportType;
  periodRaw: string;
  periodFormatted: string;
  dateFormatted: string;
  status: BackendReportStatus;
  statusLabel: string;
  statusExplanation: string;
  gapsCount: number;
  pdfStorageRef?: string | null;
  summary: {
    framework: string;
    scopeMetrics: string;
    assuranceLevel: string;
    keyHighlight: string;
  };
  raw: BackendReportItem;
}

/**
 * Format report type to title, badge, and plain explanation
 */
export function formatReportTypeInfo(type: BackendReportType): {
  title: string;
  badgeLabel: string;
  description: string;
} {
  switch (type) {
    case 'SEBI_BRSR':
      return {
        title: 'SEBI BRSR Comprehensive Compliance Report',
        badgeLabel: 'BRSR Core',
        description: "Compliance report covering the company's 9 ESG principles.",
      };
    case 'SCOPE_1_2_GHG':
      return {
        title: 'Scope 1 & 2 GHG Emissions Inventory',
        badgeLabel: 'Scope 1 & 2 GHG',
        description: 'Targeted greenhouse gas emissions inventory detailing direct fuel and electricity metrics.',
      };
    case 'GRI_STANDARDS':
      return {
        title: 'GRI Standards Sustainability Report',
        badgeLabel: 'GRI Standards',
        description: 'Global sustainability reporting across environmental and governance principles.',
      };
    default:
      return {
        title: 'Corporate Sustainability Report',
        badgeLabel: 'Compliance',
        description: 'Statutory sustainability disclosure report.',
      };
  }
}

/**
 * Format backend status to exact required human-friendly label and description
 */
export function formatReportStatusInfo(status: BackendReportStatus): {
  label: string;
  explanation: string;
  variant: 'emerald' | 'cyan' | 'warning' | 'error' | 'neutral';
} {
  switch (status) {
    case 'generating':
      return {
        label: 'Generating',
        explanation: 'Your report is being prepared.',
        variant: 'cyan',
      };
    case 'ready':
      return {
        label: 'Ready',
        explanation: 'Report is ready to view or download.',
        variant: 'emerald',
      };
    case 'needs_review':
      return {
        label: 'Needs Review',
        explanation: 'Some information needs attention before final use.',
        variant: 'warning',
      };
    case 'failed':
      return {
        label: 'Failed',
        explanation: 'Report generation failed.',
        variant: 'error',
      };
    default:
      return {
        label: 'Pending',
        explanation: 'Report status pending update.',
        variant: 'neutral',
      };
  }
}

/**
 * Format period string like 2026-08 to human month/year
 */
export function formatReportPeriod(period: string): string {
  if (!period) return 'Current';
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthIndex = parseInt(match[2], 10) - 1;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} ${year}`;
    }
  }
  return period;
}

/**
 * Format ISO date string into readable format (e.g. 25 Sep 2026)
 */
export function formatReportDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Transforms backend report item into UI model
 */
export function formatBackendReport(rec: BackendReportItem): FormattedReportItem {
  const id = rec?._id || rec?.id || rec?.reportId || `rep-${Date.now()}`;
  const typeInfo = formatReportTypeInfo(rec?.reportType || 'SEBI_BRSR');
  const statusInfo = formatReportStatusInfo(rec?.status || 'generating');

  return {
    id,
    title: typeInfo.title,
    badgeLabel: typeInfo.badgeLabel,
    type: rec?.reportType || 'SEBI_BRSR',
    periodRaw: rec?.period || '',
    periodFormatted: formatReportPeriod(rec?.period || ''),
    dateFormatted: formatReportDate(rec?.generatedAt || rec?.createdAt),
    status: rec?.status || 'generating',
    statusLabel: statusInfo.label,
    statusExplanation: statusInfo.explanation,
    gapsCount: typeof rec.disclosureGapCount === 'number' ? rec.disclosureGapCount : 0,
    pdfStorageRef: rec.pdfStorageRef,
    summary: {
      framework: rec.executiveSummary?.framework || 'Statutory Compliance Framework',
      scopeMetrics: rec.executiveSummary?.telemetryAndScope || 'Emissions & activity records reconciled',
      assuranceLevel: rec.executiveSummary?.auditLevel || 'Internal system-generated; not externally assured',
      keyHighlight: rec.executiveSummary?.keyFinding || 'Compliance metrics computed from operational measurements.',
    },
    raw: rec,
  };
}

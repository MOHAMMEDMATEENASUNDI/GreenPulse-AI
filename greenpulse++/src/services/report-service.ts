/**
 * @license
 * GreenPulse AI — Phase 7I Reports Service
 * Typed interface connecting to backend reports API endpoints:
 * - GET /api/v1/reports
 * - GET /api/v1/reports/:id
 * - GET /api/v1/reports/:id/download
 * - POST /api/v1/reports
 */

import { apiClient } from './api-client';

export type BackendReportType = 'SEBI_BRSR' | 'GRI_STANDARDS' | 'SCOPE_1_2_GHG';
export type BackendReportStatus = 'generating' | 'ready' | 'needs_review' | 'failed';

export interface BackendExecutiveSummary {
  framework: string;
  telemetryAndScope: string;
  auditLevel: string;
  keyFinding: string;
}

export interface BackendSnapshotSummary {
  snapshotDate?: string;
  companyName?: string;
  scope2KgCO2e?: number;
  scope1Status?: string;
  greenScore?: number;
}

export interface BackendReportItem {
  _id?: string;
  id?: string;
  reportId?: string;
  companyId?: string;
  reportType: BackendReportType;
  period: string; // YYYY-MM
  status: BackendReportStatus;
  disclosureGapCount: number;
  executiveSummary: BackendExecutiveSummary;
  pdfStorageRef?: string | null;
  createdAt: string;
  generatedAt?: string | null;
  failureReason?: string | null;
}

export interface BackendReportDetail extends BackendReportItem {
  snapshotSummary?: BackendSnapshotSummary;
  updatedAt?: string;
}

export interface ReportDownloadAccess {
  reportId: string;
  reportType: string;
  period: string;
  status: string;
  downloadUrl: string;
  expiresIn?: string;
  isLocal?: boolean;
  localFilePath?: string;
}

export interface GenerateReportPayload {
  reportType: BackendReportType;
  period: string; // YYYY-MM
}

export const ReportService = {
  /**
   * Fetch all generated compliance reports for the authenticated company
   */
  async getReports(filter?: {
    reportType?: string;
    period?: string;
    status?: string;
  }): Promise<BackendReportItem[]> {
    const params = new URLSearchParams();
    if (filter?.reportType) params.append('reportType', filter.reportType);
    if (filter?.period) params.append('period', filter.period);
    if (filter?.status) params.append('status', filter.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res: any = await apiClient<any>(`/reports${query}`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  },

  /**
   * Fetch structured report detail with executive summary & snapshot metrics
   */
  async getReportById(id: string): Promise<BackendReportDetail> {
    const res: any = await apiClient<any>(`/reports/${id}`);
    const item = res?.data ?? res;
    if (item && !item._id && item.reportId) {
      item._id = item.reportId;
    }
    return item;
  },

  /**
   * Obtain secure download URL for generated compliance report PDF
   */
  async getReportDownloadAccess(id: string): Promise<ReportDownloadAccess> {
    const res: any = await apiClient<any>(`/reports/${id}/download`);
    return res?.data ?? res;
  },

  /**
   * Initiate new asynchronous compliance report generation
   */
  async generateReport(payload: GenerateReportPayload): Promise<BackendReportDetail> {
    const res: any = await apiClient<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const item = res?.data ?? res;
    if (item && !item._id && item.reportId) {
      item._id = item.reportId;
    }
    return item;
  },
};

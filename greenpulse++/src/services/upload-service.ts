/**
 * @license
 * GreenPulse AI — Telemetry & File Upload Service
 * Communicates with backend endpoints:
 *   POST /api/v1/upload (multipart/form-data)
 *   GET  /api/v1/upload/jobs/:id (Job status tracking)
 */

import { apiClient, ApiError } from './api-client';

export interface UploadJobError {
  row?: number;
  field?: string;
  message: string;
}

export interface UploadJob {
  _id: string;
  companyId: string;
  status: 'queued' | 'processing' | 'failed' | 'completed';
  fileType: 'energy' | 'waste';
  filename: string;
  contentHash: string;
  rowCount?: number;
  processedCount?: number;
  errorDetail?: UploadJobError[];
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadResponse {
  jobId: string;
  status: string;
  message?: string;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

/**
 * Validates file prior to dispatching upload.
 */
export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Please select a file to upload.' };
  }

  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: `Invalid file format '${file.name}'. Only CSV (.csv) and Excel (.xlsx, .xls) files are supported.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty.' };
  }

  return { valid: true };
}

/**
 * Formats row-level errors into a concise, readable string.
 */
export function formatUploadJobErrors(errors?: UploadJobError[]): string {
  if (!errors || errors.length === 0) {
    return 'File processing failed during telemetry verification.';
  }

  const topErrors = errors.slice(0, 3).map((e) => {
    const loc = e.row ? `Row ${e.row}` : '';
    const fld = e.field && e.field !== 'row' ? ` (${e.field})` : '';
    return `${loc}${fld}: ${e.message}`;
  });

  const remainder = errors.length > 3 ? ` (+${errors.length - 3} more errors)` : '';
  return topErrors.join('; ') + remainder;
}

export const uploadService = {
  /**
   * Ensures default departments exist for the authenticated user's company
   * so that uploaded telemetry maps to active organizational units.
   */
  async ensureDepartments(): Promise<void> {
    try {
      const res = await apiClient<{ departments?: Array<{ _id: string; name: string }> }>('/departments');
      const depts = (res as any)?.departments || (Array.isArray(res) ? res : []);
      if (!depts || depts.length === 0) {
        // Create baseline departments
        await apiClient('/departments', {
          method: 'POST',
          body: JSON.stringify({ name: 'Press & Stamping Shop', type: 'operations' }),
        }).catch(() => {});
        await apiClient('/departments', {
          method: 'POST',
          body: JSON.stringify({ name: 'Paint & Coating Facility', type: 'production' }),
        }).catch(() => {});
        await apiClient('/departments', {
          method: 'POST',
          body: JSON.stringify({ name: 'Assembly Line 1', type: 'operations' }),
        }).catch(() => {});
      }
    } catch {
      // Continue silently if departments check fails
    }
  },

  /**
   * Dispatches file to POST /api/v1/upload as multipart/form-data.
   * Browser automatically attaches the multipart boundary.
   */
  async uploadFile(file: File, fileType?: 'energy' | 'waste'): Promise<UploadResponse> {
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      throw new ApiError(validation.error || 'Invalid file', 400, 'INVALID_FILE');
    }

    // Ensure departments exist to prevent department-not-found rejections
    await this.ensureDepartments().catch(() => {});

    const formData = new FormData();
    formData.append('file', file, file.name);
    if (fileType) {
      formData.append('type', fileType);
    }

    const response = await apiClient<UploadResponse>('/upload', {
      method: 'POST',
      body: formData,
    });

    return response;
  },

  /**
   * Fetches job status: GET /api/v1/upload/jobs/:id
   */
  async getJobStatus(jobId: string): Promise<UploadJob> {
    const response = await apiClient<{ job: UploadJob }>(`/upload/jobs/${jobId}`);
    return (response as any).job || (response as any);
  },

  /**
   * Polls job status until it resolves to 'completed' or 'failed'.
   */
  async pollJobUntilDone(
    jobId: string,
    onProgress?: (job: UploadJob) => void,
    intervalMs = 600,
    maxAttempts = 50
  ): Promise<UploadJob> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      const job = await this.getJobStatus(jobId);
      onProgress?.(job);

      if (job.status === 'completed') {
        return job;
      }

      if (job.status === 'failed') {
        const detailMsg = formatUploadJobErrors(job.errorDetail);
        throw new ApiError(detailMsg, 422, 'JOB_FAILED', job.errorDetail);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new ApiError(
      'Telemetry processing timed out. Please check your job status later.',
      408,
      'PROCESSING_TIMEOUT'
    );
  },

  /**
   * Creates a verified sample CSV file compatible with backend energy schema.
   */
  createSampleCsvFile(): File {
    const content =
      'Department,Period,kWh Used\n' +
      'Press & Stamping Shop,2026-07,45200\n' +
      'Paint & Coating Facility,2026-07,68400\n' +
      'Assembly Line 1,2026-07,31900\n' +
      'Press & Stamping Shop,2026-08,43800\n' +
      'Paint & Coating Facility,2026-08,66100\n' +
      'Assembly Line 1,2026-08,30500\n';

    const blob = new Blob([content], { type: 'text/csv' });
    return new File([blob], 'Pune_Facility_2026_Energy_Telemetry.csv', { type: 'text/csv' });
  },

  /**
   * Triggers download of the official GreenPulse Ready-to-Fill Excel Data Template (.xlsx)
   */
  downloadTemplate(): void {
    const link = document.createElement('a');
    link.href = '/templates/greenpulse_data_template.xlsx';
    link.setAttribute('download', 'greenpulse_data_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

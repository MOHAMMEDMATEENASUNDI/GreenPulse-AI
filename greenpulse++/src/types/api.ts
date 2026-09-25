/**
 * @license
 * GreenPulse AI — API Request/Response Schemas
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadCsvResponse {
  jobId: string;
  recordsProcessed: number;
  anomaliesDetectedCount: number;
  newGreenScore: number;
  status: 'SUCCESS' | 'PARTIAL_WARNING' | 'FAILED';
  errors?: string[];
}

export interface CopilotChatRequest {
  message: string;
  contextView?: string;
  conversationHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>;
}

export interface CopilotChatResponse {
  reply: string;
  citations: Array<{ title: string; targetView: string; metricValue?: string }>;
  suggestedActions?: string[];
}

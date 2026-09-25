/**
 * @license
 * GreenPulse AI — Typed API Client Wrapper
 */

import { ENV } from '../constants/env';
import { ApiResponse } from '../types/api';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = sessionStorage.getItem('gp_access_token');
  const companyId = sessionStorage.getItem('gp_company_id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (companyId) {
    headers['X-Company-ID'] = companyId;
  }

  const response = await fetch(`${ENV.appUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, errorBody.message || 'API request failed', errorBody);
  }

  return response.json();
}

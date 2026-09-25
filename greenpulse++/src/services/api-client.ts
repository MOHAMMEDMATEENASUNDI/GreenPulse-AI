/**
 * @license
 * GreenPulse AI — Unified API Client
 * Configured for backend REST APIs at http://localhost:5001/api/v1
 * Supports credentials: 'include' (HTTP-only cookies) & automatic token refresh on 401.
 */

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any[];

  constructor(message: string, statusCode: number, code?: string, details?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001/api/v1';

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function subscribeRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefreshSubscribers(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

/**
 * Execute HTTP request to backend with automatic credentials and error envelopes.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always send and receive HTTP-only cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new ApiError(
      err?.message || 'Network connection failed. Please ensure the backend server is running.',
      0,
      'NETWORK_ERROR'
    );
  }

  // Handle 401 Unauthorized for protected endpoints with token refresh
  const isAuthRoute =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/signup') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/logout');

  if (response.status === 401 && !isAuthRoute) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          isRefreshing = false;
          notifyRefreshSubscribers(true);
          // Retry original request once
          const retriedResponse = await fetch(url, config);
          return handleResponse<T>(retriedResponse);
        } else {
          isRefreshing = false;
          notifyRefreshSubscribers(false);
        }
      } catch {
        isRefreshing = false;
        notifyRefreshSubscribers(false);
      }
    } else {
      // Another request is already performing a token refresh; queue this request
      const refreshSucceeded = await new Promise<boolean>((resolve) => {
        subscribeRefresh(resolve);
      });

      if (refreshSucceeded) {
        const retriedResponse = await fetch(url, config);
        return handleResponse<T>(retriedResponse);
      }
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  let json: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      // Invalid JSON body
    }
  }

  if (!response.ok) {
    const errorMessage =
      json?.error?.message ||
      json?.message ||
      (response.status === 401
        ? 'Authentication required. Please log in.'
        : `Request failed with status ${response.status}`);
    const errorCode = json?.error?.code || 'HTTP_ERROR';
    const errorDetails = json?.error?.details || [];

    throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
  }

  if (json && typeof json === 'object' && 'success' in json) {
    if (!json.success) {
      throw new ApiError(
        json.error?.message || 'Operation failed',
        response.status,
        json.error?.code,
        json.error?.details
      );
    }
    return (json.data ?? json) as T;
  }

  return (json ?? ({} as T)) as T;
}

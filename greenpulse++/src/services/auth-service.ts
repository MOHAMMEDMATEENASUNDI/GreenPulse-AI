/**
 * @license
 * GreenPulse AI — Authentication Service
 * Communicates with backend endpoints:
 *   POST /api/v1/auth/signup
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/refresh
 *   POST /api/v1/auth/logout
 *   GET  /api/v1/auth/me
 *   GET  /api/v1/companies/me
 *   PATCH /api/v1/companies/me
 */

import { apiClient } from './api-client';
import { User, Company } from '../types/domain';

export interface BackendUser {
  _id?: string;
  id?: string;
  email: string;
  role: 'admin' | 'facility_manager' | 'auditor';
  company?: string | { _id: string; name: string; industry?: string; brsrStatus?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendCompany {
  _id?: string;
  id?: string;
  name: string;
  industry?: string;
  employeeCount?: number;
  brsrStatus?: string;
  csrdStatus?: string;
  targets?: {
    netZeroYear: number;
    carbonReductionTargetPct: number;
    energyReductionTargetPct: number;
    wasteDiversionTargetPct: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SignupInput {
  email: string;
  password: string;
  role?: 'admin' | 'facility_manager' | 'auditor';
  fullName?: string;
  companyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthSessionResponse {
  user: User;
  company: Company;
}

/**
 * Maps backend user entity to the frontend User domain model.
 */
export function mapBackendUserToUser(backendUser: BackendUser, customName?: string): User {
  let role: User['role'] = 'FACILITY_MANAGER';
  const rawRole = (backendUser.role || '').toLowerCase();
  if (rawRole === 'admin') role = 'ADMIN';
  else if (rawRole === 'auditor') role = 'AUDITOR_READONLY';

  // Retrieve stored display name if available
  const storedName = customName || localStorage.getItem(`gp_user_name_${backendUser.email}`);
  const fallbackName = backendUser.email
    ? backendUser.email
        .split('@')[0]
        .split(/[._-]/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
    : 'Sustainability Officer';

  return {
    id: backendUser._id || backendUser.id || 'usr-default',
    email: backendUser.email,
    name: storedName || fallbackName,
    role,
    companyId:
      typeof backendUser.company === 'string'
        ? backendUser.company
        : backendUser.company?._id || 'comp-default',
  };
}

/**
 * Maps backend company entity to the frontend Company domain model with safe defaults.
 */
export function mapBackendCompanyToCompany(backendCompany: BackendCompany | null | undefined): Company {
  const brsrRaw = (backendCompany?.brsrStatus || 'voluntary').toUpperCase();
  let brsrStatus: Company['brsrStatus'] = 'VOLUNTARY';
  if (brsrRaw === 'MANDATORY') brsrStatus = 'MANDATORY';
  else if (brsrRaw === 'NON_COMPLIANT') brsrStatus = 'NON_COMPLIANT';

  let csrdStatus: Company['csrdStatus'] = 'IN_SCOPE';
  const csrdRaw = (backendCompany?.csrdStatus || 'in_scope').toUpperCase();
  if (csrdRaw === 'EXEMPT') csrdStatus = 'EXEMPT';
  else if (csrdRaw === 'PREPARING') csrdStatus = 'PREPARING';

  return {
    id: backendCompany?._id || backendCompany?.id || 'comp-101',
    name: backendCompany?.name || 'Apex Manufacturing Ltd.',
    industry: backendCompany?.industry || 'Industrial Manufacturing',
    employeeCount: backendCompany?.employeeCount || 1200,
    brsrStatus,
    csrdStatus,
    targets: backendCompany?.targets || {
      netZeroYear: 2035,
      carbonReductionTargetPct: 40,
      energyReductionTargetPct: 30,
      wasteDiversionTargetPct: 80,
    },
    createdAt: backendCompany?.createdAt || new Date().toISOString(),
  };
}

export const authService = {
  /**
   * Register a new user: POST /auth/signup
   */
  async signup(input: SignupInput): Promise<AuthSessionResponse> {
    const signupData = await apiClient<{ user: BackendUser }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        role: input.role || 'facility_manager',
      }),
    });

    if (input.fullName) {
      localStorage.setItem(`gp_user_name_${signupData.user.email}`, input.fullName.trim());
    }

    // If companyName was provided by user, customize company document
    if (input.companyName && input.companyName.trim()) {
      try {
        await apiClient<{ company: BackendCompany }>('/companies/me', {
          method: 'PATCH',
          body: JSON.stringify({ name: input.companyName.trim() }),
        });
      } catch {
        // Silently continue if company update fails
      }
    }

    let company = mapBackendCompanyToCompany(null);
    try {
      const companyRes = await apiClient<{ company: BackendCompany }>('/companies/me');
      if (companyRes?.company) {
        company = mapBackendCompanyToCompany(companyRes.company);
      }
    } catch {
      // Fallback
    }

    const user = mapBackendUserToUser(signupData.user, input.fullName);
    return { user, company };
  },

  /**
   * Log in user: POST /auth/login
   */
  async login(input: LoginInput): Promise<AuthSessionResponse> {
    const loginData = await apiClient<{ user: BackendUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });

    let company = mapBackendCompanyToCompany(null);
    try {
      const companyRes = await apiClient<{ company: BackendCompany }>('/companies/me');
      if (companyRes?.company) {
        company = mapBackendCompanyToCompany(companyRes.company);
      }
    } catch {
      // Fallback
    }

    const user = mapBackendUserToUser(loginData.user);
    return { user, company };
  },

  /**
   * Restore current session: GET /auth/me
   */
  async getMe(): Promise<AuthSessionResponse> {
    const meData = await apiClient<{ user: BackendUser }>('/auth/me');

    let company = mapBackendCompanyToCompany(null);
    try {
      const companyRes = await apiClient<{ company: BackendCompany }>('/companies/me');
      if (companyRes?.company) {
        company = mapBackendCompanyToCompany(companyRes.company);
      }
    } catch {
      // Fallback
    }

    const user = mapBackendUserToUser(meData.user);
    return { user, company };
  },

  /**
   * Rotate access/refresh tokens: POST /auth/refresh
   */
  async refresh(): Promise<{ user: User }> {
    const refreshData = await apiClient<{ user: BackendUser }>('/auth/refresh', {
      method: 'POST',
    });
    const user = mapBackendUserToUser(refreshData.user);
    return { user };
  },

  /**
   * Revoke tokens and clear cookies: POST /auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue even if network error
    }
  },
};

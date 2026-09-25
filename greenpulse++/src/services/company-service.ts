/**
 * @license
 * GreenPulse AI — Company Profile API Service
 * Interacts with backend endpoints:
 *   - GET  /api/v1/companies/me
 *   - PATCH /api/v1/companies/me
 */

import { apiClient } from './api-client';

/** Backend company profile shape (mirrors Mongoose Company model) */
export interface CompanyProfile {
  _id: string;
  name: string;
  industry: string;
  brsrStatus: 'mandatory' | 'voluntary' | 'in_scope' | 'exempt';
  createdAt?: string;
  updatedAt?: string;
}

/** Allowed fields for company profile update */
export interface CompanyProfileUpdate {
  name?: string;
  industry?: string;
  brsrStatus?: 'mandatory' | 'voluntary' | 'in_scope' | 'exempt';
}

export const CompanyService = {
  /**
   * Fetch the authenticated company's profile
   * GET /api/v1/companies/me
   */
  async getProfile(): Promise<CompanyProfile> {
    const data = await apiClient<{ company: CompanyProfile }>('/companies/me');
    return data.company;
  },

  /**
   * Update the authenticated company's profile
   * PATCH /api/v1/companies/me
   */
  async updateProfile(updates: CompanyProfileUpdate): Promise<CompanyProfile> {
    const data = await apiClient<{ company: CompanyProfile }>('/companies/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.company;
  },
};

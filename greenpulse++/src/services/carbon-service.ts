/**
 * @license
 * GreenPulse AI — Carbon Intelligence API Service
 * Interacts with backend endpoints:
 *   - GET /api/v1/carbon/summary
 *   - GET /api/v1/carbon/departments/:id
 *   - GET /api/v1/energy/usage
 *   - GET /api/v1/recommendations
 *   - PATCH /api/v1/recommendations/:id
 */

import { apiClient } from './api-client';
import {
  CarbonSummaryData,
  DepartmentCarbonDetail,
  EnergyActivityItem,
} from '../types/domain';
import { RecommendationService, BackendRecommendation } from './recommendation-service';
export type { BackendRecommendation };
export { RecommendationService };

export const CarbonService = {
  /**
   * Fetch company-wide carbon emissions summary and scope breakdowns
   * GET /api/v1/carbon/summary
   */
  async getCarbonSummary(): Promise<CarbonSummaryData> {
    return apiClient<CarbonSummaryData>('/carbon/summary');
  },

  /**
   * Fetch emissions history and breakdown for a specific department
   * GET /api/v1/carbon/departments/:id
   */
  async getDepartmentCarbon(departmentId: string): Promise<DepartmentCarbonDetail> {
    return apiClient<DepartmentCarbonDetail>(`/carbon/departments/${departmentId}`);
  },

  /**
   * Fetch real company energy telemetry records
   * GET /api/v1/energy/usage
   */
  async getEnergyUsage(): Promise<EnergyActivityItem[]> {
    try {
      const res = await apiClient<{ usage: EnergyActivityItem[] }>('/energy/usage');
      return res.usage || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch recommendations for the authenticated company
   * GET /api/v1/recommendations
   */
  async getRecommendations(): Promise<BackendRecommendation[]> {
    return RecommendationService.getRecommendations();
  },

  /**
   * Update recommendation status (approved or dismissed)
   * PATCH /api/v1/recommendations/:id
   */
  async updateRecommendationStatus(id: string, status: 'approved' | 'dismissed'): Promise<any> {
    return RecommendationService.updateRecommendationStatus(id, status);
  },
};

/**
 * @license
 * GreenPulse AI — Phase 7H Recommendation Service
 * Direct connection to real backend endpoints:
 *   - GET /api/v1/recommendations
 *   - PATCH /api/v1/recommendations/:id
 * Strict adherence: Backend is the sole source of truth. No client recalculations.
 */

import { apiClient } from './api-client';

export interface BackendRecommendation {
  _id?: string;
  id?: string;
  action: string;
  category: string;
  priorityScore: number;
  status: 'pending' | 'approved' | 'dismissed';
  estimatedImpact?: {
    costSavingsINR?: number;
    co2Reduction?: number;
  };
  sourceContext?: {
    triggeringJobId?: string;
    carbonSummary?: {
      totalKgCO2e?: number;
      scope2KgCO2e?: number;
    };
    anomalySummaries?: Array<{
      departmentName: string;
      period: string;
      deviationPercent: number;
      severity: string;
    }>;
    greenScoreBreakdown?: {
      overallScore?: number;
      energyEfficiencyScore?: number;
      complianceScore?: number;
    };
  };
  department?: string;
  createdAt?: string;
  respondedAt?: string;
  updatedAt?: string;
}

export const RecommendationService = {
  /**
   * Fetch recommendations for the authenticated company
   * GET /api/v1/recommendations[?status=pending|approved|dismissed]
   */
  async getRecommendations(status?: string): Promise<BackendRecommendation[]> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await apiClient<{ recommendations: BackendRecommendation[] }>(`/recommendations${query}`);
    return res.recommendations || [];
  },

  /**
   * Update recommendation status to 'approved' or 'dismissed'
   * PATCH /api/v1/recommendations/:id
   */
  async updateRecommendationStatus(
    id: string,
    status: 'approved' | 'dismissed'
  ): Promise<BackendRecommendation> {
    const res = await apiClient<{ recommendation: BackendRecommendation }>(`/recommendations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.recommendation;
  },
};

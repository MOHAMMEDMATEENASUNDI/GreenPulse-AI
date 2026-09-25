/**
 * @license
 * GreenPulse AI — Dashboard & Green Score API Service
 * Interacts with backend endpoints:
 *   - GET /api/v1/greenscore
 *   - GET /api/v1/carbon/summary
 *   - GET /api/v1/esg/score
 *   - GET /api/v1/waste/summary
 */

import { apiClient } from './api-client';
import {
  GreenScoreData,
  CarbonSummaryData,
  ESGScoreData,
  WasteSummary,
} from '../types/domain';

export const DashboardService = {
  /**
   * Fetch company latest Green Score and breakdown
   * GET /api/v1/greenscore
   */
  async getGreenScore(): Promise<GreenScoreData> {
    return apiClient<GreenScoreData>('/greenscore');
  },

  /**
   * Fetch company-wide carbon emissions summary and scope breakdowns
   * GET /api/v1/carbon/summary
   */
  async getCarbonSummary(): Promise<CarbonSummaryData> {
    return apiClient<CarbonSummaryData>('/carbon/summary');
  },

  /**
   * Fetch SEBI BRSR 9-principle ESG score & Principle 6 readiness
   * GET /api/v1/esg/score
   */
  async getEsgScore(): Promise<ESGScoreData> {
    return apiClient<ESGScoreData>('/esg/score');
  },

  /**
   * Fetch company-wide waste intelligence summary
   * GET /api/v1/waste/summary
   */
  async getWasteSummary(): Promise<WasteSummary> {
    return apiClient<WasteSummary>('/waste/summary');
  },
};

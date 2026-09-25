/**
 * @license
 * GreenPulse AI — Waste Intelligence Service
 * Interacts with backend endpoint: GET /api/v1/waste/summary
 */

import { apiClient } from './api-client';
import { WasteSummary } from '../types/domain';

export const WasteService = {
  async getWasteSummary(): Promise<WasteSummary> {
    return apiClient<WasteSummary>('/waste/summary');
  },
};

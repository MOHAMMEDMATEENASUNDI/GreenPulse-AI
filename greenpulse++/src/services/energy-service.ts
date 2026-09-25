/**
 * @license
 * GreenPulse AI — Energy Service
 * Connects directly to backend GET /api/v1/energy/usage and GET /api/v1/energy/anomalies.
 */

import { apiClient } from './api-client';
import { EnergyActivityItem, EnergyAnomalyItem } from '../types/domain';

export interface EnergyUsageFilters {
  departmentId?: string;
  period?: string;
}

export interface EnergyAnomalyFilters {
  departmentId?: string;
  period?: string;
  severity?: string;
}

export const EnergyService = {
  /**
   * Fetch real company energy consumption records
   * GET /api/v1/energy/usage
   */
  async getEnergyUsage(filters?: EnergyUsageFilters): Promise<EnergyActivityItem[]> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.period) params.append('period', filters.period);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<{ usage: EnergyActivityItem[] }>(`/energy/usage${query}`);
    return res.usage || [];
  },

  /**
   * Fetch detected energy anomalies
   * GET /api/v1/energy/anomalies
   */
  async getEnergyAnomalies(filters?: EnergyAnomalyFilters): Promise<EnergyAnomalyItem[]> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.severity) params.append('severity', filters.severity);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<{ anomalies: EnergyAnomalyItem[] }>(`/energy/anomalies${query}`);
    return res.anomalies || [];
  },
};

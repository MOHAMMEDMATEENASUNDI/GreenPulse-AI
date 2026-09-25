/**
 * @license
 * GreenPulse AI — ESG Compliance Service
 * Connects directly to backend GET /api/v1/esg/score and POST /api/v1/esg/principles/:principleNumber/evidence.
 */

import { apiClient } from './api-client';
import { ESGScoreData, ESGPrincipleScore } from '../types/domain';

export interface EvidenceItemPayload {
  name: string;
  reference: string;
  targetGap?: string;
}

export interface AddEvidencePayload {
  evidenceType: 'demo';
  evidenceItems: EvidenceItemPayload[];
}

export const EsgService = {
  /**
   * Fetch SEBI BRSR 9-principle ESG score, evidence, and disclosure gaps
   * GET /api/v1/esg/score
   */
  async getEsgScore(): Promise<ESGScoreData> {
    return apiClient<ESGScoreData>('/esg/score');
  },

  /**
   * Attach demo evidence items to a specific ESG principle and resolve matching disclosure gaps
   * POST /api/v1/esg/principles/:principleNumber/evidence
   */
  async addPrincipleEvidence(
    principleNumber: number,
    payload: AddEvidencePayload
  ): Promise<ESGPrincipleScore> {
    return apiClient<ESGPrincipleScore>(`/esg/principles/${principleNumber}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

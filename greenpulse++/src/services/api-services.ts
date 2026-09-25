/**
 * @license
 * GreenPulse AI — API Service Contracts & Methods
 */

import {
  CarbonEmissions,
  EnergyRecord,
  ESGComplianceMetric,
  WasteStreamRecord,
  AIRecommendation,
  ComplianceReport
} from '../types/domain';


export const CopilotService = {
  async generateChatResponse(message: string) {
    return {
      reply: `Based on your July operational data, Floor 3's HVAC spike (+40%) was the primary contributor to your Scope 2 increase. Implementing recommendation #REC-104 will reduce overall monthly energy expenditure by ₹85,000.`,
      citations: [
        { title: 'Floor 3 Energy Log', targetView: '/app/energy', metricValue: '140 kWh anomaly' },
        { title: 'BRSR Principle 6', targetView: '/app/esg', metricValue: 'Energy Intensity' },
      ],
      suggestedActions: [
        'Approve Chiller Rescheduling',
        'Download Scope 2 Breakdown',
      ],
    };
  },
};

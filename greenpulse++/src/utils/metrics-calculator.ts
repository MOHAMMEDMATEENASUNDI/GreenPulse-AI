/**
 * @license
 * GreenPulse AI — Client-Side Green Score & Emissions Calculation Formulae
 */

import { GreenScoreData } from '../types/domain';

/**
 * Calculates Composite Green Score (0-100)
 * Formula:
 * GreenScore = (0.35 * CarbonPerformance) + (0.25 * EnergyEfficiency) +
 *              (0.20 * WasteManagement) + (0.20 * ComplianceCompleteness)
 */
export function calculateGreenScore(subScores: {
  carbonPerformance: number;
  energyEfficiency: number;
  wasteManagement: number;
  complianceCompleteness: number;
}): GreenScoreData {
  const { carbonPerformance, energyEfficiency, wasteManagement, complianceCompleteness } = subScores;

  const compositeScore = Math.round(
    0.35 * carbonPerformance +
    0.25 * energyEfficiency +
    0.20 * wasteManagement +
    0.20 * complianceCompleteness
  );

  return {
    score: Math.min(100, Math.max(0, compositeScore)),
    deltaMonth: 12, // Default mock month-over-month delta
    lastUpdated: new Date().toISOString(),
    breakdown: {
      carbonPerformance,
      energyEfficiency,
      wasteManagement,
      complianceCompleteness,
    },
  };
}

/**
 * Converts kWh to Scope 2 kgCO2e using India Central Electricity Authority grid average factor (~0.82 kgCO2e/kWh)
 */
export function calculateGridScope2Emissions(kwh: number, emissionFactor: number = 0.82): number {
  return Math.round(kwh * emissionFactor);
}

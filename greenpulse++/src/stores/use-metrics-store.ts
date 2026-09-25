/**
 * @license
 * GreenPulse AI — Metrics & Event Feed Stores
 * Fully integrated with real backend APIs for Dashboard & Green Score
 */

import { useState, useEffect } from 'react';
import {
  GreenScoreData,
  CarbonSummaryData,
  ESGScoreData,
  WasteSummary,
} from '../types/domain';
import { DashboardService } from '../services/dashboard-service';
import { triggerGlassSweep } from '../utils/glass-sweep';

type Listener = () => void;

export interface MetricsState {
  greenScore: GreenScoreData;
  carbonSummary: CarbonSummaryData | null;
  esgScore: ESGScoreData | null;
  wasteSummary: WasteSummary | null;
  totalScope1Kg: number | null; // null represents unavailable
  totalScope2Kg: number;
  totalScope3Kg: number | null; // null represents unavailable
  totalEnergyKwh: number;
  totalEnergyCostInr: number;
  brsrCompliancePct: number;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  hasData: boolean;
  lastFetchedAt: string | null;
}

let metricsState: MetricsState = {
  greenScore: {
    score: 84,
    deltaMonth: 0,
    lastUpdated: new Date().toISOString(),
    breakdown: {
      carbonPerformance: { score: 88, source: 'baseline_fallback' },
      energyEfficiency: { score: 82, source: 'baseline_fallback' },
      wasteManagement: { score: 85, source: 'baseline_fallback' },
      complianceCompleteness: { score: 81, source: 'baseline_fallback' },
    },
  },
  carbonSummary: null,
  esgScore: null,
  wasteSummary: null,
  totalScope1Kg: null,
  totalScope2Kg: 0,
  totalScope3Kg: null,
  totalEnergyKwh: 0,
  totalEnergyCostInr: 0,
  brsrCompliancePct: 0,
  isLoading: false,
  isLoaded: false,
  error: null,
  hasData: false,
  lastFetchedAt: null,
};

const metricsListeners = new Set<Listener>();

function notifyListeners() {
  metricsListeners.forEach((l) => l());
}

let inflightFetchPromise: Promise<void> | null = null;

async function executeFetchDashboardMetrics(force: boolean = false): Promise<void> {
  // If already fetched and not forced, avoid duplicate network calls
  if (metricsState.isLoaded && !force && inflightFetchPromise === null) {
    return;
  }

  // Deduplicate concurrent fetch requests
  if (inflightFetchPromise) {
    return inflightFetchPromise;
  }

  metricsState = { ...metricsState, isLoading: true, error: null };
  notifyListeners();

  inflightFetchPromise = (async () => {
    try {
      const [greenScoreRes, carbonRes, esgRes, wasteRes] = await Promise.allSettled([
        DashboardService.getGreenScore(),
        DashboardService.getCarbonSummary(),
        DashboardService.getEsgScore(),
        DashboardService.getWasteSummary(),
      ]);

      let updatedGreenScore = metricsState.greenScore;
      let updatedCarbon = metricsState.carbonSummary;
      let updatedEsg = metricsState.esgScore;
      let updatedWaste = metricsState.wasteSummary;
      let failedCount = 0;

      if (greenScoreRes.status === 'fulfilled' && greenScoreRes.value) {
        updatedGreenScore = greenScoreRes.value;
      } else {
        failedCount++;
        console.warn('GreenScore fetch failed or unavailable:', greenScoreRes.status === 'rejected' ? greenScoreRes.reason : null);
      }

      if (carbonRes.status === 'fulfilled' && carbonRes.value) {
        updatedCarbon = carbonRes.value;
      } else {
        failedCount++;
        console.warn('Carbon summary fetch failed or unavailable:', carbonRes.status === 'rejected' ? carbonRes.reason : null);
      }

      if (esgRes.status === 'fulfilled' && esgRes.value) {
        updatedEsg = esgRes.value;
      } else {
        failedCount++;
        console.warn('ESG score fetch failed or unavailable:', esgRes.status === 'rejected' ? esgRes.reason : null);
      }

      if (wasteRes.status === 'fulfilled' && wasteRes.value) {
        updatedWaste = wasteRes.value;
      } else {
        failedCount++;
        console.warn('Waste summary fetch failed or unavailable:', wasteRes.status === 'rejected' ? wasteRes.reason : null);
      }

      // If all 4 requests rejected, report genuine error state
      if (failedCount === 4) {
        metricsState = {
          ...metricsState,
          isLoading: false,
          isLoaded: true,
          error: 'Unable to connect to telemetry service. Please verify your connection.',
        };
        notifyListeners();
        return;
      }

      // Calculate 9-principle average compliance score
      let compliancePct = 0;
      if (updatedEsg && Array.isArray(updatedEsg.principles) && updatedEsg.principles.length > 0) {
        const totalCov = updatedEsg.principles.reduce((acc, p) => acc + (p.coveragePercent || 0), 0);
        compliancePct = Math.round(totalCov / updatedEsg.principles.length);
      }

      // Check whether real operational records exist
      const hasAnyData = Boolean(
        (updatedCarbon && updatedCarbon.totalKwh > 0) ||
        (updatedWaste && updatedWaste.hasData && updatedWaste.totalKg > 0)
      );

      const realScope2 = updatedCarbon
        ? (updatedCarbon.totalKgCO2e ?? updatedCarbon.scopes?.scope2?.value ?? 0)
        : 0;

      const realTotalKwh = updatedCarbon ? updatedCarbon.totalKwh : 0;

      metricsState = {
        greenScore: updatedGreenScore,
        carbonSummary: updatedCarbon,
        esgScore: updatedEsg,
        wasteSummary: updatedWaste,
        totalScope1Kg: null, // Strictly unavailable per backend specifications
        totalScope2Kg: realScope2,
        totalScope3Kg: null, // Strictly unavailable per backend specifications
        totalEnergyKwh: realTotalKwh,
        totalEnergyCostInr: Math.round(realTotalKwh * 8), // Standard commercial tariff estimation
        brsrCompliancePct: compliancePct,
        isLoading: false,
        isLoaded: true,
        error: null,
        hasData: hasAnyData,
        lastFetchedAt: new Date().toISOString(),
      };

      notifyListeners();
      triggerGlassSweep();
    } catch (err: any) {
      metricsState = {
        ...metricsState,
        isLoading: false,
        isLoaded: true,
        error: err?.message || 'Failed to synchronize with telemetry backend.',
      };
      notifyListeners();
    } finally {
      inflightFetchPromise = null;
    }
  })();

  return inflightFetchPromise;
}

export function useMetricsStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    metricsListeners.add(listener);
    return () => {
      metricsListeners.delete(listener);
    };
  }, []);

  return {
    ...metricsState,
    fetchDashboardMetrics: (force: boolean = false) => executeFetchDashboardMetrics(force),
    updateGreenScore: (greenScore: GreenScoreData) => {
      metricsState = { ...metricsState, greenScore };
      notifyListeners();
      triggerGlassSweep();
    },
  };
}

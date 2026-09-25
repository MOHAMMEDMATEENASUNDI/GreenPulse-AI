/**
 * @license
 * GreenPulse AI — Domain Entity Interfaces
 * Companion to Frontend Architecture v1.0
 */

export interface Company {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  brsrStatus: 'MANDATORY' | 'VOLUNTARY' | 'NON_COMPLIANT';
  csrdStatus: 'IN_SCOPE' | 'EXEMPT' | 'PREPARING';
  targets: CompanyTargets;
  createdAt: string;
}

export interface CompanyTargets {
  netZeroYear: number;
  carbonReductionTargetPct: number;
  energyReductionTargetPct: number;
  wasteDiversionTargetPct: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'FACILITY_MANAGER' | 'AUDITOR_READONLY';
  companyId: string;
  avatarUrl?: string;
}

export interface GreenScoreBreakdownItem {
  score: number;
  source?: string;
  baselinePeriod?: string | null;
  currentPeriod?: string | null;
  baselineValue?: number | null;
  currentValue?: number | null;
}

export interface GreenScoreData {
  score: number; // 0 - 100
  period?: string;
  deltaMonth: number;
  lastUpdated: string;
  breakdown: {
    carbonPerformance: number | GreenScoreBreakdownItem; // 0-100 weight 35%
    energyEfficiency: number | GreenScoreBreakdownItem;  // 0-100 weight 25%
    wasteManagement: number | GreenScoreBreakdownItem;   // 0-100 weight 20%
    complianceCompleteness: number | GreenScoreBreakdownItem; // 0-100 weight 20%
  };
  trend?: Array<{
    period: string;
    score: number;
    calculatedAt: string;
  }>;
}

export interface ScopeDetail {
  value: number | null;
  dataAvailable: boolean;
  reason?: string | null;
}

export interface CarbonPeriodSummary {
  period: string;
  kwhUsed: number;
  co2eScope1?: number | null;
  co2eScope2: number;
  co2eScope3?: number | null;
  totalCo2e: number;
  scopes: {
    scope1: ScopeDetail;
    scope2: ScopeDetail;
    scope3: ScopeDetail;
  };
  activeDepartments: number;
}

export interface CarbonDepartmentSummary {
  departmentId: string;
  departmentName: string;
  kwhUsed: number;
  totalCo2e: number;
  scopes: {
    scope1: ScopeDetail;
    scope2: ScopeDetail;
    scope3: ScopeDetail;
  };
}

export interface CarbonSummaryData {
  latestPeriod: string | null;
  totalKgCO2e: number;
  totalKwh: number;
  scopes: {
    scope1: ScopeDetail;
    scope2: ScopeDetail;
    scope3: ScopeDetail;
  };
  factorVersion: string;
  periods: CarbonPeriodSummary[];
  departmentBreakdown: CarbonDepartmentSummary[];
}

export interface DepartmentCarbonDetail {
  department: {
    id: string;
    name: string;
    facilityType?: string;
  };
  totalKgCO2e: number;
  totalKwh: number;
  scopes: {
    scope1: ScopeDetail;
    scope2: ScopeDetail;
    scope3: ScopeDetail;
  };
  history: Array<{
    period: string;
    kwhUsed: number;
    totalCo2e: number;
    scopes: {
      scope1: ScopeDetail;
      scope2: ScopeDetail;
      scope3: ScopeDetail;
    };
    factorVersion: string;
  }>;
}

export interface EnergyActivityItem {
  id: string;
  departmentId?: string;
  period: string;
  kwhUsed: number;
  department: string;
  facilityType: string;
  uploadJobId?: string;
}

export interface EnergyAnomalyItem {
  id: string;
  departmentId?: string;
  department: string;
  period: string;
  metric: string;
  currentValue: number;
  baselineMean: number;
  standardDeviation: number;
  zScore: number | null;
  deviationPercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt?: string;
  uploadJobId?: string;
}

export interface ESGPrincipleScore {
  number: number;
  name: string;
  status: 'complete' | 'partial' | 'missing';
  coveragePercent: number;
  activeDataSources: string[];
  specificGaps: string[];
  mappedEvidence: string[];
}

export interface ESGScoreData {
  principles: ESGPrincipleScore[];
  summary: {
    total: number;
    complete: number;
    partial: number;
    missing: number;
  };
}

export interface CarbonEmissions {
  id: string;
  departmentId: string;
  departmentName: string;
  period: string; // YYYY-MM
  scope1KgCO2e: number;
  scope2KgCO2e: number;
  scope3KgCO2e: number;
  totalKgCO2e: number;
  factorVersion: string;
}

export interface Department {
  id: string;
  name: string;
  facilityType: 'MANUFACTURING' | 'OFFICE' | 'WAREHOUSE' | 'DATA_CENTER';
  headCount: number;
  areaSqFt: number;
}

export interface EnergyRecord {
  id: string;
  departmentId: string;
  timestamp: string;
  kwhConsumed: number;
  costInr: number;
  isAnomaly: boolean;
  anomalyScore?: number;
}

export interface WasteStreamRecord {
  id: string;
  departmentId: string;
  category: 'HAZARDOUS' | 'RECYCLABLE' | 'COMPOSTABLE' | 'LANDFILL';
  quantityKg: number;
  diversionPct: number;
  period: string;
}

export interface WasteSubcategoryBreakdown {
  Plastic: number;
  Paper: number;
  Aluminium: number;
  Steel: number;
  Rubber: number;
  'Used Oil': number;
  'Chemical Bottles': number;
  'Food Waste': number;
  [key: string]: number;
}

export interface WasteCategoryDetail {
  totalKg: number;
  percentage: number;
  subcategories: Record<string, number>;
}

export interface WastePeriodBreakdown {
  period: string;
  totalKg: number;
  recyclableKg: number;
  hazardousKg: number;
  organicKg: number;
}

export interface WasteSummary {
  hasData: boolean;
  totalKg: number;
  recyclableKg: number;
  hazardousKg: number;
  organicKg: number;
  recyclablePct: number;
  hazardousPct: number;
  organicPct: number;
  subcategories: WasteSubcategoryBreakdown;
  byCategory: {
    recyclable: WasteCategoryDetail;
    hazardous: WasteCategoryDetail;
    organic: WasteCategoryDetail;
  };
  periods: WastePeriodBreakdown[];
  recordsCount: number;
}

export interface ESGComplianceMetric {
  id: string;
  principleCode: string; // e.g. "BRSR-P6"
  principleTitle: string;
  framework: 'BRSR' | 'GRI' | 'ISO_14001';
  status: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  completionPct: number;
  missingDataPrompt?: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'ENERGY' | 'CARBON' | 'WASTE' | 'COMPLIANCE';
  priorityScore: number; // 1-100
  estimatedCostSavingInr: number;
  estimatedCo2eReductionKg: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
  createdAt: string;
  citedSource?: string;
}

export interface LiveFeedEvent {
  id: string;
  timestamp: string;
  type: 'ANOMALY_DETECTED' | 'SCORE_UPDATED' | 'RECOMMENDATION_ADDED' | 'REPORT_GENERATED' | 'UPLOAD_SUCCESS';
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  departmentId?: string;
  actionUrl?: string;
}

export interface ComplianceReport {
  id: string;
  companyId: string;
  type: 'SEBI_BRSR' | 'GRI_STANDARDS' | 'ISO_14001' | 'EXECUTIVE_SUMMARY';
  title: string;
  generatedAt: string;
  period: string;
  fileUrl?: string;
  status: 'GENERATING' | 'READY' | 'FAILED';
  verificationHash: string;
}

export interface PenaltyShieldPrinciple {
  number: number;
  name: string;
  status: 'complete' | 'partial' | 'missing' | 'COMPLETE' | 'PARTIAL' | 'MISSING';
  coveragePercent: number;
  activeDataSources?: string[];
  mappedEvidence?: string[];
  specificGaps?: string[];
  // Backwards-compatible aliases
  principleNumber?: number;
  displayLabel?: string;
  disclosureRisk?: 'Low' | 'Medium' | 'High' | 'Critical';
  missingDataPoints?: string[];
  mappedDataSources?: string[];
  coveragePct?: number;
}

export interface PenaltyShieldData {
  principles: PenaltyShieldPrinciple[];
  lastAssessed?: string;
  summary: {
    total: number;
    complete: number;
    partial: number;
    missing: number;
  };
}


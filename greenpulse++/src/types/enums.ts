/**
 * @license
 * GreenPulse AI — System Enumerations
 * Companion to Frontend Architecture v1.0
 */

export enum ScopeType {
  SCOPE_1 = 'SCOPE_1', // Direct emissions
  SCOPE_2 = 'SCOPE_2', // Purchased energy
  SCOPE_3 = 'SCOPE_3', // Value chain
  TOTAL = 'TOTAL',
}

export enum RecommendationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISMISSED = 'DISMISSED',
}

export enum AnomalySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ComplianceFramework {
  BRSR = 'BRSR',
  GRI = 'GRI',
  ISO_14001 = 'ISO_14001',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  FACILITY_MANAGER = 'FACILITY_MANAGER',
  AUDITOR_READONLY = 'AUDITOR_READONLY',
}

export enum ThemeMode {
  DARK = 'dark',
  LIGHT = 'light',
}

/**
 * GreenPulse AI - Report Configuration & Statutory Applicability
 * Deterministic mapping of report types to applicable ESG principles and statutory frameworks.
 */

const REPORT_TYPES = {
  SEBI_BRSR: 'SEBI_BRSR',
  GRI_STANDARDS: 'GRI_STANDARDS',
  SCOPE_1_2_GHG: 'SCOPE_1_2_GHG',
};

const REPORT_CONFIGS = {
  [REPORT_TYPES.SEBI_BRSR]: {
    name: 'SEBI Business Responsibility & Sustainability Report',
    framework: 'SEBI BRSR Core (India NGRBC Standards)',
    applicablePrinciples: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    description: 'Statutory ESG disclosure covering all 9 National Guidelines on Responsible Business Conduct principles.',
  },
  [REPORT_TYPES.GRI_STANDARDS]: {
    name: 'Global Reporting Initiative (GRI) Standards Report',
    framework: 'GRI Standards 2021 Multi-Stakeholder Framework',
    applicablePrinciples: [1, 2, 3, 5, 6, 7, 8],
    description: 'International sustainability reporting across governance, ethics, employee well-being, human rights, and environment.',
  },
  [REPORT_TYPES.SCOPE_1_2_GHG]: {
    name: 'Scope 1 & Scope 2 GHG Emissions Inventory',
    framework: 'GHG Protocol Corporate Standard & CEA CO2 Baseline',
    applicablePrinciples: [6],
    description: 'Targeted greenhouse gas emissions inventory detailing direct (Scope 1) and purchased electricity (Scope 2) carbon metrics.',
  },
};

module.exports = {
  REPORT_TYPES,
  REPORT_CONFIGS,
  VALID_REPORT_TYPES: Object.values(REPORT_TYPES),
};

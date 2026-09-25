/**
 * GreenPulse AI - Deterministic ESG Rubric Configuration
 * Governs the exact completeness evaluation for Principle 6 (Environment)
 * and defines the statutory seeded defaults for Principles 1-5 and 7-9.
 */

/**
 * Deterministic evaluation logic for Principle 6 based on operational activity records.
 * @param {boolean} hasEnergyData
 * @param {boolean} hasWasteData
 */
const evaluatePrinciple6 = (hasEnergyData, hasWasteData) => {
  if (hasEnergyData && hasWasteData) {
    return {
      status: 'complete',
      coveragePercent: 100,
      activeDataSources: [
        '[OPERATIONAL] Real-time Energy Telemetry',
        '[OPERATIONAL] Waste Stream Activity Records',
      ],
      mappedEvidence: [
        '[OPERATIONAL EVIDENCE] Scope 2 Electricity Grid Telemetry (CEA-2025.1)',
        '[OPERATIONAL EVIDENCE] Operational Waste Stream Ledger',
      ],
      specificGaps: [],
    };
  }

  if (hasEnergyData && !hasWasteData) {
    return {
      status: 'partial',
      coveragePercent: 50,
      activeDataSources: ['[OPERATIONAL] Real-time Energy Telemetry'],
      mappedEvidence: ['[OPERATIONAL EVIDENCE] Scope 2 Electricity Grid Telemetry (CEA-2025.1)'],
      specificGaps: [
        'Missing operational waste stream records',
        'Missing Scope 1 direct fuel & Scope 3 value-chain telemetry',
      ],
    };
  }

  if (!hasEnergyData && hasWasteData) {
    return {
      status: 'partial',
      coveragePercent: 40,
      activeDataSources: ['[OPERATIONAL] Waste Stream Activity Records'],
      mappedEvidence: ['[OPERATIONAL EVIDENCE] Operational Waste Stream Ledger'],
      specificGaps: [
        'Missing electricity & energy consumption records',
        'Missing Scope 1 & Scope 2 greenhouse gas telemetry',
      ],
    };
  }

  return {
    status: 'missing',
    coveragePercent: 0,
    activeDataSources: [],
    mappedEvidence: [],
    specificGaps: [
      'No energy consumption data ingested',
      'No waste stream activity records ingested',
      'No greenhouse gas emission telemetry available',
    ],
  };
};

/**
 * Statutory template defaults for Principles 1-5 and 7-9.
 * Communicates demo/pending status strictly within existing response schema fields.
 */
const SEEDED_PRINCIPLES_DEFAULTS = [
  {
    principleNumber: 1,
    name: 'Ethics, Transparency & Accountability',
    status: 'complete',
    coveragePercent: 100,
    activeDataSources: ['[DEMO/SEEDED] Corporate Policy Template'],
    specificGaps: ['[PENDING AUDIT] Real operational evidence not yet ingested; evaluated against default template'],
    mappedEvidence: [
      '[SEEDED DEMO] Anti-Corruption & Whistleblower Policy (Template)',
      '[SEEDED DEMO] Director & Key Management Personnel Disclosures',
    ],
  },
  {
    principleNumber: 2,
    name: 'Safe & Sustainable Goods and Services',
    status: 'partial',
    coveragePercent: 65,
    activeDataSources: ['[DEMO/SEEDED] Product Safety Registry'],
    specificGaps: [
      '[PENDING AUDIT] Life Cycle Assessment (LCA) data for Top 3 revenue products',
      '[PENDING AUDIT] Recycled input material percentage certifications',
    ],
    mappedEvidence: ['[SEEDED DEMO] Raw Material Procurement Ledger (Template)'],
  },
  {
    principleNumber: 3,
    name: 'Employee Wellbeing (incl. value chain workers)',
    status: 'partial',
    coveragePercent: 55,
    activeDataSources: ['[DEMO/SEEDED] HRMS Policy Manual'],
    specificGaps: [
      '[PENDING AUDIT] Value-chain contractor safety telemetry',
      '[PENDING AUDIT] Employee Grievance Redressal audit breakdown',
    ],
    mappedEvidence: ['[SEEDED DEMO] Permanent Employee HRMS Roster & Insurance Records'],
  },
  {
    principleNumber: 4,
    name: 'Stakeholder Interests',
    status: 'complete',
    coveragePercent: 100,
    activeDataSources: ['[DEMO/SEEDED] Stakeholder Engagement Framework'],
    specificGaps: ['[PENDING AUDIT] Operational consultation logs awaiting digital integration'],
    mappedEvidence: ['[SEEDED DEMO] Annual Stakeholder Consultation Minutes'],
  },
  {
    principleNumber: 5,
    name: 'Human Rights',
    status: 'complete',
    coveragePercent: 100,
    activeDataSources: ['[DEMO/SEEDED] Human Rights Code of Conduct'],
    specificGaps: ['[PENDING AUDIT] Internal audit certification pending quarterly review'],
    mappedEvidence: [
      '[SEEDED DEMO] Statutory Human Rights Review FY26',
      '[SEEDED DEMO] POSH Committee Filings',
    ],
  },
  {
    principleNumber: 7,
    name: 'Responsible Public Policy Advocacy',
    status: 'complete',
    coveragePercent: 100,
    activeDataSources: ['[DEMO/SEEDED] Public Policy Advocacy Policy'],
    specificGaps: ['[PENDING AUDIT] Verified trade association ledger pending upload'],
    mappedEvidence: ['[SEEDED DEMO] Industry Association Trade Memberships List (CII / FICCI)'],
  },
  {
    principleNumber: 8,
    name: 'Inclusive Growth & Equitable Development',
    status: 'missing',
    coveragePercent: 15,
    activeDataSources: ['[DEMO/SEEDED] CSR Committee Charter'],
    specificGaps: [
      '[PENDING AUDIT] CSR Project Direct Beneficiary telemetry missing',
      '[PENDING AUDIT] Local Sourcing percentage from MSME audit ledger missing',
    ],
    mappedEvidence: ['[SEEDED DEMO] CSR Committee Budget Approval Ledger'],
  },
  {
    principleNumber: 9,
    name: 'Engaging & Providing Value to Consumers',
    status: 'complete',
    coveragePercent: 100,
    activeDataSources: ['[DEMO/SEEDED] Consumer Relations Policy'],
    specificGaps: ['[PENDING AUDIT] Direct API sync for consumer sentiment audit pending'],
    mappedEvidence: [
      '[SEEDED DEMO] Consumer Satisfaction Index Survey (Template)',
      '[SEEDED DEMO] Data Privacy & Cybersecurity Audit Certificate (ISO 27001)',
    ],
  },
];

module.exports = {
  evaluatePrinciple6,
  SEEDED_PRINCIPLES_DEFAULTS,
};

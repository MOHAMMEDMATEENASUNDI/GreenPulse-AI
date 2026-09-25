/**
 * @license
 * GreenPulse AI — Copilot Intelligence Engine & Data Models
 * Grounded in SEBI BRSR Principle 6, GHG Protocol Corporate Standard, and SCADA Sensor Logs.
 */

export interface CopilotCitation {
  id: string;
  title: string;
  source: string;
  link?: string;
  relevance: string;
}

export interface CopilotRecommendation {
  id: string;
  title: string;
  category: 'Energy Shift' | 'Carbon Reduction' | 'BRSR Compliance' | 'Supply Chain';
  estimatedSavings: string;
  co2Reduction: string;
  roiMonths: number;
  status: 'Recommended' | 'In Progress' | 'Applied';
  actionLabel: string;
}

export interface CopilotChartData {
  type: 'bar' | 'line' | 'area';
  title: string;
  dataKey: string;
  data: { name: string; value: number; baseline?: number; target?: number }[];
  unit: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  reasoningSteps?: string[];
  citations?: CopilotCitation[];
  recommendationCard?: CopilotRecommendation;
  chart?: CopilotChartData;
  greenScoreImpact?: {
    current: number;
    potential: number;
    delta: string;
  };
  isStreaming?: boolean;
}

export interface CopilotPromptTemplate {
  id: string;
  category: 'Carbon Insights' | 'Energy Optimization' | 'ESG & SEBI BRSR' | 'Green Score' | 'Scope 3 Supply Chain';
  prompt: string;
  iconName: string;
}

export const SUGGESTED_PROMPTS: CopilotPromptTemplate[] = [
  {
    id: 'p1',
    category: 'Carbon Insights',
    prompt: 'Why did Scope 2 emissions surge by 14% at the Chakan Chakan facility during afternoon shift?',
    iconName: 'Flame',
  },
  {
    id: 'p2',
    category: 'Energy Optimization',
    prompt: 'Provide an AI load-shifting plan for HVAC chillers to reduce peak electricity tariff costs.',
    iconName: 'Zap',
  },
  {
    id: 'p3',
    category: 'ESG & SEBI BRSR',
    prompt: 'Summarize SEBI BRSR Principle 6 gap analysis for non-financial energy transparency compliance.',
    iconName: 'ShieldCheck',
  },
  {
    id: 'p4',
    category: 'Green Score',
    prompt: 'How can we raise our Enterprise Green Sustainability Score from 84 to 92 before Q3 audit?',
    iconName: 'Sparkles',
  },
  {
    id: 'p5',
    category: 'Scope 3 Supply Chain',
    prompt: 'Which tier-1 suppliers account for the top 80% of Scope 3 upstream logistics emissions?',
    iconName: 'Truck',
  },
];

export const INITIAL_CONVERSATION: CopilotMessage[] = [
  {
    id: 'm1',
    sender: 'assistant',
    timestamp: '10:42 AM',
    text: 'Greetings Priya! I am your GreenPulse AI Sustainability Copilot, continuously connected to your facility SCADA meters, energy contracts, and GHG Protocol accounting logs. How can I assist with your Net-Zero and BRSR targets today?',
  },
];

export const PRESET_KNOWLEDGE_RESPONSES: Record<string, Partial<CopilotMessage>> = {
  surge: {
    text: `Analysis of July 28th SCADA log telemetry reveals that the **14% Scope 2 emission surge** at Chakan Facility was triggered by dual-chiller concurrent staging during peak thermal hours (13:00 - 16:00).\n\n### Key Findings:\n- **Primary Driver:** Chiller Unit #3 operated at 92% load during TOD (Time-of-Day) peak tariff band (₹14.50/kWh).\n- **Grid Emission Factor:** MSEDCL regional grid emissions factor measured 0.82 kg CO₂e/kWh during peak solar drop-off.\n- **Financial Impact:** Generated an avoidable ₹1,18,000 excess power surcharge and 8.4 tCO₂e incremental emissions.`,
    reasoningSteps: [
      'Queried SCADA Sub-metering DB for Chakan Facility (Building B & C)',
      'Cross-referenced MSEDCL Time-of-Day (TOD) Tariff matrix for Maharashtra grid',
      'Calculated hourly carbon intensity using Central Electricity Authority (CEA) baseline grid emission factor v19.0',
    ],
    citations: [
      {
        id: 'c1',
        title: 'MSEDCL TOD Tariff Schedule FY2026',
        source: 'Maharashtra Electricity Regulatory Commission',
        relevance: '98% match',
      },
      {
        id: 'c2',
        title: 'CEA Baseline Carbon Emission Database v19',
        source: 'Central Electricity Authority India',
        relevance: '95% match',
      },
    ],
    recommendationCard: {
      id: 'rec-hvac',
      title: 'Automate Thermal Ice Storage Pre-cooling',
      category: 'Energy Shift',
      estimatedSavings: '₹3,15,000 / month',
      co2Reduction: '24.5 tCO₂e / mo',
      roiMonths: 3.2,
      status: 'Recommended',
      actionLabel: 'Deploy HVAC Automation Rule',
    },
    chart: {
      type: 'area',
      title: 'Hourly Power Demand Curve vs Grid Carbon Intensity',
      dataKey: 'powerMw',
      unit: 'MW',
      data: [
        { name: '08:00', value: 2.1, baseline: 1.8 },
        { name: '10:00', value: 2.8, baseline: 2.0 },
        { name: '12:00', value: 3.4, baseline: 2.2 },
        { name: '14:00', value: 4.8, baseline: 2.4 }, // Surge peak
        { name: '16:00', value: 4.2, baseline: 2.3 },
        { name: '18:00', value: 3.1, baseline: 2.1 },
        { name: '20:00', value: 2.3, baseline: 1.9 },
      ],
    },
    greenScoreImpact: {
      current: 84,
      potential: 88,
      delta: '+4 Points',
    },
  },

  load: {
    text: `I have synthesized an **AI-optimized HVAC load shifting schedule** for your manufacturing facilities.\n\n### Optimization Strategy:\nBy shifting thermal pre-cooling cycles to off-peak hours (02:00 - 06:00 AM) and utilizing thermal energy storage (TES), we flatten afternoon demand spikes without compromising indoor climate controls.`,
    reasoningSteps: [
      'Modeled building thermal inertia over 24-hour ambient humidity curves',
      'Simulated thermal storage discharge rates during peak solar irradiation hours',
      'Verified zero disruption to ISO 14001 manufacturing cleanroom humidity limits',
    ],
    citations: [
      {
        id: 'c3',
        title: 'ASHRAE Standard 90.1 Energy Efficiency',
        source: 'American Society of Heating Engineers',
        relevance: '94% match',
      },
    ],
    recommendationCard: {
      id: 'rec-shift',
      title: 'Execute Off-Peak Pre-Cooling Schedule',
      category: 'Energy Shift',
      estimatedSavings: '₹3,50,000 / month',
      co2Reduction: '31.2 tCO₂e / mo',
      roiMonths: 1.5,
      status: 'Recommended',
      actionLabel: 'Apply Load-Shift Preset',
    },
    chart: {
      type: 'bar',
      title: 'Current vs Optimized Tariff Band Electricity Cost (₹)',
      dataKey: 'value',
      unit: '₹',
      data: [
        { name: 'Off-Peak (Night)', value: 98000, baseline: 65000 },
        { name: 'Normal Band', value: 172000, baseline: 172000 },
        { name: 'Peak TOD Band', value: 115000, baseline: 295000 },
      ],
    },
    greenScoreImpact: {
      current: 84,
      potential: 89,
      delta: '+5 Points',
    },
  },

  brsr: {
    text: `Here is your **SEBI BRSR Principle 6 Compliance Readiness Assessment** for FY2026.\n\n### Compliance Highlights:\n- **Essential Indicators (Mandatory):** 100% compliant across Scope 1 direct emissions and Scope 2 grid electricity.\n- **Leadership Indicators (Voluntary):** 82% ready. Key gap lies in Scope 3 tier-2 transport fuel accounting.\n- **SEBI Audit Readiness:** Standardized BRSR Annexure format is generated and ready for third-party assurance.`,
    reasoningSteps: [
      'Audited direct meter telemetry against SEBI BRSR Principle 6 Essential Indicators 1 to 8',
      'Verified GHG Protocol Scope 3 category 1 (purchased goods) and category 4 (upstream logistics)',
      'Validated water consumption intensity per unit of production output',
    ],
    citations: [
      {
        id: 'c4',
        title: 'SEBI Circular on BRSR Core Framework 2023',
        source: 'Securities and Exchange Board of India',
        relevance: '99% match',
      },
    ],
    recommendationCard: {
      id: 'rec-brsr',
      title: 'Automate Tier-2 Supplier Carbon Intake Portal',
      category: 'BRSR Compliance',
      estimatedSavings: 'Audit Effort -65%',
      co2Reduction: 'Verified Scope 3',
      roiMonths: 2.0,
      status: 'Recommended',
      actionLabel: 'Generate BRSR Report PDF',
    },
    greenScoreImpact: {
      current: 84,
      potential: 91,
      delta: '+7 Points',
    },
  },

  score: {
    text: `To elevate your Enterprise **Green Sustainability Score from 84 to 92**, GreenPulse AI recommends executing three high-impact initiatives prior to the upcoming Q3 assurance audit:\n\n### Recommended Roadmap:\n1. **Renewable Energy PPA:** Expand off-site solar procurement from 42% to 65%.\n2. **HVAC Peak Tariff Shift:** Pre-cool cleanrooms during early morning off-peak window.\n3. **Zero-Waste Diversion:** Increase organic sludge vermicomposting to hit 80% diversion target.`,
    reasoningSteps: [
      'Evaluated 12 sustainability indicators across Energy, Carbon, Waste, and Water',
      'Simulated weighting algorithms aligned with DJSI, MSCI ESG, and BRSR Core',
    ],
    citations: [
      {
        id: 'c5',
        title: 'MSCI ESG Ratings Methodology Guide',
        source: 'MSCI Research 2025',
        relevance: '92% match',
      },
    ],
    recommendationCard: {
      id: 'rec-score',
      title: 'Execute Tri-Pillar Sustainability Roadmap',
      category: 'Carbon Reduction',
      estimatedSavings: '₹10,25,000 / month',
      co2Reduction: '85.0 tCO₂e / mo',
      roiMonths: 4.0,
      status: 'Recommended',
      actionLabel: 'Commit Initiative Roadmap',
    },
    greenScoreImpact: {
      current: 84,
      potential: 92,
      delta: '+8 Points',
    },
  },
};

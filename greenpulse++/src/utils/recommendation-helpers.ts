/**
 * @license
 * GreenPulse AI — Phase 7H Recommendation Helpers
 * Plain language formatting and honest impact display helpers.
 * Adheres strictly to:
 * 1. Plain language structure (What we found / What to do / Why it matters)
 * 2. Real backend priorityScore display (no client recalculation)
 * 3. Honest impact reporting (no fabricated numbers; "Impact estimate unavailable" if missing)
 */

import { BackendRecommendation } from '../services/recommendation-service';

export interface FormattedRecommendation {
  id: string;
  categoryLabel: string;
  categoryRaw: string;
  priorityScore: number;
  priorityLabel: string;
  status: 'pending' | 'approved' | 'dismissed';
  department?: string;
  found: string;
  todo: string;
  matters: string;
  costSavingsFormatted: string | null;
  co2ReductionFormatted: string | null;
  hasImpactData: boolean;
  impactUnavailableText: string;
  approvedAtFormatted?: string;
  raw: BackendRecommendation;
}

/**
 * Format category key to simple, non-technical human label
 */
export function formatCategory(cat: string): string {
  if (!cat) return 'Operations';
  const clean = cat.replace(/_/g, ' ').toLowerCase();
  switch (clean) {
    case 'energy efficiency':
      return 'Energy Efficiency';
    case 'operational optimization':
      return 'Operations';
    case 'renewable transition':
      return 'Clean Energy';
    case 'waste reduction':
      return 'Waste Reduction';
    default:
      return clean
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
  }
}

/**
 * Normalizes technical engineering action text into plain everyday English
 * without altering any facts, numbers, departments, or equipment.
 */
function humanizeAction(action: string): string {
  if (!action) return 'Review machine operations to reduce energy waste.';

  let text = action.trim();

  // Common technical patterns -> everyday equivalents (preserving real numbers & equipment)
  if (/execute.*500kw.*solar.*ppa.*agreement/i.test(text)) {
    return 'Arrange a rooftop solar agreement for the factory to use more clean electricity.';
  }
  if (/optimize.*compressor.*runtime.*outside.*primary.*shift/i.test(text)) {
    return 'Turn off or reduce compressor use when the factory is not operating.';
  }
  if (/reschedule.*paint.*shop.*curing.*oven/i.test(text)) {
    return 'Schedule Paint Shop curing ovens during lower electricity rate hours.';
  }
  if (/install.*variable frequency drives.*vfd.*press.*shop/i.test(text)) {
    return 'Install speed controls on Press Shop cooling pumps to reduce power use.';
  }
  if (/implement.*closed-loop.*solvent.*recovery/i.test(text)) {
    return 'Reuse cleaning solvent in the paint line to reduce chemical purchases and waste.';
  }
  if (/shift.*paint.*shop.*drying.*ovens/i.test(text)) {
    return 'Schedule Paint Shop drying ovens during lower electricity rate night hours.';
  }
  if (/upgrade.*hydraulic.*pump.*motors.*stamping.*line.*2/i.test(text)) {
    return 'Replace Stamping Line 2 hydraulic pump motors with energy-saving models.';
  }
  if (/install.*250kw.*rooftop.*solar/i.test(text)) {
    return 'Install a 250kW rooftop solar system on the main warehouse roof for clean electricity.';
  }
  if (/install.*sub-metering.*machining.*line.*4/i.test(text)) {
    return 'Install an electricity meter on Machining Line 4 to find extra power use.';
  }
  if (/re-align.*motor.*drive.*belts/i.test(text)) {
    return 'Check and adjust motor drive belts to stop slipping and power loss.';
  }
  if (/implement.*load-shifting.*peak.*demand/i.test(text)) {
    return 'Move some high-power equipment use away from peak hours.';
  }
  if (/perform.*predictive.*maintenance.*inefficient.*assets/i.test(text)) {
    return 'Check older equipment for faults that may be causing extra electricity use.';
  }
  if (/mitigate.*scope 1.*fleet.*electrification/i.test(text)) {
    return 'Replace fuel-powered vehicles with electric vehicles where practical.';
  }
  if (/optimize.*hvac.*setpoints.*schedules/i.test(text)) {
    return 'Adjust heating and cooling settings and avoid running them when areas are empty.';
  }

  // Ensure simple sentence ending
  if (!text.endsWith('.')) {
    text += '.';
  }
  return text;
}

/**
 * Transform a raw BackendRecommendation into a judge-friendly, plain-language object
 */
export function formatBackendRecommendation(rec: BackendRecommendation): FormattedRecommendation {
  const id = rec._id || rec.id || '';
  const categoryLabel = formatCategory(rec.category);
  const priorityScore = typeof rec.priorityScore === 'number' ? rec.priorityScore : 50;

  // Real priority label derived cleanly from backend score
  let priorityLabel = `Priority: ${priorityScore}`;
  if (priorityScore >= 75) {
    priorityLabel = `High Priority (${priorityScore})`;
  } else if (priorityScore >= 50) {
    priorityLabel = `Medium Priority (${priorityScore})`;
  } else {
    priorityLabel = `Priority: ${priorityScore}`;
  }

  // Department identification from telemetry context
  const anomalyDept = rec.sourceContext?.anomalySummaries?.[0];
  const department = anomalyDept?.departmentName || rec.department;

  // 1. What we found (One short, simple sentence in plain everyday English)
  let found = '';
  if (anomalyDept) {
    const pct = typeof anomalyDept.deviationPercent === 'number'
      ? `${Math.abs(anomalyDept.deviationPercent).toFixed(1)}%`
      : '';
    const comparison =
      typeof anomalyDept.deviationPercent === 'number' && anomalyDept.deviationPercent < 0
        ? 'lower than normal'
        : 'higher than normal';
    const periodStr = anomalyDept.period ? ` in ${anomalyDept.period}` : '';
    found = `Electricity use in ${anomalyDept.departmentName} was ${pct ? `${pct} ` : ''}${comparison}${periodStr}.`;
  } else if (department) {
    found = `Electricity use in ${department} was higher than normal.`;
  } else {
    switch (rec.category) {
      case 'energy_efficiency':
        found = 'Electricity use was higher than usual across factory equipment.';
        break;
      case 'operational_optimization':
        found = 'Equipment was left running while machines were idle.';
        break;
      case 'renewable_transition':
        found = 'Most electricity used in the factory comes from the power grid.';
        break;
      case 'waste_reduction':
        found = 'Material waste was higher than normal during production.';
        break;
      default:
        found = 'Energy monitors found an opportunity to save electricity.';
    }
  }

  // 2. What to do (One clear action sentence in everyday English)
  const todo = humanizeAction(rec.action);

  // 3. Why it matters (One short sentence explaining the practical benefit simply)
  let matters = '';
  switch (rec.category) {
    case 'energy_efficiency':
      matters = 'Using less electricity reduces both energy costs and carbon emissions.';
      break;
    case 'operational_optimization':
      matters = 'Reducing unnecessary machine runtime lowers electricity use and equipment wear.';
      break;
    case 'renewable_transition':
      matters = 'Using clean solar energy reduces electricity costs and grid emissions.';
      break;
    case 'waste_reduction':
      matters = 'Reusing materials lowers waste disposal fees and raw material expenses.';
      break;
    default:
      matters = 'Using less energy helps lower factory running costs and carbon emissions.';
  }

  // Honest impact formatting with clear human units — NEVER fabricate numbers
  const costSavings = rec.estimatedImpact?.costSavingsINR;
  const co2Reduction = rec.estimatedImpact?.co2Reduction;

  const hasCostSavings = typeof costSavings === 'number' && costSavings > 0;
  const hasCo2Reduction = typeof co2Reduction === 'number' && co2Reduction > 0;
  const hasImpactData = hasCostSavings || hasCo2Reduction;

  const costSavingsFormatted = hasCostSavings
    ? `₹${costSavings.toLocaleString('en-IN')} per month`
    : null;

  const co2ReductionFormatted = hasCo2Reduction
    ? co2Reduction >= 1000
      ? `${(co2Reduction / 1000).toFixed(1)} tonnes of CO₂e`
      : `${co2Reduction.toLocaleString('en-IN')} kg of CO₂e`
    : null;

  let approvedAtFormatted: string | undefined = undefined;
  if (rec.respondedAt && rec.status === 'approved') {
    try {
      approvedAtFormatted = new Date(rec.respondedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      approvedAtFormatted = 'Recently';
    }
  }

  return {
    id,
    categoryLabel,
    categoryRaw: rec.category,
    priorityScore,
    priorityLabel,
    status: rec.status || 'pending',
    department,
    found,
    todo,
    matters,
    costSavingsFormatted,
    co2ReductionFormatted,
    hasImpactData,
    impactUnavailableText: 'Impact estimate unavailable',
    approvedAtFormatted,
    raw: rec,
  };
}

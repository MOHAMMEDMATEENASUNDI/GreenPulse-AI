/**
 * GreenPulse AI - Green Score Engine Service
 * Formula: GreenScore = 0.35*CarbonPerformance + 0.25*EnergyEfficiency + 0.20*WasteManagement + 0.20*ComplianceCompleteness
 * Direction-aware baseline fallback logic with independent metric timelines.
 * Strictly separates No-Data (fallback 50) from valid Zero-Data (0 or 100 deterministic rules).
 */

const mongoose = require('mongoose');
const GreenScore = require('./greenscore.model');
const Emission = require('../carbon/emission.model');
const EnergyRecord = require('../upload/energy-record.model');
const WasteRecord = require('../upload/waste-record.model');
const esgService = require('../esg/esg.service');
const logger = require('../../lib/logger');

/**
 * Direction-aware normalization with deterministic zero-division handling for lower-is-better metrics.
 * @param {number} baseline
 * @param {number} current
 */
const calculateDirectionAwareScore = (baseline, current) => {
  const b = Number(baseline);
  const c = Number(current);

  // 1. Baseline > 0 and Current = 0 -> Maximum possible improvement
  if (b > 0 && c === 0) {
    return 100;
  }

  // 2. Baseline = 0 and Current = 0 -> Clean performance maintained
  if (b === 0 && c === 0) {
    return 100;
  }

  // 3. Baseline = 0 and Current > 0 -> Regressed from zero baseline
  if (b === 0 && c > 0) {
    return 0;
  }

  // 4. Baseline > 0 and Current > 0 -> Standard lower-is-better ratio
  const rawScore = (b / c) * 100;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
};

/**
 * Extract chronological periods for a company from an aggregation pipeline
 * @param {mongoose.Model} model
 * @param {mongoose.Types.ObjectId} companyId
 * @param {string} valueField
 */
const getMetricChronologicalPeriods = async (model, companyId, valueField) => {
  const records = await model.aggregate([
    {
      $match: {
        companyId,
        [valueField]: { $gte: 0, $type: 'number' },
      },
    },
    {
      $group: {
        _id: '$period',
        totalValue: { $sum: `$${valueField}` },
      },
    },
    { $sort: { _id: 1 } }, // Chronologically earliest first
  ]);

  return records.filter((r) => r._id && typeof r._id === 'string' && Number.isFinite(r.totalValue));
};

/**
 * Calculate GreenScore and breakdown for a company and persist the result
 * @param {string|mongoose.Types.ObjectId} companyId
 * @param {object} [options]
 * @param {string|mongoose.Types.ObjectId} [options.jobId]
 */
const recalculateGreenScore = async (companyId, options = {}) => {
  const companyObjId = new mongoose.Types.ObjectId(companyId.toString());

  // 1. Carbon Performance Metric (independent baseline and current)
  const carbonPeriods = await getMetricChronologicalPeriods(Emission, companyObjId, 'totalCo2e');
  let carbonScore = 50; // Neutral fallback for no usable data
  let carbonMeta = { baselinePeriod: null, currentPeriod: null, baselineValue: null, currentValue: null };

  if (carbonPeriods.length > 0) {
    const earliest = carbonPeriods[0];
    const latest = carbonPeriods[carbonPeriods.length - 1];
    carbonScore = calculateDirectionAwareScore(earliest.totalValue, latest.totalValue);
    carbonMeta = {
      baselinePeriod: earliest._id,
      currentPeriod: latest._id,
      baselineValue: Number(earliest.totalValue.toFixed(2)),
      currentValue: Number(latest.totalValue.toFixed(2)),
    };
  }

  // 2. Energy Efficiency Metric (independent baseline and current)
  const energyPeriods = await getMetricChronologicalPeriods(EnergyRecord, companyObjId, 'kwhUsed');
  let energyScore = 50; // Neutral fallback for no usable data
  let energyMeta = { baselinePeriod: null, currentPeriod: null, baselineValue: null, currentValue: null };

  if (energyPeriods.length > 0) {
    const earliest = energyPeriods[0];
    const latest = energyPeriods[energyPeriods.length - 1];
    energyScore = calculateDirectionAwareScore(earliest.totalValue, latest.totalValue);
    energyMeta = {
      baselinePeriod: earliest._id,
      currentPeriod: latest._id,
      baselineValue: Number(earliest.totalValue.toFixed(2)),
      currentValue: Number(latest.totalValue.toFixed(2)),
    };
  }

  // 3. Waste Management Metric (independent baseline and current)
  const wastePeriods = await getMetricChronologicalPeriods(WasteRecord, companyObjId, 'quantityKg');
  let wasteScore = 50; // Neutral fallback for no usable data
  let wasteMeta = { baselinePeriod: null, currentPeriod: null, baselineValue: null, currentValue: null };

  if (wastePeriods.length > 0) {
    const earliest = wastePeriods[0];
    const latest = wastePeriods[wastePeriods.length - 1];
    wasteScore = calculateDirectionAwareScore(earliest.totalValue, latest.totalValue);
    wasteMeta = {
      baselinePeriod: earliest._id,
      currentPeriod: latest._id,
      baselineValue: Number(earliest.totalValue.toFixed(2)),
      currentValue: Number(latest.totalValue.toFixed(2)),
    };
  }

  // 4. Compliance Completeness Metric (average coverage across all 9 principles)
  const esgData = await esgService.getEsgScore(companyObjId);
  const totalCoverage = esgData.principles.reduce((acc, p) => acc + (p.coveragePercent || 0), 0);
  const complianceScore = Math.max(0, Math.min(100, Math.round(totalCoverage / 9)));

  // 5. Final Weighted Green Score
  // Weights: 0.35 CP, 0.25 EE, 0.20 WM, 0.20 CC
  const rawWeighted =
    0.35 * carbonScore +
    0.25 * energyScore +
    0.20 * wasteScore +
    0.20 * complianceScore;

  const finalScore = Math.max(0, Math.min(100, Math.round(rawWeighted)));

  // 6. Overall latest usable period across participating operational metrics
  const participatingPeriods = [
    carbonMeta.currentPeriod,
    energyMeta.currentPeriod,
    wasteMeta.currentPeriod,
  ].filter(Boolean);

  participatingPeriods.sort();
  const overallLatestPeriod = participatingPeriods.length > 0
    ? participatingPeriods[participatingPeriods.length - 1]
    : new Date().toISOString().substring(0, 7);

  // 7. Persist GreenScore document
  const greenScoreDoc = await GreenScore.create({
    companyId: companyObjId,
    period: overallLatestPeriod,
    score: finalScore,
    breakdown: {
      carbonPerformance: {
        score: carbonScore,
        source: 'baseline_fallback',
        ...carbonMeta,
      },
      energyEfficiency: {
        score: energyScore,
        source: 'baseline_fallback',
        ...energyMeta,
      },
      wasteManagement: {
        score: wasteScore,
        source: 'baseline_fallback',
        ...wasteMeta,
      },
      complianceCompleteness: {
        score: complianceScore,
        source: 'baseline_fallback',
      },
    },
    uploadJobId: options.jobId ? new mongoose.Types.ObjectId(options.jobId.toString()) : undefined,
    calculatedAt: new Date(),
  });

  logger.info(
    {
      companyId: companyId.toString(),
      score: finalScore,
      period: overallLatestPeriod,
      jobId: options.jobId,
    },
    'Green Score recalculated and persisted successfully'
  );

  return greenScoreDoc;
};

/**
 * Fetch latest GreenScore and historical trend for a company
 * @param {string|mongoose.Types.ObjectId} companyId
 */
const getLatestGreenScore = async (companyId) => {
  const companyObjId = new mongoose.Types.ObjectId(companyId.toString());

  // Fetch latest score
  let latest = await GreenScore.findOne({ companyId: companyObjId })
    .sort({ calculatedAt: -1 })
    .lean();

  // If no score exists yet, trigger an initial calculation
  if (!latest) {
    latest = await recalculateGreenScore(companyObjId);
  }

  // Fetch recent historical trend (up to 6 recent periods)
  const history = await GreenScore.find({ companyId: companyObjId })
    .sort({ calculatedAt: -1 })
    .limit(6)
    .lean();

  // Calculate month-over-month delta
  let deltaMonth = 0;
  if (history.length > 1) {
    deltaMonth = history[0].score - history[1].score;
  }

  return {
    score: latest.score,
    period: latest.period,
    deltaMonth,
    lastUpdated: latest.calculatedAt ? latest.calculatedAt.toISOString() : new Date().toISOString(),
    breakdown: {
      carbonPerformance: {
        score: latest.breakdown.carbonPerformance.score,
        source: latest.breakdown.carbonPerformance.source,
      },
      energyEfficiency: {
        score: latest.breakdown.energyEfficiency.score,
        source: latest.breakdown.energyEfficiency.source,
      },
      wasteManagement: {
        score: latest.breakdown.wasteManagement.score,
        source: latest.breakdown.wasteManagement.source,
      },
      complianceCompleteness: {
        score: latest.breakdown.complianceCompleteness.score,
        source: latest.breakdown.complianceCompleteness.source,
      },
    },
    trend: history.map((h) => ({
      period: h.period,
      score: h.score,
      calculatedAt: h.calculatedAt,
    })),
  };
};

module.exports = {
  calculateDirectionAwareScore,
  recalculateGreenScore,
  getLatestGreenScore,
};

const Recommendation = require('./recommendation.model');
const logger = require('../../lib/logger');
const AppError = require('../../utils/AppError');

// 30-minute in-memory company cooldown map
// Key: companyId string -> Value: timestamp ms
const companyRecommendationCooldowns = new Map();
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Check if recommendation generation is within the 30-minute cooldown
 * @param {string|import('mongoose').Types.ObjectId} companyId
 */
const checkCooldown = (companyId) => {
  const companyIdStr = companyId.toString();
  const lastRun = companyRecommendationCooldowns.get(companyIdStr);
  if (!lastRun) {
    return { allowed: true, remainingMs: 0 };
  }

  const elapsed = Date.now() - lastRun;
  if (elapsed < COOLDOWN_MS) {
    return {
      allowed: false,
      remainingMs: COOLDOWN_MS - elapsed,
    };
  }

  return { allowed: true, remainingMs: 0 };
};

/**
 * Record successful recommendation generation timestamp
 * @param {string|import('mongoose').Types.ObjectId} companyId
 */
const recordCooldown = (companyId) => {
  companyRecommendationCooldowns.set(companyId.toString(), Date.now());
};

/**
 * Deterministic Priority Score calculation for a batch of raw recommendations
 * Majority weight (60%) deterministic backend calculation + 40% Gemini impact score
 * @param {Array} rawItems
 */
const calculateBatchPriorityScores = (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  // Find max values in current generation cycle
  const maxCostSavings = Math.max(...rawItems.map((item) => item.estimatedCostSavingsINR || 0), 0);
  const maxCO2Reduction = Math.max(...rawItems.map((item) => item.estimatedCO2ReductionKg || 0), 0);

  return rawItems.map((item) => {
    // 1. Normalized Cost Score (0 - 100)
    let costScore = 0;
    if (maxCostSavings > 0) {
      costScore = Math.min(100, (item.estimatedCostSavingsINR / maxCostSavings) * 100);
    }

    // 2. Normalized CO2 Score (0 - 100)
    let co2Score = 0;
    if (maxCO2Reduction > 0) {
      co2Score = Math.min(100, (item.estimatedCO2ReductionKg / maxCO2Reduction) * 100);
    }

    // 3. Implementation Effort Score
    let effortScore = 60;
    if (item.implementationEffort === 'low') {
      effortScore = 100;
    } else if (item.implementationEffort === 'medium') {
      effortScore = 60;
    } else if (item.implementationEffort === 'high') {
      effortScore = 30;
    }

    // 4. Deterministic Impact Score
    const deterministicImpactScore =
      0.4 * costScore + 0.4 * co2Score + 0.2 * effortScore;

    // 5. Final Priority Score
    const geminiScore = Math.max(0, Math.min(100, item.geminiImpactScore || 0));
    const finalScoreRaw = 0.6 * deterministicImpactScore + 0.4 * geminiScore;
    const priorityScore = Math.max(0, Math.min(100, Math.round(finalScoreRaw)));

    return {
      action: item.action,
      category: item.category,
      estimatedImpact: {
        costSavingsINR: item.estimatedCostSavingsINR,
        co2Reduction: item.estimatedCO2ReductionKg,
      },
      priorityScore,
      deterministicMetrics: {
        costScore,
        co2Score,
        effortScore,
        deterministicImpactScore,
        geminiScore,
      },
    };
  });
};

/**
 * Idempotently persist scored recommendations
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.companyId
 * @param {string|import('mongoose').Types.ObjectId} params.jobId
 * @param {Array} params.scoredItems
 * @param {object} params.sourceContext
 */
const persistScoredRecommendations = async ({ companyId, jobId, scoredItems, sourceContext }) => {
  const companyIdStr = companyId.toString();
  const jobIdStr = jobId.toString();
  const persistedDocs = [];

  for (const item of scoredItems) {
    try {
      // Check existing for deduplication
      const existing = await Recommendation.findOne({
        companyId,
        'sourceContext.triggeringJobId': jobId,
        action: item.action,
      });

      if (existing) {
        logger.info(
          { companyId: companyIdStr, jobId: jobIdStr, action: item.action },
          'Duplicate recommendation detected for this job cycle; skipping'
        );
        persistedDocs.push(existing);
        continue;
      }

      const doc = new Recommendation({
        companyId,
        action: item.action,
        category: item.category,
        estimatedImpact: item.estimatedImpact,
        priorityScore: item.priorityScore,
        status: 'pending',
        sourceContext: {
          ...sourceContext,
          triggeringJobId: jobId,
        },
        createdAt: new Date(),
        respondedAt: null,
      });

      await doc.save();
      persistedDocs.push(doc);

      logger.info(
        { companyId: companyIdStr, jobId: jobIdStr, action: item.action, priorityScore: item.priorityScore },
        'Recommendation persisted'
      );
    } catch (err) {
      if (err.code === 11000) {
        // Compound unique constraint caught duplicate write cleanly
        logger.info(
          { companyId: companyIdStr, jobId: jobIdStr, action: item.action },
          'Compound unique index caught duplicate recommendation write; skipped cleanly'
        );
      } else {
        logger.error(
          { companyId: companyIdStr, jobId: jobIdStr, err: err.message },
          'Error persisting individual recommendation'
        );
      }
    }
  }

  return persistedDocs;
};

/**
 * Get recommendations scoped to company
 * @param {string|import('mongoose').Types.ObjectId} companyId
 * @param {object} [filters={}]
 */
const getRecommendations = async (companyId, filters = {}) => {
  const query = { companyId };
  if (filters.status) {
    query.status = filters.status;
  }

  return Recommendation.find(query)
    .sort({ priorityScore: -1, createdAt: -1 })
    .lean();
};

/**
 * Update recommendation status (approve or dismiss)
 * @param {string|import('mongoose').Types.ObjectId} companyId
 * @param {string} id
 * @param {'approved'|'dismissed'} status
 */
const updateRecommendationStatus = async (companyId, id, status) => {
  const recommendation = await Recommendation.findOne({ _id: id, companyId });
  if (!recommendation) {
    throw new AppError('Recommendation not found for this company', 404, 'NOT_FOUND');
  }

  recommendation.status = status;
  recommendation.respondedAt = new Date();
  await recommendation.save();

  return recommendation;
};

module.exports = {
  checkCooldown,
  recordCooldown,
  calculateBatchPriorityScores,
  persistScoredRecommendations,
  getRecommendations,
  updateRecommendationStatus,
};

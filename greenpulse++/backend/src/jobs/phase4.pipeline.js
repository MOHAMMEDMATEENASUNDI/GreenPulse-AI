/**
 * GreenPulse AI - Phase 4 Pipeline
 * Orchestrates Energy Anomaly Detection -> 30-Min Cooldown Check -> Gemini Recommendations -> Priority Scoring
 * Features strict failure isolation and single-process in-memory deduplication.
 */

const energyService = require('../modules/energy/energy.service');
const carbonService = require('../modules/carbon/carbon.service');
const GreenScore = require('../modules/greenscore/greenscore.model');
const recommendationService = require('../modules/recommendations/recommendation.service');
const { generateRecommendationsWithRetry } = require('../lib/geminiClient');
const logger = require('../lib/logger');

// Single-process in-memory deduplication lock
const activePhase4JobLocks = new Set();

/**
 * Run Phase 4 Pipeline for a company and upload job
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.companyId
 * @param {string|import('mongoose').Types.ObjectId} params.jobId
 */
const runPhase4Pipeline = async ({ companyId, jobId }) => {
  const companyIdStr = companyId.toString();
  const jobIdStr = jobId.toString();

  // Deduplication guard
  if (activePhase4JobLocks.has(jobIdStr)) {
    logger.info(
      { jobId: jobIdStr, companyId: companyIdStr },
      'Phase 4 pipeline already running or completed for this jobId; ignoring duplicate invocation'
    );
    return { skipped: true, reason: 'duplicate_job' };
  }

  activePhase4JobLocks.add(jobIdStr);

  logger.info(
    { jobId: jobIdStr, companyId: companyIdStr },
    'Starting Phase 4 pipeline'
  );

  let anomalies = [];

  try {
    // -------------------------------------------------------------
    // Step 1: Energy Anomaly Detection ALWAYS runs
    // -------------------------------------------------------------
    try {
      anomalies = await energyService.detectAndPersistAnomaliesForCompany({ companyId, jobId });
    } catch (anomalyErr) {
      logger.error(
        { jobId: jobIdStr, companyId: companyIdStr, err: anomalyErr.message },
        'Phase 4 Step 1 [Energy Anomaly Detection] failed; skipping recommendations'
      );
      // Strict failure isolation: Green Score is NOT marked stale or invalidated
      return { success: false, failedStep: 'anomaly_detection', err: anomalyErr.message };
    }

    // -------------------------------------------------------------
    // Step 2: 30-Minute Cooldown Evaluated strictly before Gemini
    // -------------------------------------------------------------
    const cooldownStatus = recommendationService.checkCooldown(companyId);
    if (!cooldownStatus.allowed) {
      logger.info(
        { jobId: jobIdStr, companyId: companyIdStr, cooldownRemainingMs: cooldownStatus.remainingMs },
        'Recommendation generation skipped due to 30-minute cooldown'
      );
      return {
        success: true,
        anomalies,
        recommendationsSkipped: true,
        reason: 'cooldown_active',
        cooldownRemainingMs: cooldownStatus.remainingMs,
      };
    }

    // -------------------------------------------------------------
    // Step 3: Grounded Context Assembly (No raw CSV or user text)
    // -------------------------------------------------------------
    let carbonSummary = { totalKgCO2e: 0, scope2KgCO2e: 0 };
    try {
      const cRes = await carbonService.getCarbonSummary(companyId);
      carbonSummary = {
        totalKgCO2e: cRes?.totalKgCO2e || 0,
        scope2KgCO2e: cRes?.scopes?.scope2?.value || 0,
      };
    } catch (cErr) {
      logger.warn({ jobId: jobIdStr, companyId: companyIdStr, err: cErr.message }, 'Failed to fetch carbon summary for grounding');
    }

    let greenScoreBreakdown = { overallScore: 50, energyEfficiencyScore: 50, complianceScore: 50 };
    try {
      const gsDoc = await GreenScore.findOne({ companyId }).sort({ calculatedAt: -1 }).lean();
      if (gsDoc) {
        greenScoreBreakdown = {
          overallScore: gsDoc.score || 50,
          energyEfficiencyScore: gsDoc.breakdown?.energyEfficiency?.score || 50,
          complianceScore: gsDoc.breakdown?.complianceCompleteness?.score || 50,
        };
      }
    } catch (gsErr) {
      logger.warn({ jobId: jobIdStr, companyId: companyIdStr, err: gsErr.message }, 'Failed to fetch GreenScore for grounding');
    }

    const sourceContext = {
      triggeringJobId: jobId,
      carbonSummary,
      anomalySummaries: anomalies.map((a) => ({
        departmentName: a.departmentName || 'Unknown',
        period: a.period,
        deviationPercent: a.deviationPercent,
        severity: a.severity,
      })),
      greenScoreBreakdown,
    };

    // -------------------------------------------------------------
    // Step 4: Gemini Call with 10s timeout & exactly one automatic retry
    // -------------------------------------------------------------
    const geminiResult = await generateRecommendationsWithRetry({
      sourceContext,
      companyId,
      jobId,
    });

    if (!geminiResult.success) {
      logger.warn(
        { jobId: jobIdStr, companyId: companyIdStr, reason: geminiResult.reason },
        'Recommendation generation unavailable this cycle'
      );
      // Strict failure isolation: Green Score is NOT invalidated
      return {
        success: true,
        anomalies,
        recommendationsAvailable: false,
        reason: geminiResult.reason,
      };
    }

    // -------------------------------------------------------------
    // Step 5: Deterministic Priority Scoring (60% deterministic + 40% Gemini)
    // -------------------------------------------------------------
    const scoredItems = recommendationService.calculateBatchPriorityScores(geminiResult.recommendations);

    // -------------------------------------------------------------
    // Step 6: Idempotent Persistence & Cooldown Record
    // -------------------------------------------------------------
    const persistedRecommendations = await recommendationService.persistScoredRecommendations({
      companyId,
      jobId,
      scoredItems,
      sourceContext,
    });

    // Record cooldown timestamp only after successful generation
    recommendationService.recordCooldown(companyId);

    logger.info(
      { jobId: jobIdStr, companyId: companyIdStr, count: persistedRecommendations.length },
      'Phase 4 pipeline completed successfully'
    );

    return {
      success: true,
      anomalies,
      recommendations: persistedRecommendations,
    };
  } finally {
    setTimeout(() => {
      activePhase4JobLocks.delete(jobIdStr);
    }, 30000).unref();
  }
};

module.exports = {
  runPhase4Pipeline,
  isJobLocked: (jobId) => activePhase4JobLocks.has(jobId.toString()),
};

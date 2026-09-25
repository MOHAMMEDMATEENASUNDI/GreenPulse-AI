/**
 * GreenPulse AI - Recomputation Pipeline
 * Linear execution chain: Carbon -> ESG -> Green Score -> Firestore liveMetrics
 * Features single-process in-memory deduplication and strict cascading failure handling.
 */

const carbonService = require('../modules/carbon/carbon.service');
const esgService = require('../modules/esg/esg.service');
const greenScoreService = require('../modules/greenscore/greenscore.service');
const { db: firestoreDb } = require('../config/firebase');
const logger = require('../lib/logger');

// Single-process in-memory deduplication lock
// Prevents duplicate pipeline execution for the same jobId within the currently running Node process.
// Tailored for hackathon single-process architecture without external infrastructure (Redis/BullMQ).
const activeJobLocks = new Set();

/**
 * Mirror metric status to Firestore liveMetrics collection safely
 * @param {string} companyId
 * @param {object} payload
 */
const updateLiveMetrics = async (companyId, payload) => {
  if (!firestoreDb) return;
  try {
    const docRef = firestoreDb.collection('liveMetrics').doc(companyId.toString());
    await docRef.set(
      {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    logger.warn(
      { companyId: companyId.toString(), err: err.message },
      'Failed to sync liveMetrics to Firestore'
    );
  }
};

/**
 * Execute linear recomputation pipeline for a company upload
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.companyId
 * @param {string|import('mongoose').Types.ObjectId} params.jobId
 */
const runRecomputationPipeline = async ({ companyId, jobId }) => {
  const companyIdStr = companyId.toString();
  const jobIdStr = jobId.toString();

  // Deduplication guard
  if (activeJobLocks.has(jobIdStr)) {
    logger.info(
      { jobId: jobIdStr, companyId: companyIdStr },
      'Pipeline already running or completed for this jobId; ignoring duplicate invocation'
    );
    return { skipped: true, reason: 'duplicate_job' };
  }

  activeJobLocks.add(jobIdStr);

  logger.info(
    { jobId: jobIdStr, companyId: companyIdStr },
    'Starting linear recomputation pipeline'
  );

  let carbonResult = null;
  let esgResult = null;
  let greenScoreResult = null;

  try {
    // -------------------------------------------------------------
    // Step 1: Carbon Intelligence Engine
    // -------------------------------------------------------------
    try {
      await carbonService.recalculateEmissionsForCompany(companyId, { jobId: jobIdStr });
      carbonResult = await carbonService.getCarbonSummary(companyId);
      logger.info(
        { jobId: jobIdStr, companyId: companyIdStr, totalKgCO2e: carbonResult.totalKgCO2e },
        'Pipeline Step 1 [Carbon] succeeded'
      );
    } catch (carbonErr) {
      logger.error(
        { jobId: jobIdStr, companyId: companyIdStr, err: carbonErr.message, step: 'carbon' },
        'Pipeline Step 1 [Carbon] failed - cascading halt'
      );

      await updateLiveMetrics(companyIdStr, {
        companyId: companyIdStr,
        status: 'failed',
        errorStep: 'carbon',
        errorMessage: carbonErr.message,
        lastJobId: jobIdStr,
      });

      return { success: false, failedStep: 'carbon' };
    }

    // -------------------------------------------------------------
    // Step 2: ESG Engine
    // -------------------------------------------------------------
    try {
      esgResult = await esgService.recalculateEsgForCompany(companyId, { jobId: jobIdStr });
      logger.info(
        { jobId: jobIdStr, companyId: companyIdStr, esgSummary: esgResult.summary },
        'Pipeline Step 2 [ESG] succeeded'
      );
    } catch (esgErr) {
      logger.error(
        { jobId: jobIdStr, companyId: companyIdStr, err: esgErr.message, step: 'esg' },
        'Pipeline Step 2 [ESG] failed - cascading halt'
      );

      await updateLiveMetrics(companyIdStr, {
        companyId: companyIdStr,
        status: 'failed',
        errorStep: 'esg',
        errorMessage: esgErr.message,
        lastJobId: jobIdStr,
      });

      return { success: false, failedStep: 'esg' };
    }

    // -------------------------------------------------------------
    // Step 3: Green Score Engine
    // -------------------------------------------------------------
    try {
      greenScoreResult = await greenScoreService.recalculateGreenScore(companyId, { jobId: jobIdStr });
      logger.info(
        { jobId: jobIdStr, companyId: companyIdStr, greenScore: greenScoreResult.score },
        'Pipeline Step 3 [Green Score] succeeded'
      );
    } catch (gsErr) {
      logger.error(
        { jobId: jobIdStr, companyId: companyIdStr, err: gsErr.message, step: 'greenscore' },
        'Pipeline Step 3 [Green Score] failed - liveMetrics NOT marked current'
      );

      await updateLiveMetrics(companyIdStr, {
        companyId: companyIdStr,
        status: 'stale_partial',
        errorStep: 'greenscore',
        errorMessage: gsErr.message,
        lastJobId: jobIdStr,
      });

      return { success: false, failedStep: 'greenscore' };
    }

    // -------------------------------------------------------------
    // Step 4: All steps succeeded -> Publish current liveMetrics
    // -------------------------------------------------------------
    await updateLiveMetrics(companyIdStr, {
      companyId: companyIdStr,
      greenScore: greenScoreResult.score,
      carbonTotalKgCO2e: carbonResult.totalKgCO2e,
      esgCompleteness: esgResult.summary,
      status: 'current',
      lastJobId: jobIdStr,
    });

    logger.info(
      { jobId: jobIdStr, companyId: companyIdStr },
      'Pipeline completed successfully; liveMetrics updated to current'
    );

    return {
      success: true,
      carbon: carbonResult,
      esg: esgResult,
      greenScore: greenScoreResult,
    };
  } finally {
    // Keep lock active for memory-safe period or leave in Set
    // Clean up after 30 seconds to prevent unbounded memory growth
    setTimeout(() => {
      activeJobLocks.delete(jobIdStr);
    }, 30000).unref();
  }
};

module.exports = {
  runRecomputationPipeline,
  isJobLocked: (jobId) => activeJobLocks.has(jobId.toString()),
};

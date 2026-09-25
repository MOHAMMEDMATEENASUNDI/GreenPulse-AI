/**
 * GreenPulse AI - Runtime In-Memory Reference Cache
 * Reads emissionFactors and complianceRubric into memory once via safe lazy async memoization.
 * Prevents per-calculation database lookups.
 * Safe for single-process Node.js runtime with zero heavy infrastructure.
 */

const EmissionFactor = require('../modules/carbon/emission-factor.model');
const ComplianceRubric = require('../modules/esg/compliance-rubric.model');
const logger = require('../lib/logger');

// In-memory cache structures
let emissionFactorsMap = new Map(); // key: `${region}:${type}:${version}` -> factor doc
let defaultFactor = { region: 'India', type: 'grid_electricity', factorKgCO2ePerKwh: 0.82, version: 'CEA-2025.1' };
let complianceRubricsList = []; // sorted array of 9 principles
let isInitialized = false;
let initPromise = null;

/**
 * Perform one-time async load of reference collections from MongoDB
 */
const loadReferenceData = async () => {
  try {
    // 1. Load Emission Factors
    const factors = await EmissionFactor.find({}).lean();
    emissionFactorsMap.clear();
    factors.forEach((f) => {
      const key = `${f.region}:${f.type}`;
      emissionFactorsMap.set(key, f);
      // Also store with version
      emissionFactorsMap.set(`${key}:${f.version}`, f);
    });

    const indiaGrid = emissionFactorsMap.get('India:grid_electricity');
    if (indiaGrid) {
      defaultFactor = indiaGrid;
    }

    // 2. Load Compliance Rubrics
    const rubrics = await ComplianceRubric.find({}).sort({ principleNumber: 1 }).lean();
    if (rubrics && rubrics.length > 0) {
      complianceRubricsList = rubrics;
    }

    isInitialized = true;
    logger.info(
      {
        factorsCount: factors.length,
        rubricsCount: complianceRubricsList.length,
      },
      'Reference data cache loaded into memory successfully'
    );
  } catch (error) {
    logger.warn(
      { err: error.message },
      'Failed to load reference data into cache from MongoDB; using statutory defaults'
    );
    // Keep statutory defaults active so calculations are uninterrupted
    isInitialized = true;
  }
};

/**
 * Ensure reference data is loaded, sharing a single memoized promise
 */
const ensureCacheLoaded = async () => {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = loadReferenceData().finally(() => {
      initPromise = null;
    });
  }
  await initPromise;
};

/**
 * Get emission factor synchronously from memory
 * @param {string} region
 * @param {string} type
 * @param {string} [version]
 */
const getEmissionFactor = (region = 'India', type = 'grid_electricity', version) => {
  const keyWithVer = version ? `${region}:${type}:${version}` : null;
  if (keyWithVer && emissionFactorsMap.has(keyWithVer)) {
    return emissionFactorsMap.get(keyWithVer);
  }

  const baseKey = `${region}:${type}`;
  if (emissionFactorsMap.has(baseKey)) {
    return emissionFactorsMap.get(baseKey);
  }

  return defaultFactor;
};

/**
 * Get all 9 compliance rubrics synchronously from memory
 */
const getAllComplianceRubrics = () => {
  return [...complianceRubricsList];
};

/**
 * Get specific compliance rubric by principle number (1-9)
 * @param {number} principleNumber
 */
const getComplianceRubric = (principleNumber) => {
  return complianceRubricsList.find((r) => r.principleNumber === principleNumber) || null;
};

module.exports = {
  ensureCacheLoaded,
  getEmissionFactor,
  getAllComplianceRubrics,
  getComplianceRubric,
  isCacheReady: () => isInitialized,
};

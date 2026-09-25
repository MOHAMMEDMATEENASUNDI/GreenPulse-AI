/**
 * GreenPulse AI - ESG Engine Service
 * Evaluates compliance across the 9 BRSR / NGRBC principles.
 * Principle 6 is strictly evaluated from operational Energy and Waste activity records.
 * Principles 1-5 and 7-9 are populated from statutory templates with demo provenance.
 * Preserves the exact frontend Penalty Shield response shape with zero added keys.
 */

const mongoose = require('mongoose');
const PrincipleDisclosure = require('./principle-disclosure.model');
const EnergyRecord = require('../upload/energy-record.model');
const WasteRecord = require('../upload/waste-record.model');
const { evaluatePrinciple6, SEEDED_PRINCIPLES_DEFAULTS } = require('./rubric.config');
const referenceCache = require('../../config/referenceCache');
const logger = require('../../lib/logger');
const AppError = require('../../utils/AppError');
const { logAuditEvent } = require('../audit/auditLogger');

/**
 * Ensure Principles 1-5 and 7-9 exist for a company in PrincipleDisclosure collection
 * @param {mongoose.Types.ObjectId} companyId
 */
const ensureCompanyDisclosures = async (companyId) => {
  const existing = await PrincipleDisclosure.find({
    companyId,
    principleNumber: { $ne: 6 },
  }).lean();

  if (existing.length < 8) {
    const existingNums = new Set(existing.map((p) => p.principleNumber));
    const missingOps = [];

    for (const def of SEEDED_PRINCIPLES_DEFAULTS) {
      if (!existingNums.has(def.principleNumber)) {
        missingOps.push({
          updateOne: {
            filter: { companyId, principleNumber: def.principleNumber },
            update: {
              $setOnInsert: {
                companyId,
                principleNumber: def.principleNumber,
                status: def.status,
                coveragePercent: def.coveragePercent,
                activeDataSources: def.activeDataSources,
                specificGaps: def.specificGaps,
                mappedEvidence: def.mappedEvidence,
                isSeededDemo: true,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (missingOps.length > 0) {
      await PrincipleDisclosure.bulkWrite(missingOps);
    }
  }
};

/**
 * Check usable operational activity records for Principle 6 evaluation
 * @param {mongoose.Types.ObjectId} companyId
 */
const checkUsableActivityData = async (companyId) => {
  const energyRecord = await EnergyRecord.findOne({
    companyId,
    kwhUsed: { $gte: 0, $type: 'number' },
  }).lean();

  const wasteRecord = await WasteRecord.findOne({
    companyId,
    quantityKg: { $gte: 0, $type: 'number' },
  }).lean();

  return {
    hasEnergyData: Boolean(energyRecord && Number.isFinite(energyRecord.kwhUsed)),
    hasWasteData: Boolean(wasteRecord && Number.isFinite(wasteRecord.quantityKg)),
  };
};

/**
 * Assemble and evaluate all 9 principles for a company.
 * Strictly adheres to the frontend response schema.
 *
 * @param {string|mongoose.Types.ObjectId} companyId
 */
const getEsgScore = async (companyId) => {
  await referenceCache.ensureCacheLoaded();
  const companyObjId = new mongoose.Types.ObjectId(companyId.toString());

  // 1. Ensure seeded demo disclosures exist for other 8 principles
  await ensureCompanyDisclosures(companyObjId);

  // 2. Fetch Principles from DB
  const storedDisclosures = await PrincipleDisclosure.find({
    companyId: companyObjId,
  }).lean();

  const disclosureMap = new Map();
  storedDisclosures.forEach((d) => {
    disclosureMap.set(d.principleNumber, d);
  });

  // 3. Dynamically evaluate Principle 6 from operational records
  const { hasEnergyData, hasWasteData } = await checkUsableActivityData(companyObjId);
  const p6Evaluation = evaluatePrinciple6(hasEnergyData, hasWasteData);

  // 4. Assemble all 9 principles in order (1-9)
  const principles = [];

  for (let num = 1; num <= 9; num++) {
    const rubricDef = referenceCache.getComplianceRubric(num);
    const principleName = rubricDef ? rubricDef.name : `Principle ${num}`;

    if (num === 6) {
      // Dynamic Principle 6 (falls back to p6Evaluation unless stored disclosure exists)
      const doc = disclosureMap.get(6);
      if (doc) {
        principles.push({
          number: 6,
          name: principleName,
          status: doc.status,
          coveragePercent: doc.coveragePercent,
          activeDataSources: doc.activeDataSources,
          specificGaps: doc.specificGaps,
          mappedEvidence: doc.mappedEvidence,
        });
      } else {
        principles.push({
          number: 6,
          name: principleName,
          status: p6Evaluation.status,
          coveragePercent: p6Evaluation.coveragePercent,
          activeDataSources: p6Evaluation.activeDataSources,
          specificGaps: p6Evaluation.specificGaps,
          mappedEvidence: p6Evaluation.mappedEvidence,
        });
      }
    } else {
      // Seeded/demo principles (1-5, 7-9)
      const doc = disclosureMap.get(num);
      const fallbackDef = SEEDED_PRINCIPLES_DEFAULTS.find((s) => s.principleNumber === num);

      principles.push({
        number: num,
        name: principleName,
        status: doc ? doc.status : fallbackDef?.status || 'missing',
        coveragePercent: doc ? doc.coveragePercent : fallbackDef?.coveragePercent || 0,
        activeDataSources: doc ? doc.activeDataSources : fallbackDef?.activeDataSources || [],
        specificGaps: doc ? doc.specificGaps : fallbackDef?.specificGaps || [],
        mappedEvidence: doc ? doc.mappedEvidence : fallbackDef?.mappedEvidence || [],
      });
    }
  }

  // 5. Calculate summary
  const complete = principles.filter((p) => p.status === 'complete').length;
  const partial = principles.filter((p) => p.status === 'partial').length;
  const missing = principles.filter((p) => p.status === 'missing').length;

  return {
    principles,
    summary: {
      total: 9,
      complete,
      partial,
      missing,
    },
  };
};

/**
 * Recompute and update ESG state for a company during pipeline execution
 * @param {string|mongoose.Types.ObjectId} companyId
 * @param {object} [options]
 */
const recalculateEsgForCompany = async (companyId, options = {}) => {
  const result = await getEsgScore(companyId);

  logger.info(
    {
      companyId: companyId.toString(),
      summary: result.summary,
      jobId: options.jobId,
    },
    'ESG principles evaluated successfully'
  );

  return result;
};

/**
 * Attach demo evidence items to a specific ESG principle and resolve matching disclosure gaps.
 * Strictly affects only the targeted principle and maintains [SEEDED DEMO EVIDENCE] provenance.
 *
 * @param {string|mongoose.Types.ObjectId} companyId
 * @param {number} principleNumber
 * @param {object} payload
 * @param {string} [payload.evidenceType='demo']
 * @param {Array<{name: string, reference: string, targetGap?: string}>} payload.evidenceItems
 * @param {string} [payload.actorId]
 */
const addPrincipleEvidence = async (companyId, principleNumber, { evidenceType = 'demo', evidenceItems = [], actorId } = {}) => {
  await referenceCache.ensureCacheLoaded();
  const companyObjId = new mongoose.Types.ObjectId(companyId.toString());

  const pNum = Number(principleNumber);
  if (!Number.isInteger(pNum) || pNum < 1 || pNum > 9) {
    throw new AppError('Invalid principle number. Must be between 1 and 9.', 400, 'INVALID_PRINCIPLE');
  }

  // 1. Ensure baseline company disclosures are present
  await ensureCompanyDisclosures(companyObjId);

  // 2. Fetch or create PrincipleDisclosure document for this principle
  let doc = await PrincipleDisclosure.findOne({
    companyId: companyObjId,
    principleNumber: pNum,
  });

  if (!doc) {
    if (pNum === 6) {
      const { hasEnergyData, hasWasteData } = await checkUsableActivityData(companyObjId);
      const p6Base = evaluatePrinciple6(hasEnergyData, hasWasteData);
      doc = new PrincipleDisclosure({
        companyId: companyObjId,
        principleNumber: 6,
        status: p6Base.status,
        coveragePercent: p6Base.coveragePercent,
        activeDataSources: [...p6Base.activeDataSources],
        specificGaps: [...p6Base.specificGaps],
        mappedEvidence: [...p6Base.mappedEvidence],
        isSeededDemo: true,
      });
    } else {
      const fallbackDef = SEEDED_PRINCIPLES_DEFAULTS.find((s) => s.principleNumber === pNum);
      doc = new PrincipleDisclosure({
        companyId: companyObjId,
        principleNumber: pNum,
        status: fallbackDef?.status || 'missing',
        coveragePercent: fallbackDef?.coveragePercent || 0,
        activeDataSources: [...(fallbackDef?.activeDataSources || [])],
        specificGaps: [...(fallbackDef?.specificGaps || [])],
        mappedEvidence: [...(fallbackDef?.mappedEvidence || [])],
        isSeededDemo: true,
      });
    }
  }

  const initialGaps = [...doc.specificGaps];
  const initialGapCount = initialGaps.length;
  const initialCoverage = doc.coveragePercent;

  // 3. Append preferred mapped evidence format: [SEEDED DEMO EVIDENCE] <name> — <reference>
  for (const item of evidenceItems) {
    const formattedEvidence = `[SEEDED DEMO EVIDENCE] ${item.name} — ${item.reference}`;
    if (!doc.mappedEvidence.includes(formattedEvidence)) {
      doc.mappedEvidence.push(formattedEvidence);
    }
  }

  // 4. Append preferred active data sources: "[SEEDED DEMO] Evidence Resolution"
  const dataSourceLabel = '[SEEDED DEMO] Evidence Resolution';
  if (!doc.activeDataSources.includes(dataSourceLabel)) {
    doc.activeDataSources.push(dataSourceLabel);
  }

  // 5. Remove only the matching resolved gaps
  const isGapResolved = (gap, items) => {
    const normGap = gap.toLowerCase();
    return items.some((item) => {
      // Check explicit targetGap
      if (item.targetGap) {
        const normTarget = item.targetGap.toLowerCase();
        if (normGap.includes(normTarget) || normTarget.includes(normGap)) return true;
      }

      const normName = item.name.toLowerCase();
      // Direct substring match
      if (normGap.includes(normName)) return true;

      // Token/phrase match on descriptive keywords (excluding common filler words)
      const meaningfulTokens = normName
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 3 && !['data', 'demo', 'evidence', 'ledger', 'audit', 'report', 'records'].includes(t));

      if (meaningfulTokens.length > 0 && meaningfulTokens.every((token) => normGap.includes(token))) {
        return true;
      }

      return false;
    });
  };

  doc.specificGaps = doc.specificGaps.filter((gap) => !isGapResolved(gap, evidenceItems));
  const remainingGapCount = doc.specificGaps.length;
  const resolvedGapCount = initialGapCount - remainingGapCount;

  // 6. Update status and coveragePercent
  // status: complete only when all currently required gaps for that principle are resolved, otherwise partial
  if (doc.specificGaps.length === 0) {
    doc.status = 'complete';
    doc.coveragePercent = 100;
  } else {
    doc.status = 'partial';
    if (initialGapCount > 0 && resolvedGapCount > 0) {
      doc.coveragePercent = Math.min(
        100,
        Math.round(initialCoverage + (100 - initialCoverage) * (resolvedGapCount / initialGapCount))
      );
    }
  }

  doc.isSeededDemo = true;
  await doc.save();

  // 7. Audit log event
  await logAuditEvent({
    companyId: companyObjId,
    actorId,
    action: `esg.principle_${pNum}.evidence_resolved`,
  });

  const rubricDef = referenceCache.getComplianceRubric(pNum);
  const principleName = rubricDef ? rubricDef.name : `Principle ${pNum}`;

  return {
    number: pNum,
    name: principleName,
    status: doc.status,
    coveragePercent: doc.coveragePercent,
    activeDataSources: doc.activeDataSources,
    specificGaps: doc.specificGaps,
    mappedEvidence: doc.mappedEvidence,
  };
};

module.exports = {
  getEsgScore,
  recalculateEsgForCompany,
  checkUsableActivityData,
  addPrincipleEvidence,
};

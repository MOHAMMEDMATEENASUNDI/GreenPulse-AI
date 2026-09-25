const mongoose = require('mongoose');
const Report = require('./report.model');
const { REPORT_CONFIGS, VALID_REPORT_TYPES } = require('./report.config');
const Company = require('../companies/company.model');
const Emission = require('../carbon/emission.model');
const EnergyRecord = require('../upload/energy-record.model');
const esgService = require('../esg/esg.service');
const greenScoreService = require('../greenscore/greenscore.service');
const referenceCache = require('../../config/referenceCache');
const { generateCompliancePdf } = require('../../lib/pdfGenerator');
const storageClient = require('../../lib/storageClient');
const { db: firestoreDb } = require('../../config/firebase');
const logger = require('../../lib/logger');
const { logAuditEvent } = require('../audit/auditLogger');

/**
 * Safely sync report state to Firestore
 */
const syncReportToFirestore = async (reportId, data) => {
  if (!firestoreDb) return;
  try {
    const docRef = firestoreDb.collection('reports').doc(reportId.toString());
    await docRef.set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    logger.warn({ err: err.message, reportId: reportId.toString() }, 'Failed to mirror report to Firestore');
  }
};

/**
 * Gather immutable data snapshot strictly consuming Phase 3 Carbon, ESG, and Green Score
 */
const gatherDataSnapshot = async (company, period, reportType) => {
  const companyObjId = company._id;

  // 1. Carbon Data: Single Source of Truth from Phase 3
  await referenceCache.ensureCacheLoaded();
  const emissionFactorDoc = referenceCache.getEmissionFactor('India', 'grid_electricity');
  const factorVal = emissionFactorDoc?.factorKgCO2ePerKwh || 0.82;

  const emissions = await Emission.find({ companyId: companyObjId, period }).lean();
  let totalKwh = 0;
  let totalScope2Kg = 0;

  emissions.forEach((e) => {
    totalKwh += e.kwhUsed || 0;
    totalScope2Kg += e.co2eScope2 || 0;
  });

  // If no emission records exist for period, check EnergyRecord
  const energyRecordCount = await EnergyRecord.countDocuments({ companyId: companyObjId, period });
  if (emissions.length === 0 && energyRecordCount > 0) {
    const energyRecords = await EnergyRecord.find({ companyId: companyObjId, period }).lean();
    energyRecords.forEach((r) => {
      totalKwh += r.kwhUsed || 0;
    });
    totalScope2Kg = totalKwh * factorVal;
  }

  totalKwh = Number(totalKwh.toFixed(2));
  totalScope2Kg = Number(totalScope2Kg.toFixed(2));

  // 2. ESG Principles Data: Evaluate 9 principles and filter by applicable config
  const esgScore = await esgService.getEsgScore(companyObjId);
  const config = REPORT_CONFIGS[reportType];
  const applicableList = config.applicablePrinciples;

  let disclosureGapCount = 0;
  const principlesSnapshot = [];

  for (const p of esgScore.principles) {
    const isApplicable = applicableList.includes(p.number);
    if (isApplicable) {
      const isGap = p.status === 'partial' || p.status === 'missing' || (p.coveragePercent != null && p.coveragePercent < 100);
      if (isGap) {
        disclosureGapCount++;
      }
    }

    principlesSnapshot.push({
      principleNumber: p.number,
      principleName: p.name,
      status: p.status,
      coveragePercentage: p.coveragePercent,
      isApplicable,
    });
  }

  // 3. Green Score Data
  const greenScoreData = await greenScoreService.getLatestGreenScore(companyObjId);
  const gScore = greenScoreData.score;
  const rating = gScore >= 80 ? 'EXEMPLARY' : gScore >= 60 ? 'COMMENDABLE' : gScore >= 40 ? 'MODERATE' : 'CRITICAL';

  // 4. Assemble Write-Once dataSnapshot
  const dataSnapshot = {
    snapshotDate: new Date().toISOString(),
    company: {
      id: company._id.toString(),
      name: company.name,
      industry: company.industry,
      brsrStatus: company.brsrStatus,
    },
    carbon: {
      period,
      scope1: {
        totalKgCO2e: null,
        totalTonsCO2e: null,
        dataAvailable: false,
        reason: 'No direct-fuel activity data ingested yet',
      },
      scope2: {
        totalKgCO2e: totalScope2Kg,
        totalTonsCO2e: Number((totalScope2Kg / 1000).toFixed(3)),
        totalKwh,
        factorApplied: factorVal,
        recordCount: energyRecordCount,
      },
      totalReportedKgCO2e: totalScope2Kg,
    },
    esg: {
      principles: principlesSnapshot,
      summary: esgScore.summary,
    },
    greenScore: {
      score: gScore,
      rating,
      breakdown: greenScoreData.breakdown,
    },
  };

  const executiveSummary = {
    framework: config.framework,
    telemetryAndScope: `Scope 2 purchased electricity (${totalKwh} kWh) across ${energyRecordCount} record(s) for period ${period}`,
    auditLevel: 'Internal system-generated; not externally assured',
    keyFinding:
      disclosureGapCount === 0
        ? `Complete compliance achieved for ${config.name}. Overall Green Score: ${gScore}/100.`
        : `Identified ${disclosureGapCount} statutory disclosure gap(s) across applicable principles for ${config.name}. Overall Green Score: ${gScore}/100.`,
  };

  return {
    dataSnapshot,
    executiveSummary,
    disclosureGapCount,
  };
};

/**
 * Asynchronous background worker for PDF generation & cloud storage
 */
const processReportPdfAsync = async (reportId) => {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      logger.error({ reportId: reportId.toString() }, 'Report not found during asynchronous PDF processing');
      return;
    }

    // 1. Generate PDF in memory
    const pdfBuffer = await generateCompliancePdf(report);

    // 2. Upload to storage
    const storageRef = `reports/${report.companyId}/${report._id}_${report.period}.pdf`;
    await storageClient.uploadPdf(pdfBuffer, storageRef);

    // 3. Determine final status: ready if zero gaps, needs_review if statutory gaps exist
    const finalStatus = report.disclosureGapCount > 0 ? 'needs_review' : 'ready';

    // 4. Update MongoDB (dataSnapshot is never touched to enforce immutability)
    await Report.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status: finalStatus,
          pdfStorageRef: storageRef,
          generatedAt: new Date(),
        },
      },
      { runValidators: true }
    );

    // 5. Mirror status to Firestore
    await syncReportToFirestore(reportId, {
      status: finalStatus,
      pdfStorageRef: storageRef,
      generatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      companyId: report.companyId,
      actorId: report.requestedBy,
      action: 'report.generated',
    });

    logger.info(
      { reportId: reportId.toString(), status: finalStatus, storageRef },
      'Report PDF generated and stored successfully'
    );
  } catch (err) {
    logger.error({ reportId: reportId.toString(), err: err.message }, 'Report PDF generation failed');

    await Report.findByIdAndUpdate(reportId, {
      $set: {
        status: 'failed',
        failureReason: err.message,
      },
    });

    await syncReportToFirestore(reportId, {
      status: 'failed',
      failureReason: err.message,
    });
  }
};

/**
 * Initiate report compilation (asynchronous)
 */
const initiateReportGeneration = async ({ companyId, reportType, period, requestedBy }) => {
  if (!VALID_REPORT_TYPES.includes(reportType)) {
    throw new Error(`Invalid reportType: ${reportType}`);
  }

  const company = await Company.findById(companyId);
  if (!company) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  // Gather write-once snapshot
  const { dataSnapshot, executiveSummary, disclosureGapCount } = await gatherDataSnapshot(company, period, reportType);

  // Create report document in 'generating' state
  const report = await Report.create({
    reportType,
    period,
    companyId: company._id,
    requestedBy,
    status: 'generating',
    dataSnapshot,
    executiveSummary,
    disclosureGapCount,
    pdfStorageRef: null,
  });

  // Mirror initial state to Firestore
  await syncReportToFirestore(report._id, {
    id: report._id.toString(),
    companyId: company._id.toString(),
    reportType,
    period,
    status: 'generating',
    disclosureGapCount,
    executiveSummary,
    pdfStorageRef: null,
    createdAt: report.createdAt ? report.createdAt.toISOString() : new Date().toISOString(),
  });

  // Kick off async PDF creation
  setImmediate(() => {
    processReportPdfAsync(report._id).catch((err) => {
      logger.error({ reportId: report._id.toString(), err: err.message }, 'Unhandled error in processReportPdfAsync');
    });
  });

  return report;
};

/**
 * List reports for a company (lightweight payload, dataSnapshot omitted)
 */
const getReportsByCompany = async (companyId, filter = {}) => {
  const query = { companyId: new mongoose.Types.ObjectId(companyId.toString()) };
  if (filter.reportType) query.reportType = filter.reportType;
  if (filter.period) query.period = filter.period;
  if (filter.status) query.status = filter.status;

  return Report.find(query)
    .select('-dataSnapshot')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get detailed report by ID with projected metadata (excludes full raw dataSnapshot)
 */
const getReportById = async (reportId, companyId) => {
  const query = { _id: new mongoose.Types.ObjectId(reportId.toString()) };
  if (companyId) {
    query.companyId = new mongoose.Types.ObjectId(companyId.toString());
  }

  const report = await Report.findOne(query).lean();
  if (!report) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }

  // Return clean, structured detail payload
  return {
    _id: report._id,
    companyId: report.companyId,
    reportType: report.reportType,
    period: report.period,
    status: report.status,
    disclosureGapCount: report.disclosureGapCount,
    executiveSummary: report.executiveSummary,
    pdfStorageRef: report.pdfStorageRef,
    generatedAt: report.generatedAt,
    failureReason: report.failureReason,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    snapshotSummary: {
      snapshotDate: report.dataSnapshot?.snapshotDate,
      companyName: report.dataSnapshot?.company?.name,
      scope2KgCO2e: report.dataSnapshot?.carbon?.scope2?.totalKgCO2e,
      scope1Status: report.dataSnapshot?.carbon?.scope1?.reason,
      greenScore: report.dataSnapshot?.greenScore?.score,
    },
  };
};

/**
 * Get short-lived signed URL for report download
 */
const getReportDownloadAccess = async (reportId, companyId) => {
  const query = { _id: new mongoose.Types.ObjectId(reportId.toString()) };
  if (companyId) {
    query.companyId = new mongoose.Types.ObjectId(companyId.toString());
  }

  const report = await Report.findOne(query);
  if (!report) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }

  if (report.status !== 'ready' && report.status !== 'needs_review') {
    const err = new Error(`Report is not ready for download (current status: ${report.status})`);
    err.statusCode = 400;
    throw err;
  }

  if (!report.pdfStorageRef) {
    const err = new Error('PDF storage reference is not available for this report');
    err.statusCode = 404;
    throw err;
  }

  const access = await storageClient.getSignedDownloadUrl(report.pdfStorageRef, 15);
  return {
    reportId: report._id,
    reportType: report.reportType,
    period: report.period,
    status: report.status,
    ...access,
  };
};

module.exports = {
  initiateReportGeneration,
  processReportPdfAsync,
  getReportsByCompany,
  getReportById,
  getReportDownloadAccess,
  syncReportToFirestore,
};

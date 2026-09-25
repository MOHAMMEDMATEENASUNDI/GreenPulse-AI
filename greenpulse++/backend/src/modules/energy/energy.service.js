const EnergyRecord = require('../upload/energy-record.model');
const Department = require('../departments/department.model');
const Anomaly = require('./anomaly.model');
const logger = require('../../lib/logger');

/**
 * Pure statistical calculation function for Energy Anomaly Detection
 * @param {number[]} historicalValues - Exactly 3 prior usable energy values
 * @param {number} currentValue - Current period energy value
 */
const evaluateAnomaly = (historicalValues, currentValue) => {
  if (!Array.isArray(historicalValues) || historicalValues.length < 3) {
    return {
      isAnomaly: false,
      status: 'insufficient_data',
      message: 'insufficient data for anomaly detection',
    };
  }

  // Use exactly the immediately preceding 3 usable values
  const windowValues = historicalValues.slice(-3);

  // 1. Arithmetic Mean
  const sum = windowValues.reduce((acc, val) => acc + val, 0);
  const baselineMean = sum / 3;

  // 2. Population Standard Deviation: sqrt( sum((x_i - mean)^2) / 3 )
  const variance = windowValues.reduce((acc, val) => acc + Math.pow(val - baselineMean, 2), 0) / 3;
  const standardDeviation = Math.sqrt(variance);

  // 3. Deviation Percent
  let deviationPercent = 0;
  if (baselineMean === 0) {
    if (currentValue === 0) {
      deviationPercent = 0;
    } else {
      deviationPercent = 100;
    }
  } else {
    deviationPercent = ((currentValue - baselineMean) / baselineMean) * 100;
  }

  // 4. Zero Standard Deviation Handling
  if (standardDeviation === 0) {
    if (currentValue === baselineMean) {
      return {
        isAnomaly: false,
        baselineMean,
        standardDeviation: 0,
        zScore: 0,
        deviationPercent,
        severity: null,
      };
    } else {
      return {
        isAnomaly: true,
        baselineMean,
        standardDeviation: 0,
        zScore: null,
        deviationPercent,
        severity: 'high',
      };
    }
  }

  // 5. Z-Score calculation
  const zScore = (currentValue - baselineMean) / standardDeviation;
  const absZ = Math.abs(zScore);

  if (absZ < 2.0) {
    return {
      isAnomaly: false,
      baselineMean,
      standardDeviation,
      zScore,
      deviationPercent,
      severity: null,
    };
  }

  // 6. Severity thresholds
  let severity = 'low';
  if (absZ >= 5.0) {
    severity = 'critical';
  } else if (absZ >= 4.0) {
    severity = 'high';
  } else if (absZ >= 3.0) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  return {
    isAnomaly: true,
    baselineMean,
    standardDeviation,
    zScore,
    deviationPercent,
    severity,
  };
};

/**
 * Detect and persist anomalies across all departments for a company
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.companyId
 * @param {string|import('mongoose').Types.ObjectId} [params.jobId]
 */
const detectAndPersistAnomaliesForCompany = async ({ companyId, jobId }) => {
  const companyIdStr = companyId.toString();
  const jobIdStr = jobId ? jobId.toString() : null;

  logger.info(
    { companyId: companyIdStr, jobId: jobIdStr },
    'Starting energy anomaly detection'
  );

  // Fetch all departments for company
  const departments = await Department.find({ companyId }).lean();
  const detectedAnomalies = [];

  for (const dept of departments) {
    const deptId = dept._id;

    // Fetch all usable records for department sorted chronologically ascending
    const records = await EnergyRecord.find({
      companyId,
      departmentId: deptId,
      kwhUsed: { $gte: 0, $type: 'number' },
    })
      .sort({ period: 1 })
      .lean();

    if (records.length < 4) {
      // Needs at least 3 prior + 1 current = 4 records for any anomaly evaluation
      continue;
    }

    // Evaluate the latest period against its 3 immediately preceding periods
    const currentRecord = records[records.length - 1];
    const priorRecords = records.slice(0, records.length - 1);

    if (priorRecords.length < 3) {
      continue;
    }

    const baselineRecords = priorRecords.slice(-3);
    const baselineKwhs = baselineRecords.map((r) => r.kwhUsed);

    const evaluation = evaluateAnomaly(baselineKwhs, currentRecord.kwhUsed);

    if (evaluation.isAnomaly) {
      // Persist or update anomaly document
      const anomalyDoc = await Anomaly.findOneAndUpdate(
        {
          companyId,
          departmentId: deptId,
          period: currentRecord.period,
        },
        {
          companyId,
          departmentId: deptId,
          period: currentRecord.period,
          metric: 'energy_kwh',
          currentValue: currentRecord.kwhUsed,
          baselineMean: evaluation.baselineMean,
          standardDeviation: evaluation.standardDeviation,
          zScore: evaluation.zScore,
          deviationPercent: evaluation.deviationPercent,
          severity: evaluation.severity,
          uploadJobId: jobId || currentRecord.uploadJobId,
          detectedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      detectedAnomalies.push({
        ...anomalyDoc.toObject(),
        departmentName: dept.name,
      });

      logger.warn(
        {
          companyId: companyIdStr,
          jobId: jobIdStr,
          department: dept.name,
          period: currentRecord.period,
          severity: evaluation.severity,
          zScore: evaluation.zScore,
          deviationPercent: evaluation.deviationPercent,
        },
        'Energy anomaly detected and persisted'
      );
    }
  }

  logger.info(
    { companyId: companyIdStr, jobId: jobIdStr, count: detectedAnomalies.length },
    'Energy anomaly detection completed'
  );

  return detectedAnomalies;
};

/**
 * Get energy usage history scoped to company
 * @param {string|import('mongoose').Types.ObjectId} companyId
 * @param {object} [filters={}]
 */
const getEnergyUsage = async (companyId, filters = {}) => {
  const query = { companyId, kwhUsed: { $gte: 0, $type: 'number' } };
  if (filters.departmentId) {
    query.departmentId = filters.departmentId;
  }
  if (filters.period) {
    query.period = filters.period;
  }

  const records = await EnergyRecord.find(query)
    .populate('departmentId', 'name facilityType')
    .sort({ period: 1, departmentId: 1 })
    .lean();

  return records.map((r) => ({
    id: r._id,
    departmentId: r.departmentId?._id ? r.departmentId._id.toString() : r.departmentId?.toString(),
    period: r.period,
    kwhUsed: r.kwhUsed,
    department: r.departmentId?.name || 'Unknown',
    facilityType: r.departmentId?.facilityType || 'GENERAL',
    uploadJobId: r.uploadJobId,
  }));
};

/**
 * Get persisted energy anomalies scoped to company
 * @param {string|import('mongoose').Types.ObjectId} companyId
 * @param {object} [filters={}]
 */
const getEnergyAnomalies = async (companyId, filters = {}) => {
  const query = { companyId };
  if (filters.severity) {
    query.severity = filters.severity;
  }
  if (filters.departmentId) {
    query.departmentId = filters.departmentId;
  }
  if (filters.period) {
    query.period = filters.period;
  }

  const anomalies = await Anomaly.find(query)
    .populate('departmentId', 'name facilityType')
    .sort({ detectedAt: -1 })
    .lean();

  return anomalies.map((a) => ({
    id: a._id,
    period: a.period,
    metric: a.metric,
    currentValue: a.currentValue,
    baselineMean: a.baselineMean,
    standardDeviation: a.standardDeviation,
    zScore: a.zScore,
    deviationPercent: a.deviationPercent,
    severity: a.severity,
    department: a.departmentId?.name || 'Unknown',
    departmentId: a.departmentId?._id ? a.departmentId._id.toString() : a.departmentId?.toString(),
    detectedAt: a.detectedAt,
    uploadJobId: a.uploadJobId,
  }));
};

module.exports = {
  evaluateAnomaly,
  detectAndPersistAnomaliesForCompany,
  getEnergyUsage,
  getEnergyAnomalies,
};

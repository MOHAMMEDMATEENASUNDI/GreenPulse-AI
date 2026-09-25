/**
 * GreenPulse AI - Carbon Intelligence Engine Service
 * Pure functions: computes emissions per department per period.
 * Reads emission factors from runtime in-memory cache without per-calculation DB hits.
 */

const mongoose = require('mongoose');
const Emission = require('./emission.model');
const EnergyRecord = require('../upload/energy-record.model');
const FuelRecord = require('../upload/fuel-record.model');
const Department = require('../departments/department.model');
const referenceCache = require('../../config/referenceCache');
const logger = require('../../lib/logger');

// Scope 1 (direct fuel combustion) is calculated from uploaded FuelRecords.
// Scope 2 (grid electricity) is actively calculated from EnergyRecords.
// Scope 3 (upstream fuel & energy) is calculated from uploaded FuelRecords.

/**
 * Helper to wrap raw scope numbers with rich availability metadata for API responses.
 * Never asserts zero emissions for unsupported scopes.
 *
 * @param {number|null} scope1Val
 * @param {number|null} scope2Val
 * @param {number|null} scope3Val
 */
const formatScopeMetadata = (scope1Val = null, scope2Val = null, scope3Val = null) => {
  return {
    scope1: {
      value: scope1Val !== null && scope1Val !== undefined ? Number(scope1Val.toFixed(2)) : null,
      dataAvailable: scope1Val !== null && scope1Val !== undefined,
      reason: scope1Val !== null ? null : 'No direct-fuel activity data ingested yet',
    },
    scope2: {
      value: scope2Val !== null && scope2Val !== undefined ? Number(scope2Val.toFixed(2)) : null,
      dataAvailable: scope2Val !== null && scope2Val !== undefined,
      reason: null,
    },
    scope3: {
      value: scope3Val !== null && scope3Val !== undefined ? Number(scope3Val.toFixed(2)) : null,
      dataAvailable: scope3Val !== null && scope3Val !== undefined,
      reason: scope3Val !== null ? null : 'No value-chain activity data ingested yet',
    },
  };
};

/**
 * Pure calculation function: compute Scope 2 CO2e from kWh and factor
 * @param {number} kwhUsed
 * @param {number} factorKgCO2ePerKwh
 */
const calculateScope2Emissions = (kwhUsed, factorKgCO2ePerKwh) => {
  const kwh = Math.max(0, Number(kwhUsed) || 0);
  const factor = Number(factorKgCO2ePerKwh) || 0.82;
  const co2e = kwh * factor;
  return Number(co2e.toFixed(4));
};

/**
 * Recompute and persist all Emission documents for a company from existing EnergyRecords and FuelRecords
 * @param {string|mongoose.Types.ObjectId} companyId
 * @param {object} [options]
 * @param {string|mongoose.Types.ObjectId} [options.jobId]
 */
const recalculateEmissionsForCompany = async (companyId, options = {}) => {
  await referenceCache.ensureCacheLoaded();
  const emissionFactorDoc = referenceCache.getEmissionFactor('India', 'grid_electricity');
  const factorVal = emissionFactorDoc.factorKgCO2ePerKwh;
  const factorVersion = emissionFactorDoc.version || 'CEA-2025.1';

  const companyObjId = new mongoose.Types.ObjectId(companyId.toString());

  // 1. Aggregate EnergyRecords by department and period
  const aggregatedEnergy = await EnergyRecord.aggregate([
    { $match: { companyId: companyObjId } },
    {
      $group: {
        _id: {
          departmentId: '$departmentId',
          period: '$period',
        },
        totalKwh: { $sum: '$kwhUsed' },
      },
    },
  ]);

  // 2. Aggregate FuelRecords by department and period
  const aggregatedFuel = await FuelRecord.aggregate([
    { $match: { companyId: companyObjId } },
    {
      $group: {
        _id: {
          departmentId: '$departmentId',
          period: '$period',
        },
        totalScope1: { $sum: '$co2eScope1' },
        totalScope3: { $sum: '$co2eScope3' },
      },
    },
  ]);

  // 3. Merge by (departmentId, period)
  const mergedMap = new Map();

  aggregatedEnergy.forEach((e) => {
    const key = `${e._id.departmentId.toString()}:${e._id.period}`;
    mergedMap.set(key, {
      departmentId: e._id.departmentId,
      period: e._id.period,
      kwh: e.totalKwh,
      hasEnergy: true,
      scope1: null,
      scope3: null,
    });
  });

  aggregatedFuel.forEach((f) => {
    const key = `${f._id.departmentId.toString()}:${f._id.period}`;
    const existing = mergedMap.get(key);
    if (existing) {
      existing.scope1 = f.totalScope1;
      existing.scope3 = f.totalScope3;
    } else {
      mergedMap.set(key, {
        departmentId: f._id.departmentId,
        period: f._id.period,
        kwh: 0,
        hasEnergy: false,
        scope1: f.totalScope1,
        scope3: f.totalScope3,
      });
    }
  });

  const bulkOps = Array.from(mergedMap.values()).map((item) => {
    const kwh = item.kwh;
    const scope2Kg = item.hasEnergy ? calculateScope2Emissions(kwh, factorVal) : 0;
    const scope1Kg = item.scope1 !== null ? Number(item.scope1.toFixed(4)) : null;
    const scope3Kg = item.scope3 !== null ? Number(item.scope3.toFixed(4)) : null;
    const totalCo2e = Number(((scope1Kg || 0) + scope2Kg + (scope3Kg || 0)).toFixed(4));

    return {
      updateOne: {
        filter: {
          companyId: companyObjId,
          departmentId: item.departmentId,
          period: item.period,
        },
        update: {
          $set: {
            kwhUsed: kwh,
            co2eScope1: scope1Kg,
            co2eScope2: scope2Kg,
            co2eScope3: scope3Kg,
            totalCo2e,
            factorVersion,
            uploadJobId: options.jobId ? new mongoose.Types.ObjectId(options.jobId.toString()) : undefined,
          },
        },
        upsert: true,
      },
    };
  });

  if (bulkOps.length > 0) {
    await Emission.bulkWrite(bulkOps);
  }

  logger.info(
    { companyId: companyId.toString(), recordsCount: bulkOps.length, jobId: options.jobId },
    'Emissions recalculated and persisted successfully'
  );

  return { processedPeriods: bulkOps.length };
};

/**
 * Get company-wide carbon summary with period breakdowns and department contributions
 * @param {string|mongoose.Types.ObjectId} companyId
 */
const getCarbonSummary = async (companyId) => {
  await referenceCache.ensureCacheLoaded();
  const companyObjId = new mongoose.Types.ObjectId(companyId.toString());

  // Pipeline 1: Company-wide rollup by period
  const periodRollup = await Emission.aggregate([
    { $match: { companyId: companyObjId } },
    {
      $group: {
        _id: '$period',
        totalKwhUsed: { $sum: '$kwhUsed' },
        totalScope1: { $sum: '$co2eScope1' },
        totalScope2: { $sum: '$co2eScope2' },
        totalScope3: { $sum: '$co2eScope3' },
        hasScope1: { $max: { $cond: [{ $ne: ['$co2eScope1', null] }, 1, 0] } },
        hasScope2: { $max: { $cond: [{ $gt: ['$kwhUsed', 0] }, 1, 0] } },
        hasScope3: { $max: { $cond: [{ $ne: ['$co2eScope3', null] }, 1, 0] } },
        totalCo2e: { $sum: '$totalCo2e' },
        departmentCount: { $addToSet: '$departmentId' },
      },
    },
    { $sort: { _id: -1 } }, // latest first
  ]);

  // Pipeline 2: Department breakdown rollup
  const departmentBreakdown = await Emission.aggregate([
    { $match: { companyId: companyObjId } },
    {
      $group: {
        _id: '$departmentId',
        totalKwhUsed: { $sum: '$kwhUsed' },
        totalScope1: { $sum: '$co2eScope1' },
        totalScope2: { $sum: '$co2eScope2' },
        totalScope3: { $sum: '$co2eScope3' },
        hasScope1: { $max: { $cond: [{ $ne: ['$co2eScope1', null] }, 1, 0] } },
        hasScope2: { $max: { $cond: [{ $gt: ['$kwhUsed', 0] }, 1, 0] } },
        hasScope3: { $max: { $cond: [{ $ne: ['$co2eScope3', null] }, 1, 0] } },
        totalCo2e: { $sum: '$totalCo2e' },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'deptInfo',
      },
    },
    { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        departmentId: '$_id',
        departmentName: { $ifNull: ['$deptInfo.name', 'Unknown Department'] },
        totalKwhUsed: 1,
        totalScope1: 1,
        totalScope2: 1,
        totalScope3: 1,
        hasScope1: 1,
        hasScope2: 1,
        hasScope3: 1,
        totalCo2e: 1,
      },
    },
    { $sort: { totalCo2e: -1 } },
  ]);

  // Company totals
  let grandTotalKwh = 0;
  let grandTotalScope1 = 0;
  let grandTotalScope2 = 0;
  let grandTotalScope3 = 0;
  let grandTotalCo2e = 0;
  let companyHasScope1 = false;
  let companyHasScope2 = false;
  let companyHasScope3 = false;

  periodRollup.forEach((p) => {
    grandTotalKwh += p.totalKwhUsed;
    grandTotalScope2 += p.totalScope2;
    grandTotalCo2e += p.totalCo2e;
    if (p.hasScope1) {
      grandTotalScope1 += p.totalScope1;
      companyHasScope1 = true;
    }
    if (p.hasScope2) {
      companyHasScope2 = true;
    }
    if (p.hasScope3) {
      grandTotalScope3 += p.totalScope3;
      companyHasScope3 = true;
    }
  });

  const latestPeriod = periodRollup.length > 0 ? periodRollup[0] : null;

  return {
    latestPeriod: latestPeriod ? latestPeriod._id : null,
    totalKgCO2e: Number(grandTotalCo2e.toFixed(2)),
    totalKwh: Number(grandTotalKwh.toFixed(2)),
    scopes: formatScopeMetadata(
      companyHasScope1 ? grandTotalScope1 : null,
      companyHasScope2 || grandTotalScope2 > 0 ? (latestPeriod ? latestPeriod.totalScope2 : grandTotalScope2) : null,
      companyHasScope3 ? grandTotalScope3 : null
    ),
    factorVersion: referenceCache.getEmissionFactor('India', 'grid_electricity').version || 'CEA-2025.1',
    periods: periodRollup.map((p) => ({
      period: p._id,
      kwhUsed: Number(p.totalKwhUsed.toFixed(2)),
      co2eScope1: p.hasScope1 ? Number(p.totalScope1.toFixed(2)) : null,
      co2eScope2: Number(p.totalScope2.toFixed(2)),
      co2eScope3: p.hasScope3 ? Number(p.totalScope3.toFixed(2)) : null,
      totalCo2e: Number(p.totalCo2e.toFixed(2)),
      scopes: formatScopeMetadata(
        p.hasScope1 ? p.totalScope1 : null,
        p.totalScope2,
        p.hasScope3 ? p.totalScope3 : null
      ),
      activeDepartments: p.departmentCount.length,
    })),
    departmentBreakdown: departmentBreakdown.map((d) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      kwhUsed: Number(d.totalKwhUsed.toFixed(2)),
      totalCo2e: Number(d.totalCo2e.toFixed(2)),
      scopes: formatScopeMetadata(
        d.hasScope1 ? d.totalScope1 : null,
        d.totalScope2,
        d.hasScope3 ? d.totalScope3 : null
      ),
    })),
  };
};

/**
 * Get carbon emissions history for a specific department
 * @param {string|mongoose.Types.ObjectId} companyId
 * @param {string|mongoose.Types.ObjectId} departmentId
 */
const getDepartmentCarbon = async (companyId, departmentId) => {
  await referenceCache.ensureCacheLoaded();
  const companyObjId = new mongoose.Types.ObjectId(companyId.toString());
  const deptObjId = new mongoose.Types.ObjectId(departmentId.toString());

  const dept = await Department.findOne({ _id: deptObjId, companyId: companyObjId });
  if (!dept) {
    return null;
  }

  const emissions = await Emission.find({ companyId: companyObjId, departmentId: deptObjId })
    .sort({ period: -1 })
    .lean();

  let totalKwh = 0;
  let totalScope1 = 0;
  let totalScope2 = 0;
  let totalScope3 = 0;
  let totalCo2e = 0;
  let deptHasScope1 = false;
  let deptHasScope3 = false;

  const history = emissions.map((e) => {
    totalKwh += e.kwhUsed;
    totalScope2 += e.co2eScope2;
    totalCo2e += e.totalCo2e;
    if (e.co2eScope1 !== null && e.co2eScope1 !== undefined) {
      totalScope1 += e.co2eScope1;
      deptHasScope1 = true;
    }
    if (e.co2eScope3 !== null && e.co2eScope3 !== undefined) {
      totalScope3 += e.co2eScope3;
      deptHasScope3 = true;
    }

    return {
      period: e.period,
      kwhUsed: Number(e.kwhUsed.toFixed(2)),
      totalCo2e: Number(e.totalCo2e.toFixed(2)),
      scopes: formatScopeMetadata(e.co2eScope1, e.co2eScope2, e.co2eScope3),
      factorVersion: e.factorVersion,
    };
  });

  return {
    department: {
      id: dept._id,
      name: dept.name,
      facilityType: dept.facilityType,
    },
    totalKgCO2e: Number(totalCo2e.toFixed(2)),
    totalKwh: Number(totalKwh.toFixed(2)),
    scopes: formatScopeMetadata(
      deptHasScope1 ? totalScope1 : null,
      totalScope2,
      deptHasScope3 ? totalScope3 : null
    ),
    history,
  };
};

module.exports = {
  calculateScope2Emissions,
  formatScopeMetadata,
  recalculateEmissionsForCompany,
  getCarbonSummary,
  getDepartmentCarbon,
};

/**
 * GreenPulse AI — Waste Intelligence Service
 * Computes deterministic aggregated waste telemetry, category breakdowns,
 * subcategory allocations, and period timelines for authenticated companies.
 */

const mongoose = require('mongoose');
const WasteRecord = require('../upload/waste-record.model');

// Standard subcategories taxonomy definition
const STANDARD_SUBCATEGORIES = {
  recyclable: [
    { key: 'plastic', label: 'Plastic' },
    { key: 'paper', label: 'Paper' },
    { key: 'aluminium', label: 'Aluminium' },
    { key: 'steel', label: 'Steel' },
    { key: 'rubber', label: 'Rubber' },
  ],
  hazardous: [
    { key: 'used oil', label: 'Used Oil' },
    { key: 'chemical bottles', label: 'Chemical Bottles' },
  ],
  organic: [
    { key: 'food waste', label: 'Food Waste' },
  ],
};

/**
 * Get comprehensive waste summary for a company
 * @param {string|mongoose.Types.ObjectId} companyId
 * @returns {Promise<object>}
 */
const getWasteSummary = async (companyId) => {
  const companyObjId =
    typeof companyId === 'string' ? new mongoose.Types.ObjectId(companyId) : companyId;

  const records = await WasteRecord.find({ companyId: companyObjId })
    .populate('departmentId', 'name')
    .sort({ period: 1, createdAt: 1 })
    .lean();

  if (!records || records.length === 0) {
    return {
      hasData: false,
      totalKg: 0,
      recyclableKg: 0,
      hazardousKg: 0,
      organicKg: 0,
      recyclablePct: 0,
      hazardousPct: 0,
      organicPct: 0,
      subcategories: {
        Plastic: 0,
        Paper: 0,
        Aluminium: 0,
        Steel: 0,
        Rubber: 0,
        'Used Oil': 0,
        'Chemical Bottles': 0,
        'Food Waste': 0,
        plastic: 0,
        paper: 0,
        aluminium: 0,
        steel: 0,
        rubber: 0,
        'used oil': 0,
        'chemical bottles': 0,
        'food waste': 0,
      },
      byCategory: {
        recyclable: {
          totalKg: 0,
          percentage: 0,
          subcategories: { Plastic: 0, Paper: 0, Aluminium: 0, Steel: 0, Rubber: 0 },
        },
        hazardous: {
          totalKg: 0,
          percentage: 0,
          subcategories: { 'Used Oil': 0, 'Chemical Bottles': 0 },
        },
        organic: {
          totalKg: 0,
          percentage: 0,
          subcategories: { 'Food Waste': 0 },
        },
      },
      periods: [],
      recordsCount: 0,
    };
  }

  let totalKg = 0;
  let recyclableKg = 0;
  let hazardousKg = 0;
  let organicKg = 0;

  // Initialize subcategories dictionary with 0
  const subcatSums = {
    plastic: 0,
    paper: 0,
    aluminium: 0,
    steel: 0,
    rubber: 0,
    'used oil': 0,
    'chemical bottles': 0,
    'food waste': 0,
  };

  const periodMap = new Map();

  for (const record of records) {
    const qty = Number(record.quantityKg) || 0;
    totalKg += qty;

    const cat = (record.category || '').toLowerCase();
    const subcatKey = (record.subcategory || record.matchedKeyword || '').toLowerCase();

    if (cat === 'recyclable') {
      recyclableKg += qty;
    } else if (cat === 'hazardous') {
      hazardousKg += qty;
    } else if (cat === 'organic') {
      organicKg += qty;
    }

    if (subcatKey in subcatSums) {
      subcatSums[subcatKey] += qty;
    } else if (subcatKey) {
      subcatSums[subcatKey] = (subcatSums[subcatKey] || 0) + qty;
    }

    // Period grouping
    const period = record.period;
    if (!periodMap.has(period)) {
      periodMap.set(period, {
        period,
        totalKg: 0,
        recyclableKg: 0,
        hazardousKg: 0,
        organicKg: 0,
      });
    }
    const pGroup = periodMap.get(period);
    pGroup.totalKg += qty;
    if (cat === 'recyclable') pGroup.recyclableKg += qty;
    if (cat === 'hazardous') pGroup.hazardousKg += qty;
    if (cat === 'organic') pGroup.organicKg += qty;
  }

  // Format numbers to clean floats (avoid JS floating point arithmetic artifacts)
  totalKg = Number(totalKg.toFixed(2));
  recyclableKg = Number(recyclableKg.toFixed(2));
  hazardousKg = Number(hazardousKg.toFixed(2));
  organicKg = Number(organicKg.toFixed(2));

  const recyclablePct = totalKg > 0 ? Number(((recyclableKg / totalKg) * 100).toFixed(1)) : 0;
  const hazardousPct = totalKg > 0 ? Number(((hazardousKg / totalKg) * 100).toFixed(1)) : 0;
  const organicPct = totalKg > 0 ? Number(((organicKg / totalKg) * 100).toFixed(1)) : 0;

  // Build dual-case subcategories map
  const subcategories = {
    Plastic: Number((subcatSums.plastic || 0).toFixed(2)),
    Paper: Number((subcatSums.paper || 0).toFixed(2)),
    Aluminium: Number((subcatSums.aluminium || 0).toFixed(2)),
    Steel: Number((subcatSums.steel || 0).toFixed(2)),
    Rubber: Number((subcatSums.rubber || 0).toFixed(2)),
    'Used Oil': Number((subcatSums['used oil'] || 0).toFixed(2)),
    'Chemical Bottles': Number((subcatSums['chemical bottles'] || 0).toFixed(2)),
    'Food Waste': Number((subcatSums['food waste'] || 0).toFixed(2)),
    // Lowercase mirrors
    plastic: Number((subcatSums.plastic || 0).toFixed(2)),
    paper: Number((subcatSums.paper || 0).toFixed(2)),
    aluminium: Number((subcatSums.aluminium || 0).toFixed(2)),
    steel: Number((subcatSums.steel || 0).toFixed(2)),
    rubber: Number((subcatSums.rubber || 0).toFixed(2)),
    'used oil': Number((subcatSums['used oil'] || 0).toFixed(2)),
    'chemical bottles': Number((subcatSums['chemical bottles'] || 0).toFixed(2)),
    'food waste': Number((subcatSums['food waste'] || 0).toFixed(2)),
  };

  const byCategory = {
    recyclable: {
      totalKg: recyclableKg,
      percentage: recyclablePct,
      subcategories: {
        Plastic: subcategories.Plastic,
        Paper: subcategories.Paper,
        Aluminium: subcategories.Aluminium,
        Steel: subcategories.Steel,
        Rubber: subcategories.Rubber,
      },
    },
    hazardous: {
      totalKg: hazardousKg,
      percentage: hazardousPct,
      subcategories: {
        'Used Oil': subcategories['Used Oil'],
        'Chemical Bottles': subcategories['Chemical Bottles'],
      },
    },
    organic: {
      totalKg: organicKg,
      percentage: organicPct,
      subcategories: {
        'Food Waste': subcategories['Food Waste'],
      },
    },
  };

  const periods = Array.from(periodMap.values())
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((p) => ({
      period: p.period,
      totalKg: Number(p.totalKg.toFixed(2)),
      recyclableKg: Number(p.recyclableKg.toFixed(2)),
      hazardousKg: Number(p.hazardousKg.toFixed(2)),
      organicKg: Number(p.organicKg.toFixed(2)),
    }));

  return {
    hasData: totalKg > 0 || records.length > 0,
    totalKg,
    recyclableKg,
    hazardousKg,
    organicKg,
    recyclablePct,
    hazardousPct,
    organicPct,
    subcategories,
    byCategory,
    periods,
    recordsCount: records.length,
  };
};

module.exports = {
  getWasteSummary,
  STANDARD_SUBCATEGORIES,
};

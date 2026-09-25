/**
 * GreenPulse AI — Header Normalization Utility
 *
 * Deterministic mapping of diverse spreadsheet column headers to canonical domain keys.
 * Header matching is:
 * - case-insensitive
 * - whitespace-trimmed
 * - tolerant of `_`, `-`, and spaces
 *
 * Supported Canonical Keys:
 * - kwhUsed: Energy consumption
 * - wasteItem: Waste material/item
 * - quantityKg: Waste weight/quantity
 * - department: Operational facility/department
 * - period: Reporting timeframe (YYYY-MM)
 */

const CANONICAL_HEADER_MAP = {
  kwhUsed: [
    'kwhused',
    'kwh',
    'electricitykwh',
    'electricityconsumption',
    'electricityconsumed',
    'energyconsumed',
    'energyconsumption',
    'energykwh',
    'consumptionkwh',
    'consumption',
    'powerused',
    'powerkwh',
    'power',
    'electricenergy',
    'electricityusedkwh',
    'electricityused',
    'electricityused(kwh)',
  ],
  wasteItem: [
    'wasteitem',
    'wastematerial',
    'scraptype',
    'wastetype',
    'waste',
    'scrap',
    'item',
    'material',
  ],
  wasteCategory: [
    'wastecategory',
    'usercategory',
    'userwastecategory',
    'category',
    'subcategory',
    'type',
  ],
  quantityKg: [
    'quantitykg',
    'wastekg',
    'weightkg',
    'amountkg',
    'scrapkg',
    'wasteproducedkg',
    'wasteproduced',
    'wasteproduced(kg)',
    'quantity',
    'weight',
    'amount',
    'kg',
  ],
  department: [
    'department',
    'departmentname',
    'dept',
    'deptname',
    'departmentid',
    'deptid',
    'section',
    'sectionname',
    'unit',
    'unitname',
    'facility',
    'facilityname',
    'division',
    'divisionname',
  ],
  period: [
    'period',
    'reportingperiod',
    'billingperiod',
    'month',
    'monthyear',
    'yearmonth',
    'date',
    'timeframe',
  ],
  fuelType: [
    'fueltype',
    'fuel',
    'fuelname',
    'typeoffuel',
    'fuelcategory',
    'fuelkind',
  ],
  fuelQuantity: [
    'fuelconsumption',
    'fuelquantity',
    'fuelqty',
    'fuelconsumed',
    'fuelamount',
    'fuelvolume',
    'fuelused',
    'fuelvol',
  ],
  fuelUnit: [
    'fuelunit',
    'fueluom',
    'fuelmeasure',
    'unit',
    'uom',
    'unitofmeasure',
  ],
};

// Build fast lookup Map: cleaned lowercase alias -> canonical field name
const ALIAS_LOOKUP = new Map();
for (const [canonical, aliases] of Object.entries(CANONICAL_HEADER_MAP)) {
  for (const alias of aliases) {
    ALIAS_LOOKUP.set(alias, canonical);
  }
}

/**
 * Clean a header key string: trim, lowercase, remove spaces, underscores, hyphens, and parentheses
 * @param {string} rawHeader
 * @returns {string}
 */
const cleanHeaderKey = (rawHeader) => {
  if (typeof rawHeader !== 'string') return '';
  return rawHeader.trim().toLowerCase().replace(/[\s\-_()]+/g, '');
};

/**
 * Normalize a single header key to its canonical form
 * @param {string} rawHeader
 * @returns {string} Canonical key if recognized, or trimmed rawHeader
 */
const normalizeHeader = (rawHeader) => {
  if (typeof rawHeader !== 'string') return rawHeader;
  const cleaned = cleanHeaderKey(rawHeader);
  const matched = ALIAS_LOOKUP.get(cleaned);
  return matched || rawHeader.trim();
};

/**
 * Normalize all headers of a raw row object
 * @param {object} rawRow
 * @returns {object} Normalized row with canonical keys
 */
const normalizeRowHeaders = (rawRow) => {
  if (!rawRow || typeof rawRow !== 'object') return {};
  const normalized = {};

  for (const [key, value] of Object.entries(rawRow)) {
    const canonicalKey = normalizeHeader(key);
    const val = typeof value === 'string' ? value.trim() : value;

    // Only assign if canonical key is not yet set or current value is empty
    if (normalized[canonicalKey] === undefined || normalized[canonicalKey] === null || normalized[canonicalKey] === '') {
      normalized[canonicalKey] = val;
    }
  }

  // Fallback alias resolution for wasteItem / wasteCategory:
  // If wasteItem is absent but wasteCategory is present (e.g. older files where header was "category"),
  // treat wasteCategory as the wasteItem.
  if (!normalized.wasteItem && normalized.wasteCategory) {
    normalized.wasteItem = normalized.wasteCategory;
  }
  // Backwards compatibility for code checking normalized.category
  if (!normalized.category && normalized.wasteCategory) {
    normalized.category = normalized.wasteCategory;
  } else if (!normalized.category && normalized.wasteItem) {
    normalized.category = normalized.wasteItem;
  }

  // Fallback alias resolution for fuel columns
  if (normalized.fuelType) {
    // Only borrow quantityKg if this row does NOT contain a separate waste item
    if (!normalized.fuelQuantity && normalized.quantityKg !== undefined && !normalized.wasteItem) {
      normalized.fuelQuantity = normalized.quantityKg;
    }
    if (!normalized.fuelUnit) {
      for (const [k, v] of Object.entries(rawRow)) {
        const cleanedK = cleanHeaderKey(k);
        if (cleanedK === 'unit' || cleanedK === 'uom' || cleanedK === 'fuelunit') {
          normalized.fuelUnit = typeof v === 'string' ? v.trim() : v;
          break;
        }
      }
    }
  }

  return normalized;
};

module.exports = {
  CANONICAL_HEADER_MAP,
  cleanHeaderKey,
  normalizeHeader,
  normalizeRowHeaders,
};

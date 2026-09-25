/**
 * GreenPulse AI — Deterministic Waste Classification Engine
 *
 * Lightweight, zero-external-dependency keyword classification system.
 * Normalizes input (case-insensitive, whitespace-collapsed) and matches
 * against verified industrial material taxonomy.
 *
 * Taxonomy:
 * - Recyclable: Plastic, Paper, Aluminium, Steel, Rubber
 * - Hazardous: Used Oil, Chemical Bottles
 * - Organic: Food Waste
 */

const WASTE_TAXONOMY = [
  // Recyclable
  { keyword: 'plastic', category: 'recyclable', subcategory: 'plastic', displaySubcategory: 'Plastic' },
  { keyword: 'paper', category: 'recyclable', subcategory: 'paper', displaySubcategory: 'Paper' },
  { keyword: 'aluminium', category: 'recyclable', subcategory: 'aluminium', displaySubcategory: 'Aluminium' },
  { keyword: 'aluminum', category: 'recyclable', subcategory: 'aluminium', displaySubcategory: 'Aluminium' }, // Alternate spelling
  { keyword: 'steel', category: 'recyclable', subcategory: 'steel', displaySubcategory: 'Steel' },
  { keyword: 'rubber', category: 'recyclable', subcategory: 'rubber', displaySubcategory: 'Rubber' },

  // Hazardous
  { keyword: 'used oil', category: 'hazardous', subcategory: 'used oil', displaySubcategory: 'Used Oil' },
  { keyword: 'chemical bottles', category: 'hazardous', subcategory: 'chemical bottles', displaySubcategory: 'Chemical Bottles' },

  // Organic
  { keyword: 'food waste', category: 'organic', subcategory: 'food waste', displaySubcategory: 'Food Waste' },
];

const TAXONOMY_MAP = new Map();
WASTE_TAXONOMY.forEach((item) => {
  TAXONOMY_MAP.set(item.keyword, item);
});

const { normalizeWasteItem } = require('../../utils/textNormalizer');

/**
 * Normalize raw input string: trim, collapse internal whitespace, and lowercase
 * @param {string} str
 * @returns {string}
 */
const normalizeText = (str) => {
  return normalizeWasteItem(str);
};

/**
 * Classify a waste item deterministically
 * @param {string} rawItem
 * @returns {{ valid: boolean, rawWasteItem?: string, matchedKeyword?: string, category?: string, subcategory?: string, displaySubcategory?: string, error?: string }}
 */
const classifyWasteItem = (rawItem) => {
  if (rawItem === undefined || rawItem === null) {
    return { valid: false, error: 'Waste item is required' };
  }

  const str = String(rawItem).trim();
  if (!str) {
    return { valid: false, error: 'Waste item cannot be empty' };
  }

  const normalized = normalizeText(str);
  const match = TAXONOMY_MAP.get(normalized);

  if (!match) {
    return {
      valid: false,
      error: `Unknown waste keyword '${str}'. Must be one of: Plastic, Paper, Aluminium, Steel, Rubber, Used Oil, Chemical Bottles, Food Waste`,
    };
  }

  return {
    valid: true,
    rawWasteItem: str,
    matchedKeyword: match.keyword,
    category: match.category,
    subcategory: match.subcategory,
    displaySubcategory: match.displaySubcategory,
  };
};

module.exports = {
  classifyWasteItem,
  normalizeText,
  WASTE_TAXONOMY,
};

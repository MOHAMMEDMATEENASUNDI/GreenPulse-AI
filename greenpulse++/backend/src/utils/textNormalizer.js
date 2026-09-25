/**
 * GreenPulse AI — Text Normalization Utility
 * Deterministic lowercasing, whitespace collapsing, and separator normalization.
 */

/**
 * Normalize department name or general entity string to canonical lowercase representation
 * Rules:
 * 1. Convert to string
 * 2. Trim leading/trailing whitespace
 * 3. Treat hyphens and underscores as space separators
 * 4. Collapse repeated internal whitespace
 * 5. Convert to lowercase
 *
 * Examples:
 *   'Paint Shop'    -> 'paint shop'
 *   'PAINT SHOP'    -> 'paint shop'
 *   'Paint   Shop'  -> 'paint shop'
 *   'PAINT-SHOP'    -> 'paint shop'
 *   'paint_shop'    -> 'paint shop'
 *   '  Paint Shop ' -> 'paint shop'
 *   'PaInT ShOp'    -> 'paint shop'
 *
 * @param {string|any} val
 * @returns {string}
 */
const normalizeDepartmentName = (val) => {
  if (val === undefined || val === null) return '';
  return String(val)
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

/**
 * Normalize waste keyword or text string
 * @param {string|any} val
 * @returns {string}
 */
const normalizeWasteItem = (val) => {
  if (val === undefined || val === null) return '';
  return String(val)
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

module.exports = {
  normalizeDepartmentName,
  normalizeWasteItem,
};

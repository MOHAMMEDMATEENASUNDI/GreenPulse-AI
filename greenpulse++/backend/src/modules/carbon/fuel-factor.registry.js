/**
 * GreenPulse AI — Fuel Emission Factor Registry
 * Standardized GHG factors for direct combustion (Scope 1)
 * and upstream extraction/refining/transport (Scope 3 Category 3: Upstream Fuel & Energy).
 *
 * Source: UK Government GHG Conversion Factors (DEFRA 2024) / IPCC 2006 Guidelines
 * Version: DEFRA-2024 / IPCC
 */

const FUEL_FACTORS = {
  diesel: {
    canonicalName: 'Diesel',
    factorScope1: 2.68787, // kg CO2e per litre (direct fuel combustion)
    factorScope3: 0.58988, // kg CO2e per litre (WTT - well-to-tank upstream supply)
    defaultUnit: 'litre',
    acceptedUnits: ['litre', 'litres', 'liter', 'liters', 'l'],
    version: 'DEFRA-2024 / IPCC',
    description: '100% mineral diesel stationary/mobile combustion',
  },
  petrol: {
    canonicalName: 'Petrol/Gasoline',
    factorScope1: 2.31440, // kg CO2e per litre (direct combustion)
    factorScope3: 0.58434, // kg CO2e per litre (WTT upstream)
    defaultUnit: 'litre',
    acceptedUnits: ['litre', 'litres', 'liter', 'liters', 'l'],
    version: 'DEFRA-2024 / IPCC',
    description: 'Motor gasoline / petrol combustion',
  },
  lpg: {
    canonicalName: 'LPG',
    factorScope1: 1.55709, // kg CO2e per litre (direct combustion)
    factorScope3: 0.21980, // kg CO2e per litre (WTT upstream)
    defaultUnit: 'litre',
    acceptedUnits: ['litre', 'litres', 'liter', 'liters', 'l', 'kg', 'kgs', 'kilogram'],
    unitFactors: {
      litre: { scope1: 1.55709, scope3: 0.21980 },
      kg: { scope1: 2.93910, scope3: 0.41470 },
    },
    version: 'DEFRA-2024 / IPCC',
    description: 'Liquefied Petroleum Gas combustion',
  },
  natural_gas: {
    canonicalName: 'Natural Gas',
    factorScope1: 2.02266, // kg CO2e per m3 / SCM (direct combustion)
    factorScope3: 0.25413, // kg CO2e per m3 / SCM (WTT upstream)
    defaultUnit: 'm3',
    acceptedUnits: ['m3', 'm³', 'scm', 'cubic_meter', 'cubic_meters'],
    version: 'DEFRA-2024 / IPCC',
    description: 'Natural gas combustion per standard cubic meter',
  },
};

// Aliases mapping to canonical keys
const FUEL_ALIASES = {
  diesel: 'diesel',
  hsd: 'diesel',
  petrol: 'petrol',
  gasoline: 'petrol',
  gas: 'natural_gas',
  naturalgas: 'natural_gas',
  natural_gas: 'natural_gas',
  cng: 'natural_gas',
  png: 'natural_gas',
  lpg: 'lpg',
  autogas: 'lpg',
};

const UNIT_ALIASES = {
  litre: 'litre',
  litres: 'litre',
  liter: 'litre',
  liters: 'litre',
  l: 'litre',
  kg: 'kg',
  kgs: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  m3: 'm3',
  'm³': 'm3',
  scm: 'm3',
  cubic_meter: 'm3',
  cubic_meters: 'm3',
};

/**
 * Normalize raw fuel type to canonical key
 * @param {string} raw
 * @returns {string|null}
 */
const normalizeFuelType = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase().replace(/[\s\-_/]+/g, '');
  return FUEL_ALIASES[cleaned] || null;
};

/**
 * Normalize raw unit string
 * @param {string} raw
 * @returns {string|null}
 */
const normalizeFuelUnit = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase().replace(/[\s\-_]+/g, '');
  return UNIT_ALIASES[cleaned] || null;
};

/**
 * Validate and get factors for a fuel type and unit
 * @param {string} rawFuelType
 * @param {string} rawUnit
 * @returns {{ valid: boolean, error?: string, fuelInfo?: object }}
 */
const getFuelFactors = (rawFuelType, rawUnit) => {
  const canonicalType = normalizeFuelType(rawFuelType);
  if (!canonicalType || !FUEL_FACTORS[canonicalType]) {
    return {
      valid: false,
      error: `Unsupported fuel type '${rawFuelType}'. Supported fuels: Diesel, Petrol/Gasoline, LPG, Natural Gas`,
    };
  }

  const fuelConfig = FUEL_FACTORS[canonicalType];
  const canonicalUnit = normalizeFuelUnit(rawUnit);

  if (!canonicalUnit || !fuelConfig.acceptedUnits.includes(canonicalUnit)) {
    return {
      valid: false,
      error: `Invalid unit '${rawUnit}' for ${fuelConfig.canonicalName}. Accepted units: ${fuelConfig.acceptedUnits.slice(0, 3).join(', ')}`,
    };
  }

  let factorScope1 = fuelConfig.factorScope1;
  let factorScope3 = fuelConfig.factorScope3;

  if (fuelConfig.unitFactors && fuelConfig.unitFactors[canonicalUnit]) {
    factorScope1 = fuelConfig.unitFactors[canonicalUnit].scope1;
    factorScope3 = fuelConfig.unitFactors[canonicalUnit].scope3;
  }

  return {
    valid: true,
    fuelInfo: {
      canonicalType,
      displayName: fuelConfig.canonicalName,
      unit: canonicalUnit,
      factorScope1,
      factorScope3,
      version: fuelConfig.version,
    },
  };
};

/**
 * Pure calculation function: compute Scope 1 and supported Scope 3 emissions
 * @param {string} fuelType
 * @param {number} quantity
 * @param {string} unit
 */
const calculateFuelEmissions = (fuelType, quantity, unit) => {
  const result = getFuelFactors(fuelType, unit);
  if (!result.valid) {
    throw new Error(result.error);
  }

  const qty = Math.max(0, Number(quantity) || 0);
  const scope1Kg = Number((qty * result.fuelInfo.factorScope1).toFixed(4));
  const scope3Kg = Number((qty * result.fuelInfo.factorScope3).toFixed(4));

  return {
    co2eScope1: scope1Kg,
    co2eScope3: scope3Kg,
    factorScope1: result.fuelInfo.factorScope1,
    factorScope3: result.fuelInfo.factorScope3,
    factorVersion: result.fuelInfo.version,
    fuelType: result.fuelInfo.canonicalType,
    fuelUnit: result.fuelInfo.unit,
  };
};

module.exports = {
  FUEL_FACTORS,
  normalizeFuelType,
  normalizeFuelUnit,
  getFuelFactors,
  calculateFuelEmissions,
};

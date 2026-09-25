const { z } = require('zod');
const { classifyWasteItem } = require('../waste/waste.classifier');

const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Preprocess period string to canonical YYYY-MM format
 * Accepts: YYYY-MM, YYYY/MM, YYYY-MM-DD, YYYY/MM/DD, YYYY-M
 */
const preprocessPeriod = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).trim();

  // If YYYY-M format, e.g. 2026-7 -> 2026-07
  const shortMatch = str.match(/^(\d{4})[/-]([1-9])$/);
  if (shortMatch) {
    return `${shortMatch[1]}-0${shortMatch[2]}`;
  }

  // If YYYY/MM format, e.g. 2026/07 -> 2026-07
  const slashMatch = str.match(/^(\d{4})\/(0[1-9]|1[0-2])$/);
  if (slashMatch) {
    return `${slashMatch[1]}-${slashMatch[2]}`;
  }

  // If YYYY-MM-DD or YYYY/MM/DD date format, extract YYYY-MM
  const dateMatch = str.match(/^(\d{4})[-/](0[1-9]|1[0-2])[-/]\d{2}/);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}`;
  }

  return str;
};

const energyRowSchema = z.object({
  department: z.preprocess((val) => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  }, z.string({ required_error: 'Department is required' }).min(1, 'Department cannot be empty')),
  period: z.preprocess(
    preprocessPeriod,
    z
      .string({ required_error: 'Period is required' })
      .trim()
      .regex(periodRegex, 'Period must be in YYYY-MM format (e.g. 2026-07)')
  ),
  kwhUsed: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const str = String(val).trim();
    if (str === '') return undefined;
    const num = Number(str);
    return Number.isNaN(num) ? NaN : num;
  }, z.number({ required_error: 'kWh used is required', invalid_type_error: 'kWh used must be a number' })
     .refine((n) => !Number.isNaN(n), { message: 'kWh used must be a valid number' })
     .refine((n) => n >= 0, { message: 'kWh used cannot be negative' })),
});

const wasteRowSchema = z.object({
  department: z.preprocess((val) => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  }, z.string({ required_error: 'Department is required' }).min(1, 'Department cannot be empty')),
  period: z.preprocess(
    preprocessPeriod,
    z
      .string({ required_error: 'Period is required' })
      .trim()
      .regex(periodRegex, 'Period must be in YYYY-MM format (e.g. 2026-07)')
  ),
  quantityKg: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const str = String(val).trim();
    if (str === '') return undefined;
    const num = Number(str);
    return Number.isNaN(num) ? NaN : num;
  }, z.number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
     .refine((n) => !Number.isNaN(n), { message: 'Quantity must be a valid number' })
     .refine((n) => n >= 0, { message: 'Quantity cannot be negative' })),
  wasteItem: z.string({ required_error: 'Waste item is required' })
    .trim()
    .min(1, 'Waste item cannot be empty')
    .refine((val) => classifyWasteItem(val).valid, (val) => ({
      message: classifyWasteItem(val).error || `Unknown waste keyword '${val}'`,
    })),
});

const { getFuelFactors, normalizeFuelType } = require('../carbon/fuel-factor.registry');

const fuelRowSchema = z
  .object({
    department: z.preprocess((val) => {
      if (val === undefined || val === null) return '';
      return String(val).trim();
    }, z.string({ required_error: 'Department is required' }).min(1, 'Department cannot be empty')),
    period: z.preprocess(
      preprocessPeriod,
      z
        .string({ required_error: 'Period is required' })
        .trim()
        .regex(periodRegex, 'Period must be in YYYY-MM format (e.g. 2026-07)')
    ),
    fuelType: z.preprocess((val) => {
      if (val === undefined || val === null) return '';
      return String(val).trim();
    }, z.string({ required_error: 'Fuel type is required' }).min(1, 'Fuel type cannot be empty')),
    fuelQuantity: z.preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const str = String(val).trim();
      if (str === '') return undefined;
      const num = Number(str);
      return Number.isNaN(num) ? NaN : num;
    }, z.number({ required_error: 'Fuel quantity is required', invalid_type_error: 'Fuel quantity must be a number' })
       .refine((n) => !Number.isNaN(n), { message: 'Fuel quantity must be a valid number' })
       .refine((n) => n >= 0, { message: 'Fuel quantity cannot be negative' })),
    fuelUnit: z.preprocess((val) => {
      if (val === undefined || val === null) return '';
      return String(val).trim();
    }, z.string({ required_error: 'Fuel unit is required' }).min(1, 'Fuel unit cannot be empty')),
  })
  .superRefine((data, ctx) => {
    const check = getFuelFactors(data.fuelType, data.fuelUnit);
    if (!check.valid) {
      const canonicalType = normalizeFuelType(data.fuelType);
      if (!canonicalType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fuelType'],
          message: check.error,
        });
      } else {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fuelUnit'],
          message: check.error,
        });
      }
    }
  });

module.exports = {
  energyRowSchema,
  wasteRowSchema,
  fuelRowSchema,
  periodRegex,
  preprocessPeriod,
  classifyWasteItem,
};

const { z } = require('zod');
const { VALID_REPORT_TYPES } = require('./report.config');

const createReportSchema = {
  body: z.object({
    reportType: z.enum(VALID_REPORT_TYPES, {
      errorMap: () => ({
        message: `reportType must be one of: ${VALID_REPORT_TYPES.join(', ')}`,
      }),
    }),
    period: z
      .string({ required_error: 'period is required' })
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'period must be in exact YYYY-MM format (e.g. 2026-03)'),
  }),
};

module.exports = {
  createReportSchema,
};

const { z } = require('zod');

const addEvidenceSchema = {
  params: z.object({
    principleNumber: z.coerce
      .number({ invalid_type_error: 'Principle number must be an integer between 1 and 9' })
      .int('Principle number must be an integer')
      .min(1, 'Principle number must be between 1 and 9')
      .max(9, 'Principle number must be between 1 and 9'),
  }),
  body: z.object({
    evidenceType: z.literal('demo', {
      errorMap: () => ({ message: 'evidenceType must be "demo"' }),
    }).default('demo'),
    evidenceItems: z
      .array(
        z.object({
          name: z.string().trim().min(1, 'Evidence item name is required and cannot be empty'),
          reference: z.string().trim().min(1, 'Evidence item reference is required and cannot be empty'),
          targetGap: z.string().optional(),
        })
      )
      .min(1, 'At least one evidence item is required'),
  }),
};

module.exports = {
  addEvidenceSchema,
};

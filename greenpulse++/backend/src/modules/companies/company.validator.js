const { z } = require('zod');

const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Company name cannot be empty').optional(),
    industry: z.string().trim().min(1, 'Industry cannot be empty').optional(),
    brsrStatus: z
      .enum(['mandatory', 'voluntary', 'in_scope', 'exempt'], {
        errorMap: () => ({ message: "BRSR status must be 'mandatory', 'voluntary', 'in_scope', or 'exempt'" }),
      })
      .optional(),
  }),
});

module.exports = {
  updateCompanySchema,
};

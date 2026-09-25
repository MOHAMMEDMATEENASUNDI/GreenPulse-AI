const { z } = require('zod');

const updateStatusSchema = z.object({
  status: z.enum(['approved', 'dismissed'], {
    required_error: 'Status is required and must be either "approved" or "dismissed"',
  }),
});

const rawRecommendationItemSchema = z.object({
  action: z.string().min(5).max(300),
  category: z.enum(['energy_efficiency', 'waste_reduction', 'renewable_transition', 'operational_optimization']),
  estimatedCostSavingsINR: z.number().nonnegative(),
  estimatedCO2ReductionKg: z.number().nonnegative(),
  implementationEffort: z.enum(['low', 'medium', 'high']),
  geminiImpactScore: z.number().min(0).max(100),
});

const geminiResponseSchema = z.object({
  recommendations: z.array(rawRecommendationItemSchema).min(1).max(5),
});

module.exports = {
  updateStatusSchema,
  rawRecommendationItemSchema,
  geminiResponseSchema,
};

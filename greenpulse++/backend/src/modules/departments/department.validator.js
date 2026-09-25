const { z } = require('zod');

const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Department name is required' }).trim().min(1, 'Department name cannot be empty'),
    type: z.string().trim().min(1, 'Department type cannot be empty').optional().default('operations'),
  }),
});

const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Department name cannot be empty').optional(),
    type: z.string().trim().min(1, 'Department type cannot be empty').optional(),
  }),
});

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
};

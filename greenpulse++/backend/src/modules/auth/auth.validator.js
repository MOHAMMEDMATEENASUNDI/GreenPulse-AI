const { z } = require('zod');

const signupSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    role: z
      .enum(['admin', 'facility_manager', 'auditor'], {
        errorMap: () => ({ message: "Role must be 'admin', 'facility_manager', or 'auditor'" }),
      })
      .optional()
      .default('facility_manager'),
    company: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
};

const { ZodError } = require('zod');
const { sendError } = require('../utils/responseEnvelope');

/**
 * Middleware factory for request validation using Zod schemas
 * Supports:
 *  - Plain object: { body?: ZodSchema, params?: ZodSchema, query?: ZodSchema }
 *  - Zod object with body/params/query shapes
 *  - Direct Zod schema for req.body
 */
const validate = (schema) => async (req, res, next) => {
  try {
    // Case 1: Plain object with body/params/query properties
    if (!(schema._def) && (schema.body || schema.params || schema.query)) {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      return next();
    }

    // Case 2: Zod object schema containing body, params, or query shape
    if (schema._def && schema.shape && (schema.shape.body || schema.shape.params || schema.shape.query)) {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) req.params = parsed.params;
      if (parsed.query !== undefined) req.query = parsed.query;
      return next();
    }

    // Case 3: Direct schema for req.body
    if (typeof schema.parseAsync === 'function') {
      req.body = await schema.parseAsync(req.body);
      return next();
    }

    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((e) => {
        // Strip leading 'body.' if present for clean client-friendly field names
        let field = e.path.join('.');
        if (field.startsWith('body.')) {
          field = field.slice(5);
        }
        return {
          field: field || 'body',
          message: e.message,
        };
      });
      return sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed', details);
    }
    return next(error);
  }
};

module.exports = validate;

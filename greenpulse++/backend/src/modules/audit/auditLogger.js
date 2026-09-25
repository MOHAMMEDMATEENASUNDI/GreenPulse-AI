const { AuditLog } = require('./audit-log.model');
const logger = require('../../lib/logger');

/**
 * Persist an audit log event safely without impacting primary business operations
 *
 * @param {Object} params
 * @param {import('mongoose').Types.ObjectId|string} params.companyId
 * @param {import('mongoose').Types.ObjectId|string} params.actorId
 * @param {string} params.action
 * @returns {Promise<import('./audit-log.model').AuditLog|null>}
 */
const logAuditEvent = async ({ companyId, actorId, action }) => {
  try {
    if (!companyId || !action) {
      logger.warn(
        { companyId, actorId, action },
        'Audit event skipped: missing companyId or action'
      );
      return null;
    }

    const doc = await AuditLog.create({
      companyId,
      actorId: actorId || companyId,
      action,
      timestamp: new Date(),
    });

    logger.info(
      { auditId: doc._id, action, companyId: companyId.toString() },
      'Audit event recorded successfully'
    );

    return doc;
  } catch (err) {
    // Failure isolation: log error with full context without crashing primary user transaction
    logger.error(
      { err: err.message, stack: err.stack, companyId, actorId, action },
      'Failed to record audit event'
    );
    return null;
  }
};

module.exports = {
  logAuditEvent,
};

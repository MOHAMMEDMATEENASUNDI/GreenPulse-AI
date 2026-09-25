const recommendationService = require('./recommendation.service');
const { updateStatusSchema } = require('./recommendation.validator');
const { sendSuccess } = require('../../utils/responseEnvelope');
const { logAuditEvent } = require('../audit/auditLogger');

/**
 * GET /api/v1/recommendations
 * List recommendations for authenticated company
 */
const getRecommendationsHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const { status } = req.query;

    const recommendations = await recommendationService.getRecommendations(companyId, { status });

    return sendSuccess(res, 200, { recommendations });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/recommendations/:id
 * Update recommendation status to approved or dismissed
 */
const updateRecommendationStatusHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const actorId = req.user.id || req.user.userId || req.user._id;
    const { id } = req.params;

    const validatedBody = updateStatusSchema.parse(req.body);
    const updated = await recommendationService.updateRecommendationStatus(
      companyId,
      id,
      validatedBody.status
    );

    if (validatedBody.status === 'approved') {
      await logAuditEvent({
        companyId,
        actorId,
        action: 'recommendation.approved',
      });
    } else if (validatedBody.status === 'dismissed') {
      await logAuditEvent({
        companyId,
        actorId,
        action: 'recommendation.dismissed',
      });
    }

    return sendSuccess(res, 200, { recommendation: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendationsHandler,
  updateRecommendationStatusHandler,
};

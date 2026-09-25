const carbonService = require('./carbon.service');
const { sendSuccess, sendError } = require('../../utils/responseEnvelope');

/**
 * GET /api/v1/carbon/summary
 */
const getCarbonSummary = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const summary = await carbonService.getCarbonSummary(companyId);

  return sendSuccess(res, 200, summary);
};

/**
 * GET /api/v1/carbon/departments/:id
 */
const getDepartmentCarbon = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const { id } = req.params;

  const result = await carbonService.getDepartmentCarbon(companyId, id);
  if (!result) {
    return sendError(res, 404, 'NOT_FOUND', 'Department not found');
  }

  return sendSuccess(res, 200, result);
};

module.exports = {
  getCarbonSummary,
  getDepartmentCarbon,
};

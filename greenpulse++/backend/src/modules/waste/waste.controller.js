/**
 * GreenPulse AI — Waste Controller
 */

const wasteService = require('./waste.service');
const { sendSuccess } = require('../../utils/responseEnvelope');

/**
 * GET /api/v1/waste/summary
 * Company-scoped authenticated endpoint returning real waste metrics
 */
const getWasteSummary = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const summary = await wasteService.getWasteSummary(companyId);

  return sendSuccess(res, 200, summary);
};

module.exports = {
  getWasteSummary,
};

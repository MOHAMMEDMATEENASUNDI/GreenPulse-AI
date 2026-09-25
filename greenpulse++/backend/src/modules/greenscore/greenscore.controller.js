const greenScoreService = require('./greenscore.service');
const { sendSuccess } = require('../../utils/responseEnvelope');

/**
 * GET /api/v1/greenscore
 */
const getGreenScore = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const result = await greenScoreService.getLatestGreenScore(companyId);

  return sendSuccess(res, 200, result);
};

module.exports = {
  getGreenScore,
};

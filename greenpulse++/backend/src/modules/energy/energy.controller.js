const energyService = require('./energy.service');
const { sendSuccess, sendError } = require('../../utils/responseEnvelope');

/**
 * GET /api/v1/energy/usage
 * Get company energy usage history
 */
const getEnergyUsageHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const { departmentId, period } = req.query;

    const usage = await energyService.getEnergyUsage(companyId, { departmentId, period });

    return sendSuccess(res, 200, { usage });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/energy/anomalies
 * Get company detected energy anomalies
 */
const getEnergyAnomaliesHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const { severity, departmentId, period } = req.query;

    const anomalies = await energyService.getEnergyAnomalies(companyId, {
      severity,
      departmentId,
      period,
    });

    return sendSuccess(res, 200, { anomalies });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEnergyUsageHandler,
  getEnergyAnomaliesHandler,
};

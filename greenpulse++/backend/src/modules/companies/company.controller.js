const companyService = require('./company.service');
const { sendSuccess } = require('../../utils/responseEnvelope');

/**
 * GET /api/v1/companies/me
 */
const getMe = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const company = await companyService.getCompanyById(companyId);

  return sendSuccess(res, 200, { company });
};

/**
 * PATCH /api/v1/companies/me
 */
const updateMe = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const updatedCompany = await companyService.updateCompany(companyId, req.body);

  return sendSuccess(res, 200, { company: updatedCompany });
};

module.exports = {
  getMe,
  updateMe,
};

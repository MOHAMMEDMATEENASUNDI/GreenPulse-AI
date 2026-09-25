const Company = require('./company.model');
const AppError = require('../../utils/AppError');

/**
 * Get company by ID
 */
const getCompanyById = async (companyId) => {
  if (!companyId) {
    throw new AppError('No company associated with this account', 404, 'COMPANY_NOT_FOUND');
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  }

  return company;
};

/**
 * Update company by ID
 */
const updateCompany = async (companyId, updateData) => {
  if (!companyId) {
    throw new AppError('No company associated with this account', 404, 'COMPANY_NOT_FOUND');
  }

  const allowedUpdates = {};
  if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
  if (updateData.industry !== undefined) allowedUpdates.industry = updateData.industry;
  if (updateData.brsrStatus !== undefined) allowedUpdates.brsrStatus = updateData.brsrStatus;

  const company = await Company.findByIdAndUpdate(
    companyId,
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  );

  if (!company) {
    throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  }

  return company;
};

/**
 * Create default company
 */
const createDefaultCompany = async ({ name = 'Default Organization', industry = 'General', brsrStatus = 'voluntary' } = {}) => {
  const company = new Company({
    name,
    industry,
    brsrStatus,
  });
  return await company.save();
};

module.exports = {
  getCompanyById,
  updateCompany,
  createDefaultCompany,
};

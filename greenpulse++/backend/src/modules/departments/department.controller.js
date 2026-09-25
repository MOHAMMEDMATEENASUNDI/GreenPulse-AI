const departmentService = require('./department.service');
const { sendSuccess } = require('../../utils/responseEnvelope');

/**
 * GET /api/v1/departments
 */
const getDepartments = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const departments = await departmentService.getDepartments(companyId);

  return sendSuccess(res, 200, { departments }, { count: departments.length });
};

/**
 * POST /api/v1/departments
 */
const createDepartment = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const department = await departmentService.createDepartment(companyId, req.body);

  return sendSuccess(res, 201, { department });
};

/**
 * PATCH /api/v1/departments/:id
 */
const updateDepartment = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const department = await departmentService.updateDepartment(companyId, req.params.id, req.body);

  return sendSuccess(res, 200, { department });
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
};

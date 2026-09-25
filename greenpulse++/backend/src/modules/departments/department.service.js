const Department = require('./department.model');
const AppError = require('../../utils/AppError');
const { normalizeDepartmentName } = require('../../utils/textNormalizer');

/**
 * Escape special regex characters in a string
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Get all departments for a company
 */
const getDepartments = async (companyId) => {
  if (!companyId) {
    throw new AppError('No company associated with this account', 400, 'COMPANY_REQUIRED');
  }

  return await Department.find({ companyId }).sort({ name: 1 });
};

/**
 * Create a department for a company
 */
const createDepartment = async (companyId, { name, type = 'operations' }) => {
  if (!companyId) {
    throw new AppError('No company associated with this account', 400, 'COMPANY_REQUIRED');
  }

  const rawName = String(name || '').trim();
  if (!rawName) {
    throw new AppError('Department name cannot be empty', 400, 'DEPARTMENT_NAME_REQUIRED');
  }

  const normalized = normalizeDepartmentName(rawName);

  // Check if department with same normalized name already exists in this company
  const existing = await Department.findOne({
    companyId,
    $or: [
      { normalizedName: normalized },
      { name: { $regex: new RegExp(`^${escapeRegex(rawName)}$`, 'i') } },
    ],
  });
  if (existing) {
    throw new AppError(`Department '${rawName}' already exists for this company`, 409, 'DEPARTMENT_ALREADY_EXISTS');
  }

  const department = new Department({
    companyId,
    name: rawName,
    normalizedName: normalized,
    type: type ? type.trim() : 'operations',
  });

  return await department.save();
};

/**
 * Update a department scoped to company
 */
const updateDepartment = async (companyId, departmentId, { name, type }) => {
  if (!companyId) {
    throw new AppError('No company associated with this account', 400, 'COMPANY_REQUIRED');
  }

  const department = await Department.findOne({ _id: departmentId, companyId });
  if (!department) {
    throw new AppError('Department not found for this company', 404, 'DEPARTMENT_NOT_FOUND');
  }

  if (name !== undefined) {
    const rawName = String(name || '').trim();
    const normalized = normalizeDepartmentName(rawName);

    // Check uniqueness if renaming
    const existing = await Department.findOne({
      companyId,
      $or: [
        { normalizedName: normalized },
        { name: { $regex: new RegExp(`^${escapeRegex(rawName)}$`, 'i') } },
      ],
      _id: { $ne: departmentId },
    });
    if (existing) {
      throw new AppError(`Department '${rawName}' already exists for this company`, 409, 'DEPARTMENT_ALREADY_EXISTS');
    }
    department.name = rawName;
    department.normalizedName = normalized;
  }

  if (type !== undefined) {
    department.type = type.trim();
  }

  return await department.save();
};

/**
 * Resolve existing department by normalized lowercase name or create a new one for company
 * Company-scoped and duplicate-key race safe
 *
 * @param {string|import('mongoose').Types.ObjectId} companyId
 * @param {string} departmentName
 * @param {import('mongoose').ClientSession} [session]
 * @returns {Promise<Department>}
 */
const resolveOrCreateDepartment = async (companyId, departmentName, session = null) => {
  if (!companyId) {
    throw new AppError('No company associated with this account', 400, 'COMPANY_REQUIRED');
  }

  const rawName = String(departmentName || '').trim();
  if (!rawName) {
    throw new AppError('Department name cannot be empty', 400, 'DEPARTMENT_NAME_REQUIRED');
  }

  const normalized = normalizeDepartmentName(rawName);

  // 1. Check existing department using companyId + normalizedName (or fallback regex for legacy rows)
  let query = Department.findOne({
    companyId,
    $or: [
      { normalizedName: normalized },
      { name: { $regex: new RegExp(`^${escapeRegex(rawName)}$`, 'i') } },
    ],
  });
  if (session) query = query.session(session);

  let dept = await query;
  if (dept) {
    if (!dept.normalizedName) {
      dept.normalizedName = normalized;
      await dept.save({ session });
    }
    return dept;
  }

  // 2. Create new department if not found
  try {
    dept = new Department({
      companyId,
      name: rawName,
      normalizedName: normalized,
      type: 'operations',
    });
    await dept.save({ session });
    return dept;
  } catch (err) {
    if (err.code === 11000) {
      // Handled duplicate-key race: fetch the created department
      let retryQuery = Department.findOne({ companyId, normalizedName: normalized });
      if (session) retryQuery = retryQuery.session(session);
      dept = await retryQuery;
      if (dept) return dept;
    }
    throw err;
  }
};

/**
 * Backfill normalizedName for any existing departments lacking it
 */
const backfillNormalizedNames = async () => {
  try {
    const unnormalized = await Department.find({
      $or: [{ normalizedName: { $exists: false } }, { normalizedName: null }, { normalizedName: '' }],
    });
    for (const d of unnormalized) {
      d.normalizedName = normalizeDepartmentName(d.name);
      await d.save();
    }
    if (unnormalized.length > 0) {
      console.log(`[DepartmentService] Backfilled normalizedName for ${unnormalized.length} departments.`);
    }
  } catch (err) {
    console.warn('[DepartmentService] Warning during normalizedName backfill:', err.message);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  resolveOrCreateDepartment,
  backfillNormalizedNames,
};

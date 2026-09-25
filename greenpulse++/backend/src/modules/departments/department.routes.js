const express = require('express');
const departmentController = require('./department.controller');
const { createDepartmentSchema, updateDepartmentSchema } = require('./department.validator');
const { requireAuth } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(requireAuth);

router.get('/', catchAsync(departmentController.getDepartments));
router.post('/', validate(createDepartmentSchema), catchAsync(departmentController.createDepartment));
router.patch('/:id', validate(updateDepartmentSchema), catchAsync(departmentController.updateDepartment));

module.exports = router;

const express = require('express');
const companyController = require('./company.controller');
const { updateCompanySchema } = require('./company.validator');
const { requireAuth } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(requireAuth);

router.get('/me', catchAsync(companyController.getMe));
router.patch('/me', validate(updateCompanySchema), catchAsync(companyController.updateMe));

module.exports = router;

const express = require('express');
const carbonController = require('./carbon.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', catchAsync(carbonController.getCarbonSummary));
router.get('/departments/:id', catchAsync(carbonController.getDepartmentCarbon));

module.exports = router;

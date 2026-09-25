const express = require('express');
const reportController = require('./report.controller');
const { createReportSchema } = require('./report.validator');
const { requireAuth } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

// Fallback endpoint for local file streaming in development/test
router.get('/download-local', catchAsync(reportController.downloadLocalFile));

// Authenticated routes
router.use(requireAuth);

router.post('/', validate(createReportSchema), catchAsync(reportController.generateReport));
router.get('/', catchAsync(reportController.getReports));
router.get('/:id', catchAsync(reportController.getReportDetail));
router.get('/:id/download', catchAsync(reportController.getReportDownload));

module.exports = router;

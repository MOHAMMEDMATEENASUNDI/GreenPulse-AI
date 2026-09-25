const express = require('express');
const uploadController = require('./upload.controller');
const { uploadSingleFile } = require('./upload.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

// Allow public downloading of official template (available pre-auth and post-auth)
router.get('/template', catchAsync(uploadController.downloadTemplate));

router.use(requireAuth);

router.post('/', uploadSingleFile('file'), catchAsync(uploadController.uploadFile));
router.get('/jobs/:id', catchAsync(uploadController.getJobStatus));

module.exports = router;

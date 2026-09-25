const express = require('express');
const greenScoreController = require('./greenscore.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(requireAuth);

router.get('/', catchAsync(greenScoreController.getGreenScore));

module.exports = router;

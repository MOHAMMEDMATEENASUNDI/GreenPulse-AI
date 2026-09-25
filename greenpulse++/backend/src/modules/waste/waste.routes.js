/**
 * GreenPulse AI — Waste Routes
 */

const express = require('express');
const wasteController = require('./waste.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', catchAsync(wasteController.getWasteSummary));

module.exports = router;

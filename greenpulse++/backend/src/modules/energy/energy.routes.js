const express = require('express');
const energyController = require('./energy.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(requireAuth);

router.get('/usage', catchAsync(energyController.getEnergyUsageHandler));
router.get('/anomalies', catchAsync(energyController.getEnergyAnomaliesHandler));

module.exports = router;

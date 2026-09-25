const express = require('express');
const recommendationController = require('./recommendation.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(requireAuth);

router.get('/', catchAsync(recommendationController.getRecommendationsHandler));
router.patch('/:id', catchAsync(recommendationController.updateRecommendationStatusHandler));

module.exports = router;

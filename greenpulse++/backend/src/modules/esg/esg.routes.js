const express = require('express');
const esgController = require('./esg.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { addEvidenceSchema } = require('./esg.validator');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(requireAuth);

router.get('/score', catchAsync(esgController.getEsgScore));

router.post(
  '/principles/:principleNumber/evidence',
  requireRole(['admin', 'facility_manager']),
  validate(addEvidenceSchema),
  catchAsync(esgController.addPrincipleEvidence)
);

module.exports = router;

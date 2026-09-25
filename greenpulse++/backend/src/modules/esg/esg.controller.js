const esgService = require('./esg.service');
const { sendSuccess } = require('../../utils/responseEnvelope');

/**
 * GET /api/v1/esg/score
 */
const getEsgScore = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const esgData = await esgService.getEsgScore(companyId);

  return sendSuccess(res, 200, esgData);
};

/**
 * POST /api/v1/esg/principles/:principleNumber/evidence
 */
const addPrincipleEvidence = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const principleNumber = Number(req.params.principleNumber);
  const { evidenceType, evidenceItems } = req.body;

  const updatedPrinciple = await esgService.addPrincipleEvidence(
    companyId,
    principleNumber,
    {
      evidenceType,
      evidenceItems,
      actorId: req.user.id,
    }
  );

  return sendSuccess(res, 200, updatedPrinciple);
};

module.exports = {
  getEsgScore,
  addPrincipleEvidence,
};

const path = require('path');
const fs = require('fs');
const uploadService = require('./upload.service');
const { sendSuccess } = require('../../utils/responseEnvelope');
const { getTemplateBuffer } = require('../../utils/templateGenerator');

/**
 * GET /api/v1/upload/template
 * Streams the official GreenPulse Ready-to-Fill Excel Data Template
 */
const downloadTemplate = async (req, res) => {
  const templatePath = path.resolve(__dirname, '../../../storage/templates/greenpulse_data_template.xlsx');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="greenpulse_data_template.xlsx"');

  if (fs.existsSync(templatePath)) {
    return res.sendFile(templatePath);
  }

  // Fallback: generate in-memory buffer
  const buffer = await getTemplateBuffer();
  return res.send(buffer);
};

/**
 * POST /api/v1/upload
 * Accepts CSV/XLSX file, creates job, returns 202 immediately
 */
const uploadFile = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const fileBuffer = req.file.buffer;
  const filename = req.file.originalname;
  const fileType = req.body.type || req.body.fileType;

  const { job, isDuplicate } = await uploadService.handleUpload({
    companyId,
    fileBuffer,
    filename,
    fileType,
  });

  if (isDuplicate) {
    return sendSuccess(
      res,
      200,
      {
        jobId: job._id,
        status: job.status,
        message: 'Duplicate file detected; returning existing job record.',
      },
      { idempotent: true }
    );
  }

  return sendSuccess(
    res,
    202,
    {
      jobId: job._id,
      status: job.status,
    },
    { idempotent: false }
  );
};

/**
 * GET /api/v1/upload/jobs/:id
 * Returns current job status and details
 */
const getJobStatus = async (req, res) => {
  const companyId = req.user.companyId || req.user.company;
  const job = await uploadService.getJobById(companyId, req.params.id);

  return sendSuccess(res, 200, { job });
};

module.exports = {
  downloadTemplate,
  uploadFile,
  getJobStatus,
};


const crypto = require('crypto');
const UploadJob = require('./upload-job.model');
const { processUploadJob, syncJobToFirestore } = require('../../jobs/processUpload.job');
const AppError = require('../../utils/AppError');
const logger = require('../../lib/logger');

/**
 * Compute SHA-256 hash of file buffer
 */
const computeContentHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Handle file upload with idempotency check and background job dispatch
 */
const handleUpload = async ({ companyId, fileBuffer, filename, fileType }) => {
  if (!companyId) {
    throw new AppError('No company associated with this account', 400, 'COMPANY_REQUIRED');
  }

  const contentHash = computeContentHash(fileBuffer);

  // Idempotency: If completed job with identical contentHash exists for this company, short-circuit
  const existingJob = await UploadJob.findOne({
    companyId,
    contentHash,
    status: 'completed',
  });

  if (existingJob) {
    logger.info({ jobId: existingJob._id, contentHash }, 'Idempotent upload detected; returning existing completed job');
    return {
      job: existingJob,
      isDuplicate: true,
    };
  }

  // Create new queued job
  const job = new UploadJob({
    companyId,
    status: 'queued',
    fileType: fileType || 'energy',
    filename,
    contentHash,
  });
  await job.save();

  // Mirror queued status to Firestore
  await syncJobToFirestore(job._id, {
    id: job._id.toString(),
    companyId: companyId.toString(),
    status: 'queued',
    filename,
    contentHash,
    createdAt: new Date().toISOString(),
  });

  // Dispatch background job asynchronously without blocking HTTP response
  setImmediate(() => {
    processUploadJob({
      jobId: job._id,
      fileBuffer,
      companyId,
      filename,
      fileType,
      contentHash,
    }).catch((err) => {
      logger.error({ err: err.message, jobId: job._id }, 'Background processing uncaught exception');
    });
  });

  return {
    job,
    isDuplicate: false,
  };
};

/**
 * Get upload job status scoped to user's company
 */
const getJobById = async (companyId, jobId) => {
  if (!companyId) {
    throw new AppError('No company associated with this account', 400, 'COMPANY_REQUIRED');
  }

  const job = await UploadJob.findOne({ _id: jobId, companyId });
  if (!job) {
    throw new AppError('Upload job not found', 404, 'JOB_NOT_FOUND');
  }

  return job;
};

module.exports = {
  computeContentHash,
  handleUpload,
  getJobById,
};

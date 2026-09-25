const path = require('path');
const fs = require('fs');
const reportService = require('./report.service');
const { sendSuccess, sendError } = require('../../utils/responseEnvelope');
const logger = require('../../lib/logger');

/**
 * POST /api/v1/reports
 * Initiate report compilation (returns HTTP 202 Accepted)
 */
const generateReport = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const requestedBy = req.user.userId || req.user._id || req.user.id;
    const { reportType, period } = req.body;

    const report = await reportService.initiateReportGeneration({
      companyId,
      reportType,
      period,
      requestedBy,
    });

    return sendSuccess(res, 202, {
      reportId: report._id,
      reportType: report.reportType,
      period: report.period,
      status: report.status,
      disclosureGapCount: report.disclosureGapCount,
      executiveSummary: report.executiveSummary,
      createdAt: report.createdAt,
    }, {
      message: 'Report compilation initiated. PDF generation and storage are processing asynchronously.',
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to initiate report generation');
    return next(error);
  }
};

/**
 * GET /api/v1/reports
 * List generated reports for the authenticated company
 */
const getReports = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const { reportType, period, status } = req.query;

    const reports = await reportService.getReportsByCompany(companyId, {
      reportType,
      period,
      status,
    });

    return sendSuccess(res, 200, reports, { count: reports.length });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/reports/:id
 * Get clean report details (excludes heavy raw dataSnapshot)
 */
const getReportDetail = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const { id } = req.params;

    const report = await reportService.getReportById(id, companyId);
    return sendSuccess(res, 200, report);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    return next(error);
  }
};

/**
 * GET /api/v1/reports/:id/download
 * Get short-lived signed URL or local stream for downloading the compliance PDF
 */
const getReportDownload = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const { id } = req.params;

    const downloadAccess = await reportService.getReportDownloadAccess(id, companyId);

    // If direct stream requested or downloading via client
    if (req.query.stream === 'true' && downloadAccess.localFilePath) {
      return res.download(downloadAccess.localFilePath, `report_${downloadAccess.period}.pdf`);
    }

    return sendSuccess(res, 200, downloadAccess);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    if (error.statusCode === 400) {
      return sendError(res, 400, 'REPORT_NOT_READY', error.message);
    }
    return next(error);
  }
};

/**
 * GET /api/v1/reports/download-local
 * Private local download endpoint for dev/test fallback
 */
const downloadLocalFile = async (req, res) => {
  const { ref } = req.query;
  if (!ref || typeof ref !== 'string' || ref.includes('..') || !ref.startsWith('reports/')) {
    return sendError(res, 400, 'INVALID_REFERENCE', 'Invalid file reference');
  }

  const localStorageDir = path.resolve(__dirname, '../../../storage');
  const fullPath = path.join(localStorageDir, ref);

  if (!fs.existsSync(fullPath)) {
    return sendError(res, 404, 'FILE_NOT_FOUND', 'Report PDF does not exist');
  }

  return res.download(fullPath, path.basename(ref));
};

module.exports = {
  generateReport,
  getReports,
  getReportDetail,
  getReportDownload,
  downloadLocalFile,
};

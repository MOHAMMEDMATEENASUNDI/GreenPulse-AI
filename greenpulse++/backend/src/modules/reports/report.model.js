const mongoose = require('mongoose');
const { VALID_REPORT_TYPES } = require('./report.config');

const executiveSummarySchema = new mongoose.Schema(
  {
    framework: {
      type: String,
      required: [true, 'executiveSummary.framework is required'],
    },
    telemetryAndScope: {
      type: String,
      required: [true, 'executiveSummary.telemetryAndScope is required'],
    },
    auditLevel: {
      type: String,
      required: [true, 'executiveSummary.auditLevel is required'],
      default: 'Internal system-generated; not externally assured',
    },
    keyFinding: {
      type: String,
      required: [true, 'executiveSummary.keyFinding is required'],
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: VALID_REPORT_TYPES,
      required: [true, 'reportType is required'],
      index: true,
    },
    period: {
      type: String,
      required: [true, 'period is required (YYYY-MM)'],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must be in exact YYYY-MM format'],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'companyId is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'needs_review', 'failed'],
      default: 'generating',
      index: true,
    },
    dataSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'dataSnapshot is required'],
      immutable: true, // Layer 1: Schema-level write-once immutability
    },
    executiveSummary: {
      type: executiveSummarySchema,
      required: [true, 'executiveSummary is required'],
    },
    pdfStorageRef: {
      type: String,
      default: null, // Private object path: "reports/{companyId}/{reportId}_{period}.pdf"
    },
    disclosureGapCount: {
      type: Number,
      required: [true, 'disclosureGapCount is required'],
      min: [0, 'disclosureGapCount cannot be negative'],
    },
    generatedAt: {
      type: Date,
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'requestedBy is required'],
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

reportSchema.index({ companyId: 1, period: 1, reportType: 1 });
reportSchema.index({ companyId: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;

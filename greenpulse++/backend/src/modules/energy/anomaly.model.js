const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true,
    },
    period: {
      type: String,
      required: [true, 'Period is required (e.g. YYYY-MM)'],
      trim: true,
      index: true,
    },
    metric: {
      type: String,
      default: 'energy_kwh',
      required: true,
    },
    currentValue: {
      type: Number,
      required: [true, 'Current value is required'],
    },
    baselineMean: {
      type: Number,
      required: [true, 'Baseline mean is required'],
    },
    standardDeviation: {
      type: Number,
      required: [true, 'Standard deviation is required'],
    },
    zScore: {
      type: Number,
      default: null,
    },
    deviationPercent: {
      type: Number,
      required: [true, 'Deviation percent is required'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: [true, 'Severity is required'],
      index: true,
    },
    uploadJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadJob',
      index: true,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

anomalySchema.index({ companyId: 1, departmentId: 1, period: 1 });
anomalySchema.index({ companyId: 1, detectedAt: -1 });

const Anomaly = mongoose.model('Anomaly', anomalySchema);

module.exports = Anomaly;

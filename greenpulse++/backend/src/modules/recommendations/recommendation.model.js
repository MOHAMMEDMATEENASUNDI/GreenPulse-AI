const mongoose = require('mongoose');

const anomalySummarySchema = new mongoose.Schema(
  {
    departmentName: { type: String, required: true },
    period: { type: String, required: true },
    deviationPercent: { type: Number, required: true },
    severity: { type: String, required: true },
  },
  { _id: false }
);

const sourceContextSchema = new mongoose.Schema(
  {
    triggeringJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadJob',
      required: true,
      index: true,
    },
    carbonSummary: {
      totalKgCO2e: { type: Number, default: 0 },
      scope2KgCO2e: { type: Number, default: 0 },
    },
    anomalySummaries: [anomalySummarySchema],
    greenScoreBreakdown: {
      overallScore: { type: Number, default: 0 },
      energyEfficiencyScore: { type: Number, default: 0 },
      complianceScore: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['energy_efficiency', 'waste_reduction', 'renewable_transition', 'operational_optimization'],
      index: true,
    },
    estimatedImpact: {
      costSavingsINR: {
        type: Number,
        required: [true, 'Estimated cost savings is required'],
        min: [0, 'Cost savings cannot be negative'],
      },
      co2Reduction: {
        type: Number,
        required: [true, 'Estimated CO2 reduction is required'],
        min: [0, 'CO2 reduction cannot be negative'],
      },
    },
    priorityScore: {
      type: Number,
      required: [true, 'Priority score is required'],
      min: 0,
      max: 100,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    sourceContext: {
      type: sourceContextSchema,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    respondedAt: {
      type: Date,
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

// Compound unique index for deterministic recommendation idempotency
recommendationSchema.index(
  { companyId: 1, 'sourceContext.triggeringJobId': 1, action: 1 },
  { unique: true }
);

recommendationSchema.index({ companyId: 1, status: 1, priorityScore: -1 });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;

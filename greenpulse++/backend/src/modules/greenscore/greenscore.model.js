const mongoose = require('mongoose');

const subScoreSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    source: {
      type: String,
      required: true,
      enum: ['baseline_fallback', 'real_target'],
      default: 'baseline_fallback',
    },
    baselinePeriod: {
      type: String,
      default: null,
    },
    currentPeriod: {
      type: String,
      default: null,
    },
    baselineValue: {
      type: Number,
      default: null,
    },
    currentValue: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const greenScoreSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    period: {
      type: String,
      required: [true, 'Period is required (latest overall usable period)'],
      trim: true,
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Green Score is required'],
      min: 0,
      max: 100,
    },
    breakdown: {
      carbonPerformance: {
        type: subScoreSchema,
        required: true,
      },
      energyEfficiency: {
        type: subScoreSchema,
        required: true,
      },
      wasteManagement: {
        type: subScoreSchema,
        required: true,
      },
      complianceCompleteness: {
        type: subScoreSchema,
        required: true,
      },
    },
    uploadJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadJob',
      index: true,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
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

greenScoreSchema.index({ companyId: 1, period: 1 });
greenScoreSchema.index({ companyId: 1, calculatedAt: -1 });

const GreenScore = mongoose.model('GreenScore', greenScoreSchema);

module.exports = GreenScore;

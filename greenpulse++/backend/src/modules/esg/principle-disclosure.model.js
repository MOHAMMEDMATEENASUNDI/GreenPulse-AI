const mongoose = require('mongoose');

const principleDisclosureSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    principleNumber: {
      type: Number,
      required: [true, 'Principle number is required (1-9)'],
      min: 1,
      max: 9,
    },
    status: {
      type: String,
      enum: ['complete', 'partial', 'missing'],
      required: [true, 'Status is required'],
    },
    coveragePercent: {
      type: Number,
      required: [true, 'Coverage percentage is required'],
      min: 0,
      max: 100,
    },
    activeDataSources: {
      type: [String],
      default: [],
    },
    specificGaps: {
      type: [String],
      default: [],
    },
    mappedEvidence: {
      type: [String],
      default: [],
    },
    isSeededDemo: {
      type: Boolean,
      default: true,
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

principleDisclosureSchema.index({ companyId: 1, principleNumber: 1 }, { unique: true });

const PrincipleDisclosure = mongoose.model('PrincipleDisclosure', principleDisclosureSchema);

module.exports = PrincipleDisclosure;

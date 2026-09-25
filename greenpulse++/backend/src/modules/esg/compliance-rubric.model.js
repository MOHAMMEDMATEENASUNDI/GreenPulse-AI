const mongoose = require('mongoose');

const complianceRubricSchema = new mongoose.Schema(
  {
    principleNumber: {
      type: Number,
      required: [true, 'Principle number is required (1-9)'],
      min: 1,
      max: 9,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Principle name is required'],
      trim: true,
    },
    framework: {
      type: String,
      default: 'BRSR_NGRBC',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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

const ComplianceRubric = mongoose.model('ComplianceRubric', complianceRubricSchema, 'complianceRubric');

module.exports = ComplianceRubric;

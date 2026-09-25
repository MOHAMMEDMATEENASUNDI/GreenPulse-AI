const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
      default: 'General',
    },
    brsrStatus: {
      type: String,
      enum: {
        values: ['mandatory', 'voluntary', 'in_scope', 'exempt'],
        message: '{VALUE} is not a valid BRSR status',
      },
      default: 'voluntary',
      lowercase: true,
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

const Company = mongoose.model('Company', companySchema);

module.exports = Company;

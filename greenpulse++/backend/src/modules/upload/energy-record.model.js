const mongoose = require('mongoose');

const energyRecordSchema = new mongoose.Schema(
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
    kwhUsed: {
      type: Number,
      required: [true, 'kWh used is required'],
      min: [0, 'kWh used cannot be negative'],
    },
    sourceFileHash: {
      type: String,
      required: [true, 'Source file hash is required'],
      index: true,
    },
    uploadJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadJob',
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

// Helpful index for period / department / company queries
energyRecordSchema.index({ companyId: 1, departmentId: 1, period: 1 });

const EnergyRecord = mongoose.model('EnergyRecord', energyRecordSchema);

module.exports = EnergyRecord;

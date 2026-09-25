const mongoose = require('mongoose');

const uploadJobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['queued', 'processing', 'failed', 'completed'],
        message: '{VALUE} is not a valid upload job status',
      },
      default: 'queued',
      index: true,
    },
    fileType: {
      type: String,
      enum: {
        values: ['energy', 'waste', 'fuel', 'combined', 'template'],
        message: '{VALUE} is not a valid file type',
      },
      default: 'energy',
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    contentHash: {
      type: String,
      required: [true, 'Content hash is required'],
      index: true,
    },
    rowCount: {
      type: Number,
      default: 0,
    },
    processedCount: {
      type: Number,
      default: 0,
    },
    errorDetail: [
      {
        row: { type: Number },
        field: { type: String },
        message: { type: String },
      },
    ],
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
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

uploadJobSchema.index({ companyId: 1, contentHash: 1 });

const UploadJob = mongoose.model('UploadJob', uploadJobSchema);

module.exports = UploadJob;

const mongoose = require('mongoose');

const wasteRecordSchema = new mongoose.Schema(
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
    quantityKg: {
      type: Number,
      required: [true, 'Quantity in kg is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Waste category is required'],
      trim: true,
      lowercase: true,
    },
    subcategory: {
      type: String,
      trim: true,
      lowercase: true,
    },
    rawWasteItem: {
      type: String,
      trim: true,
    },
    matchedKeyword: {
      type: String,
      trim: true,
      lowercase: true,
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

wasteRecordSchema.index({ companyId: 1, departmentId: 1, period: 1 });

const WasteRecord = mongoose.model('WasteRecord', wasteRecordSchema);

module.exports = WasteRecord;

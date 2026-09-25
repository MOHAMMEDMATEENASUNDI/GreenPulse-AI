const mongoose = require('mongoose');

const fuelRecordSchema = new mongoose.Schema(
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
      required: [true, 'Period is required (YYYY-MM)'],
      trim: true,
      index: true,
    },
    fuelType: {
      type: String,
      required: [true, 'Fuel type is required'],
      trim: true,
      lowercase: true,
    },
    fuelQuantity: {
      type: Number,
      required: [true, 'Fuel quantity is required'],
      min: [0, 'Fuel quantity cannot be negative'],
    },
    fuelUnit: {
      type: String,
      required: [true, 'Fuel unit is required'],
      trim: true,
      lowercase: true,
    },
    co2eScope1: {
      type: Number,
      required: [true, 'Scope 1 kgCO2e is required'],
      min: [0, 'Scope 1 cannot be negative'],
    },
    co2eScope3: {
      type: Number,
      required: [true, 'Scope 3 kgCO2e is required'],
      min: [0, 'Scope 3 cannot be negative'],
    },
    factorScope1: {
      type: Number,
      required: [true, 'Scope 1 emission factor is required'],
    },
    factorScope3: {
      type: Number,
      required: [true, 'Scope 3 emission factor is required'],
    },
    factorVersion: {
      type: String,
      required: [true, 'Factor version is required'],
      trim: true,
      default: 'DEFRA-2024 / IPCC',
    },
    sourceFileHash: {
      type: String,
      required: [true, 'Source file hash is required'],
      trim: true,
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

fuelRecordSchema.index({ companyId: 1, departmentId: 1, period: 1 });
fuelRecordSchema.index({ companyId: 1, period: 1 });

const FuelRecord = mongoose.model('FuelRecord', fuelRecordSchema);

module.exports = FuelRecord;

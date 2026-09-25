const mongoose = require('mongoose');

const emissionSchema = new mongoose.Schema(
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
    kwhUsed: {
      type: Number,
      required: [true, 'kWh used is required'],
      min: [0, 'kWh used cannot be negative'],
    },
    co2eScope1: {
      type: Number,
      default: null, // clean, numeric/nullable
    },
    co2eScope2: {
      type: Number,
      required: [true, 'Scope 2 CO2e is required'],
      min: [0, 'Scope 2 CO2e cannot be negative'],
    },
    co2eScope3: {
      type: Number,
      default: null, // clean, numeric/nullable
    },
    totalCo2e: {
      type: Number,
      required: [true, 'Total CO2e is required'],
      min: [0, 'Total CO2e cannot be negative'],
    },
    factorVersion: {
      type: String,
      required: [true, 'Factor version is required'],
      trim: true,
      default: 'CEA-2025.1',
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

// Compound indexes for performant aggregation pipelines
emissionSchema.index({ companyId: 1, departmentId: 1, period: 1 }, { unique: true });
emissionSchema.index({ companyId: 1, period: 1 });

const Emission = mongoose.model('Emission', emissionSchema);

module.exports = Emission;

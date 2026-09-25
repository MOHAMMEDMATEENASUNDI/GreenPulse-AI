const mongoose = require('mongoose');

const emissionFactorSchema = new mongoose.Schema(
  {
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
      default: 'India',
    },
    type: {
      type: String,
      required: [true, 'Emission factor type is required (e.g. grid_electricity)'],
      trim: true,
      default: 'grid_electricity',
    },
    factorKgCO2ePerKwh: {
      type: Number,
      required: [true, 'Factor in kg CO2e per kWh is required'],
      min: [0, 'Emission factor cannot be negative'],
    },
    version: {
      type: String,
      required: [true, 'Factor version is required'],
      trim: true,
      default: 'CEA-2025.1',
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

// Compound unique index for region, type, and version
emissionFactorSchema.index({ region: 1, type: 1, version: 1 }, { unique: true });

const EmissionFactor = mongoose.model('EmissionFactor', emissionFactorSchema);

module.exports = EmissionFactor;

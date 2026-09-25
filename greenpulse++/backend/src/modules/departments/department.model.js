const mongoose = require('mongoose');
const { normalizeDepartmentName } = require('../../utils/textNormalizer');

const departmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    normalizedName: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Department type is required'],
      trim: true,
      default: 'operations',
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

// Populate normalizedName automatically before validation and save
departmentSchema.pre('validate', function (next) {
  if (this.name && !this.normalizedName) {
    this.normalizedName = normalizeDepartmentName(this.name);
  }
  next();
});

departmentSchema.pre('save', function (next) {
  if (this.name && !this.normalizedName) {
    this.normalizedName = normalizeDepartmentName(this.name);
  }
  next();
});

// Enforce company-scoped uniqueness on canonical lowercase normalizedName
departmentSchema.index({ companyId: 1, normalizedName: 1 }, { unique: true });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;

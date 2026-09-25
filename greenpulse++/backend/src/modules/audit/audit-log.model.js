const mongoose = require('mongoose');

const AUDIT_ACTIONS = [
  'user.login',
  'upload.completed',
  'report.generated',
  'recommendation.approved',
  'recommendation.dismissed',
];

const auditLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'companyId is required'],
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'actorId is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'action is required'],
      enum: {
        values: AUDIT_ACTIONS,
        message: '{VALUE} is not a valid audit action',
      },
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: [true, 'timestamp is required'],
    },
  },
  {
    timestamps: false,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

auditLogSchema.index({ companyId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = {
  AuditLog,
  AUDIT_ACTIONS,
};

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['USER', 'ELDERLY_PROFILE', 'CAREGIVER_RELATIONSHIP', 'MEDICATION', 'SCHEDULE', 'DOSE']
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Compound index for querying recent audit logs for an actor or resource
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ resourceId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

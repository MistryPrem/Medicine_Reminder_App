import mongoose from 'mongoose';

const NOTIFICATION_TYPES = [
  'MEDICATION_REMINDER',
  'MISSED_DOSE_ESCALATION',
  'LOW_STOCK_ALERT',
  'CAREGIVER_INVITE'
];

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicationDose',
      default: null,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    sentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user inbox queries
notificationSchema.index({ recipientId: 1, sentAt: -1 });

export { NOTIFICATION_TYPES };
export const Notification = mongoose.model('Notification', notificationSchema);

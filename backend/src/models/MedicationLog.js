import mongoose from 'mongoose';
import { DOSE_ACTIONS } from '../constants/doseStatuses.js';

const medicationLogSchema = new mongoose.Schema(
  {
    doseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicationDose',
      required: true,
      index: true
    },
    actedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(DOSE_ACTIONS)
    },
    actionTimestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    skipReason: {
      type: String,
      trim: true,
      default: null,
      maxlength: [300, 'Skip reason cannot exceed 300 characters']
    },
    snoozeDurationMinutes: {
      type: Number,
      default: null
    },
    wasOfflineSync: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

medicationLogSchema.index({ doseId: 1, actionTimestamp: -1 });

export const MedicationLog = mongoose.model('MedicationLog', medicationLogSchema);

import mongoose from 'mongoose';
import { DOSE_STATUSES, DOSE_STATUS_LIST } from '../constants/doseStatuses.js';

const medicationDoseSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicationSchedule',
      required: true,
      index: true
    },
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
      index: true
    },
    elderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: DOSE_STATUS_LIST,
        message: '{VALUE} is not a valid dose status'
      },
      default: DOSE_STATUSES.SCHEDULED,
      index: true
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    reminderSentAt: {
      type: Date,
      default: null
    },
    overdueThresholdAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for rapid daily dashboard lookups and reconciliation queries
medicationDoseSchema.index({ elderlyId: 1, scheduledFor: 1, status: 1 });
medicationDoseSchema.index({ status: 1, scheduledFor: 1 });
medicationDoseSchema.index({ status: 1, overdueThresholdAt: 1 });

export const MedicationDose = mongoose.model('MedicationDose', medicationDoseSchema);

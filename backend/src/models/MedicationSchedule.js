import mongoose from 'mongoose';

const FREQUENCY_TYPES = ['once_daily', 'multiple_daily', 'specific_days', 'interval'];

const medicationScheduleSchema = new mongoose.Schema(
  {
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
    frequencyType: {
      type: String,
      required: true,
      enum: {
        values: FREQUENCY_TYPES,
        message: '{VALUE} is not a valid frequency type'
      },
      default: 'once_daily'
    },
    scheduledTimes: {
      type: [String],
      required: true,
      validate: {
        validator: function (times) {
          if (!Array.isArray(times) || times.length === 0) return false;
          // Validates 24h HH:mm format
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          return times.every((t) => timeRegex.test(t));
        },
        message: 'All scheduled times must be valid 24-hour time strings in HH:mm format (e.g. 08:00)'
      }
    },
    daysOfWeek: {
      type: [Number],
      default: [],
      validate: {
        validator: function (days) {
          if (this.frequencyType === 'specific_days') {
            return Array.isArray(days) && days.length > 0 && days.every((d) => d >= 0 && d <= 6);
          }
          return true;
        },
        message: 'Specific days frequency requires at least one valid day index between 0 (Sunday) and 6 (Saturday)'
      }
    },
    intervalHours: {
      type: Number,
      default: null,
      min: [1, 'Interval must be at least 1 hour'],
      max: [48, 'Interval cannot exceed 48 hours']
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

medicationScheduleSchema.index({ medicationId: 1, isActive: 1 });
medicationScheduleSchema.index({ elderlyId: 1, isActive: 1 });

export { FREQUENCY_TYPES };
export const MedicationSchedule = mongoose.model('MedicationSchedule', medicationScheduleSchema);

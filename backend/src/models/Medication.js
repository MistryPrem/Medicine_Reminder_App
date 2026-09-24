import mongoose from 'mongoose';

const DOSAGE_UNITS = ['mg', 'ml', 'tablet', 'capsule', 'drops', 'puff', 'patch', 'units', 'sachet'];

const medicationSchema = new mongoose.Schema(
  {
    elderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      maxlength: [120, 'Medication name cannot exceed 120 characters']
    },
    genericName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [120, 'Generic name cannot exceed 120 characters']
    },
    dosage: {
      type: String,
      required: [true, 'Dosage amount is required (e.g. 500, 1)'],
      trim: true
    },
    dosageUnit: {
      type: String,
      required: [true, 'Dosage unit is required'],
      enum: {
        values: DOSAGE_UNITS,
        message: '{VALUE} is not a supported dosage unit'
      },
      default: 'tablet'
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Instructions cannot exceed 500 characters']
    },
    currentStock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    refillThreshold: {
      type: Number,
      required: true,
      min: [0, 'Refill threshold cannot be negative'],
      default: 7
    },
    pillsPerDose: {
      type: Number,
      required: true,
      min: [0.25, 'Pills per dose must be at least 0.25'],
      default: 1
    },
    colorCode: {
      type: String,
      trim: true,
      default: '#3b82f6'
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

// Compound indexes for performant lookups per elderly user
medicationSchema.index({ elderlyId: 1, isActive: 1 });
medicationSchema.index({ elderlyId: 1, name: 1 });

export { DOSAGE_UNITS };
export const Medication = mongoose.model('Medication', medicationSchema);

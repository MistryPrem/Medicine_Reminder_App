import mongoose from 'mongoose';

const elderlyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      default: null
    },
    emergencyContactName: {
      type: String,
      trim: true,
      default: null
    },
    medicalNotes: {
      type: String,
      maxlength: [2000, 'Medical notes cannot exceed 2000 characters'],
      default: ''
    },
    preferredSnoozeMinutes: {
      type: Number,
      enum: [10, 15, 30, 60],
      default: 15
    },
    highContrastMode: {
      type: Boolean,
      default: true
    },
    largeFontMode: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const ElderlyProfile = mongoose.model('ElderlyProfile', elderlyProfileSchema);

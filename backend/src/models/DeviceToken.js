import mongoose from 'mongoose';

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fcmToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    devicePlatform: {
      type: String,
      enum: ['android', 'ios', 'web'],
      default: 'android'
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for active device lookups
deviceTokenSchema.index({ userId: 1, lastSeenAt: -1 });

export const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);

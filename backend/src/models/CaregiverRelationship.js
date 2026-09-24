import mongoose from 'mongoose';

const caregiverRelationshipSchema = new mongoose.Schema(
  {
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    elderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending',
      index: true
    },
    permissions: {
      type: String,
      enum: ['full', 'view_only'],
      default: 'full'
    },
    inviteCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true
    },
    inviteExpiresAt: {
      type: Date,
      default: null
    },
    connectedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active connections between the same caregiver and elderly
caregiverRelationshipSchema.index(
  { caregiverId: 1, elderlyId: 1 },
  { unique: true, partialFilterExpression: { elderlyId: { $ne: null }, status: 'accepted' } }
);

export const CaregiverRelationship = mongoose.model('CaregiverRelationship', caregiverRelationshipSchema);

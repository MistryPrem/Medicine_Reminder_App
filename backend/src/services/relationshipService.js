import crypto from 'crypto';
import { CaregiverRelationship } from '../models/CaregiverRelationship.js';
import { ElderlyProfile } from '../models/ElderlyProfile.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export const generateInviteCode = async (caregiverId, permissions = 'full') => {
  // Generate a distinct 6-character alphanumeric code e.g. "CARE82"
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const inviteCode = `C${randomSuffix}`;

  const inviteExpiresAt = new Date();
  inviteExpiresAt.setHours(inviteExpiresAt.getHours() + 48); // Valid for 48 hours

  const relationship = await CaregiverRelationship.create({
    caregiverId,
    status: 'pending',
    permissions,
    inviteCode,
    inviteExpiresAt
  });

  await AuditLog.create({
    actorId: caregiverId,
    action: 'INVITATION_CREATED',
    resourceType: 'CAREGIVER_RELATIONSHIP',
    resourceId: relationship._id,
    metadata: { inviteCode, permissions }
  });

  return {
    inviteCode: relationship.inviteCode,
    inviteExpiresAt: relationship.inviteExpiresAt,
    permissions: relationship.permissions
  };
};

export const linkElderlyWithCode = async (elderlyId, inviteCode) => {
  const relationship = await CaregiverRelationship.findOne({
    inviteCode: inviteCode.trim().toUpperCase(),
    status: 'pending'
  });

  if (!relationship) {
    throw AppError.notFound('Invalid or already used invite code', ERROR_CODES.NOT_FOUND);
  }

  if (relationship.inviteExpiresAt && relationship.inviteExpiresAt < new Date()) {
    throw AppError.badRequest('This invite code has expired. Please request a new code.', ERROR_CODES.VALIDATION_ERROR);
  }

  if (relationship.caregiverId.toString() === elderlyId.toString()) {
    throw AppError.badRequest('You cannot link yourself as your own caregiver', ERROR_CODES.VALIDATION_ERROR);
  }

  // Check if an accepted relationship already exists
  const existingAccepted = await CaregiverRelationship.findOne({
    caregiverId: relationship.caregiverId,
    elderlyId,
    status: 'accepted'
  });

  if (existingAccepted) {
    throw AppError.conflict('You are already linked with this caregiver', ERROR_CODES.CONFLICT);
  }

  // Activate relationship
  relationship.elderlyId = elderlyId;
  relationship.status = 'accepted';
  relationship.connectedAt = new Date();
  relationship.inviteCode = undefined; // Invalidate code upon successful use
  relationship.inviteExpiresAt = undefined;
  await relationship.save();

  // Ensure elderly profile exists
  let profile = await ElderlyProfile.findOne({ userId: elderlyId });
  if (!profile) {
    profile = await ElderlyProfile.create({ userId: elderlyId });
  }

  // Log link event in AuditLog
  await AuditLog.create({
    actorId: elderlyId,
    action: 'CAREGIVER_LINKED',
    resourceType: 'CAREGIVER_RELATIONSHIP',
    resourceId: relationship._id,
    metadata: { caregiverId: relationship.caregiverId }
  });

  return {
    relationshipId: relationship._id,
    caregiverId: relationship.caregiverId,
    status: relationship.status,
    permissions: relationship.permissions,
    connectedAt: relationship.connectedAt
  };
};

export const getLinkedElderlyForCaregiver = async (caregiverId) => {
  const relationships = await CaregiverRelationship.find({
    caregiverId,
    status: 'accepted'
  })
    .populate('elderlyId', 'fullName email phoneNumber timezone isActive')
    .lean();

  const results = [];
  for (const rel of relationships) {
    if (rel.elderlyId) {
      const profile = await ElderlyProfile.findOne({ userId: rel.elderlyId._id }).lean();
      results.push({
        relationshipId: rel._id,
        permissions: rel.permissions,
        connectedAt: rel.connectedAt,
        elderly: {
          ...rel.elderlyId,
          profile: profile || null
        }
      });
    }
  }

  return results;
};

export const getElderlyProfile = async (elderlyId) => {
  let profile = await ElderlyProfile.findOne({ userId: elderlyId });
  if (!profile) {
    profile = await ElderlyProfile.create({ userId: elderlyId });
  }
  return profile;
};

export const updateElderlyProfile = async (elderlyId, updateData, actorId) => {
  let profile = await ElderlyProfile.findOne({ userId: elderlyId });
  if (!profile) {
    profile = await ElderlyProfile.create({ userId: elderlyId, ...updateData });
  } else {
    Object.assign(profile, updateData);
    await profile.save();
  }

  await AuditLog.create({
    actorId,
    action: 'PROFILE_UPDATED',
    resourceType: 'ELDERLY_PROFILE',
    resourceId: profile._id,
    metadata: updateData
  });

  return profile;
};

import { jest } from '@jest/globals';
import { CaregiverRelationship } from '../src/models/CaregiverRelationship.js';
import { ElderlyProfile } from '../src/models/ElderlyProfile.js';
import { AuditLog } from '../src/models/AuditLog.js';
import * as relationshipService from '../src/services/relationshipService.js';
import { verifyElderlyAccess } from '../src/middleware/relationshipGuard.js';
import { ROLES } from '../src/constants/roles.js';

describe('Caregiver-Elderly Relationship Subsystem Tests', () => {
  const mockCaregiverId = '507f1f77bcf86cd799439011';
  const mockElderlyId = '507f1f77bcf86cd799439022';
  const mockOtherCaregiverId = '507f1f77bcf86cd799439033';

  describe('Invitation Generation', () => {
    it('should generate a 6-character uppercase invite code expiring in 48 hours', async () => {
      const mockCreated = {
        _id: 'rel_id_1',
        caregiverId: mockCaregiverId,
        inviteCode: 'CA1234',
        inviteExpiresAt: new Date(Date.now() + 48 * 3600 * 1000),
        permissions: 'full'
      };

      jest.spyOn(CaregiverRelationship, 'create').mockResolvedValueOnce(mockCreated);
      jest.spyOn(AuditLog, 'create').mockResolvedValueOnce({});

      const result = await relationshipService.generateInviteCode(mockCaregiverId, 'full');

      expect(result).toHaveProperty('inviteCode');
      expect(result.inviteCode).toBe('CA1234');
      expect(result.permissions).toBe('full');
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockCaregiverId,
          action: 'INVITATION_CREATED'
        })
      );

      CaregiverRelationship.create.mockRestore();
      AuditLog.create.mockRestore();
    });
  });

  describe('Elderly Linking with Invite Code', () => {
    it('should reject link if invite code does not exist', async () => {
      jest.spyOn(CaregiverRelationship, 'findOne').mockResolvedValueOnce(null);

      await expect(
        relationshipService.linkElderlyWithCode(mockElderlyId, 'INVALID')
      ).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'NOT_FOUND'
      });

      CaregiverRelationship.findOne.mockRestore();
    });

    it('should reject link if invite code has expired', async () => {
      const expiredDate = new Date(Date.now() - 10000);
      jest.spyOn(CaregiverRelationship, 'findOne').mockResolvedValueOnce({
        inviteCode: 'EXPIRE',
        inviteExpiresAt: expiredDate,
        status: 'pending'
      });

      await expect(
        relationshipService.linkElderlyWithCode(mockElderlyId, 'EXPIRE')
      ).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR'
      });

      CaregiverRelationship.findOne.mockRestore();
    });

    it('should link elderly and caregiver successfully when code is valid', async () => {
      const futureDate = new Date(Date.now() + 24 * 3600 * 1000);
      const mockRel = {
        _id: 'rel_id_2',
        caregiverId: mockCaregiverId,
        inviteCode: 'VALID1',
        inviteExpiresAt: futureDate,
        status: 'pending',
        permissions: 'full',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(CaregiverRelationship, 'findOne')
        .mockResolvedValueOnce(mockRel) // for find pending
        .mockResolvedValueOnce(null); // for find existing accepted
      jest.spyOn(ElderlyProfile, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(ElderlyProfile, 'create').mockResolvedValueOnce({ userId: mockElderlyId });
      jest.spyOn(AuditLog, 'create').mockResolvedValueOnce({});

      const result = await relationshipService.linkElderlyWithCode(mockElderlyId, 'VALID1');

      expect(result.status).toBe('accepted');
      expect(result.caregiverId).toBe(mockCaregiverId);
      expect(mockRel.status).toBe('accepted');
      expect(mockRel.elderlyId).toBe(mockElderlyId);
      expect(mockRel.save).toHaveBeenCalled();

      CaregiverRelationship.findOne.mockRestore();
      ElderlyProfile.findOne.mockRestore();
      ElderlyProfile.create.mockRestore();
      AuditLog.create.mockRestore();
    });
  });

  describe('Relationship Guard Middleware (verifyElderlyAccess)', () => {
    it('should allow elderly user to access their own resources', async () => {
      const req = {
        user: { _id: mockElderlyId, role: ROLES.ELDERLY },
        params: { elderlyId: mockElderlyId }
      };
      const res = {};
      const next = jest.fn();

      const guard = verifyElderlyAccess('view_only');
      await guard(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow linked caregiver to access elderly resources', async () => {
      const req = {
        user: { _id: mockCaregiverId, role: ROLES.CAREGIVER },
        params: { elderlyId: mockElderlyId }
      };
      const res = {};
      const next = jest.fn();

      jest.spyOn(CaregiverRelationship, 'findOne').mockResolvedValueOnce({
        caregiverId: mockCaregiverId,
        elderlyId: mockElderlyId,
        status: 'accepted',
        permissions: 'full'
      });

      const guard = verifyElderlyAccess('full');
      await guard(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req).toHaveProperty('relationship');

      CaregiverRelationship.findOne.mockRestore();
    });

    it('should forbid unlinked caregiver from accessing elderly resources', async () => {
      const req = {
        user: { _id: mockOtherCaregiverId, role: ROLES.CAREGIVER },
        params: { elderlyId: mockElderlyId }
      };
      const res = {};
      const next = jest.fn();

      jest.spyOn(CaregiverRelationship, 'findOne').mockResolvedValueOnce(null);

      const guard = verifyElderlyAccess('view_only');
      await guard(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          errorCode: 'FORBIDDEN'
        })
      );

      CaregiverRelationship.findOne.mockRestore();
    });

    it('should forbid caregiver with view_only permissions from performing full-access actions', async () => {
      const req = {
        user: { _id: mockCaregiverId, role: ROLES.CAREGIVER },
        params: { elderlyId: mockElderlyId }
      };
      const res = {};
      const next = jest.fn();

      jest.spyOn(CaregiverRelationship, 'findOne').mockResolvedValueOnce({
        caregiverId: mockCaregiverId,
        elderlyId: mockElderlyId,
        status: 'accepted',
        permissions: 'view_only'
      });

      const guard = verifyElderlyAccess('full');
      await guard(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          errorCode: 'FORBIDDEN'
        })
      );

      CaregiverRelationship.findOne.mockRestore();
    });
  });
});

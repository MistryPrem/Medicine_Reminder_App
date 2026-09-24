import { jest } from '@jest/globals';
import { DeviceToken } from '../src/models/DeviceToken.js';
import { Notification } from '../src/models/Notification.js';
import { CaregiverRelationship } from '../src/models/CaregiverRelationship.js';
import { User } from '../src/models/User.js';
import { Medication } from '../src/models/Medication.js';
import * as notificationService from '../src/services/notificationService.js';

describe('Notification Subsystem Tests', () => {
  const mockElderlyId = '507f1f77bcf86cd799439022';
  const mockCaregiverId = '507f1f77bcf86cd799439011';
  const mockDoseId = '507f1f77bcf86cd799439066';
  const mockMedicationId = '507f1f77bcf86cd799439044';
  const mockFcmToken = 'fcm_token_sample_abc_123_xyz';

  describe('Device Token Registration', () => {
    it('should upsert device token for user with current timestamp', async () => {
      const mockSaved = {
        _id: 'token_doc_1',
        userId: mockElderlyId,
        fcmToken: mockFcmToken,
        devicePlatform: 'android',
        lastSeenAt: new Date()
      };

      jest.spyOn(DeviceToken, 'findOneAndUpdate').mockResolvedValueOnce(mockSaved);

      const result = await notificationService.registerDeviceToken(mockElderlyId, mockFcmToken, 'android');

      expect(result.fcmToken).toBe(mockFcmToken);
      expect(DeviceToken.findOneAndUpdate).toHaveBeenCalledWith(
        { fcmToken: mockFcmToken },
        expect.objectContaining({ userId: mockElderlyId, devicePlatform: 'android' }),
        { upsert: true, new: true }
      );

      DeviceToken.findOneAndUpdate.mockRestore();
    });

    it('should delete device token on unregister', async () => {
      jest.spyOn(DeviceToken, 'deleteOne').mockResolvedValueOnce({ deletedCount: 1 });

      await notificationService.unregisterDeviceToken(mockFcmToken);

      expect(DeviceToken.deleteOne).toHaveBeenCalledWith({ fcmToken: mockFcmToken });

      DeviceToken.deleteOne.mockRestore();
    });
  });

  describe('Dose Reminder Dispatch & Idempotency', () => {
    it('should prevent duplicate push notifications if already sent for the dose', async () => {
      const mockDose = { _id: mockDoseId, elderlyId: mockElderlyId, medicationId: mockMedicationId };

      jest.spyOn(Notification, 'findOne').mockResolvedValueOnce({ _id: 'notif_existing' });

      const result = await notificationService.sendDoseReminder(mockDose);

      expect(result).toHaveProperty('skipped', true);
      expect(result.reason).toBe('Already dispatched');

      Notification.findOne.mockRestore();
    });

    it('should dispatch reminder and record notification when not previously sent', async () => {
      const mockDose = { _id: mockDoseId, elderlyId: mockElderlyId, medicationId: mockMedicationId };
      const mockMedication = { _id: mockMedicationId, name: 'Metformin', dosage: '500', dosageUnit: 'mg' };

      jest.spyOn(Notification, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(Medication, 'findById').mockResolvedValueOnce(mockMedication);
      jest.spyOn(DeviceToken, 'find').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce([{ fcmToken: mockFcmToken }])
      });
      jest.spyOn(Notification, 'create').mockResolvedValueOnce({
        _id: 'notif_new',
        type: 'MEDICATION_REMINDER',
        status: 'SENT'
      });

      const notif = await notificationService.sendDoseReminder(mockDose);

      expect(notif.status).toBe('SENT');
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: mockElderlyId,
          doseId: mockDoseId,
          type: 'MEDICATION_REMINDER',
          idempotencyKey: `REMINDER_${mockDoseId}`
        })
      );

      Notification.findOne.mockRestore();
      Medication.findById.mockRestore();
      DeviceToken.find.mockRestore();
      Notification.create.mockRestore();
    });
  });

  describe('Missed Dose Escalation to Caregivers', () => {
    it('should escalate to linked caregivers when dose is missed', async () => {
      const mockDose = { _id: mockDoseId, elderlyId: mockElderlyId, medicationId: mockMedicationId };
      const mockElderly = { _id: mockElderlyId, fullName: 'John Doe' };
      const mockMedication = { _id: mockMedicationId, name: 'Lisinopril', dosage: '10', dosageUnit: 'mg' };

      jest.spyOn(User, 'findById').mockResolvedValueOnce(mockElderly);
      jest.spyOn(Medication, 'findById').mockResolvedValueOnce(mockMedication);
      jest.spyOn(CaregiverRelationship, 'find').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce([{ caregiverId: mockCaregiverId }])
      });
      jest.spyOn(Notification, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(DeviceToken, 'find').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce([{ fcmToken: 'caregiver_fcm_token' }])
      });
      jest.spyOn(Notification, 'create').mockResolvedValueOnce({
        _id: 'escalation_notif_1',
        recipientId: mockCaregiverId,
        type: 'MISSED_DOSE_ESCALATION',
        status: 'SENT'
      });

      const escalations = await notificationService.sendMissedDoseEscalation(mockDose);

      expect(escalations.length).toBe(1);
      expect(escalations[0].type).toBe('MISSED_DOSE_ESCALATION');
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: mockCaregiverId,
          type: 'MISSED_DOSE_ESCALATION',
          idempotencyKey: `MISSED_ESCALATION_${mockDoseId}_${mockCaregiverId}`
        })
      );

      User.findById.mockRestore();
      Medication.findById.mockRestore();
      CaregiverRelationship.find.mockRestore();
      Notification.findOne.mockRestore();
      DeviceToken.find.mockRestore();
      Notification.create.mockRestore();
    });
  });
});

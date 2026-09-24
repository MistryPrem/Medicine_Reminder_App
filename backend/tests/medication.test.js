import { jest } from '@jest/globals';
import { Medication } from '../src/models/Medication.js';
import { MedicationSchedule } from '../src/models/MedicationSchedule.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { User } from '../src/models/User.js';
import * as medicationService from '../src/services/medicationService.js';

describe('Medication Management Subsystem Tests', () => {
  const mockElderlyId = '507f1f77bcf86cd799439022';
  const mockCreatorId = '507f1f77bcf86cd799439011';
  const mockMedicationId = '507f1f77bcf86cd799439044';

  describe('Create Medication and Schedule', () => {
    it('should create medication and schedule and record audit log', async () => {
      const mockElderly = {
        _id: mockElderlyId,
        isActive: true,
        timezone: 'America/New_York'
      };

      const mockCreatedMed = {
        _id: mockMedicationId,
        elderlyId: mockElderlyId,
        createdBy: mockCreatorId,
        name: 'Metformin',
        dosage: '500',
        dosageUnit: 'mg',
        currentStock: 60,
        refillThreshold: 10,
        pillsPerDose: 1,
        isActive: true
      };

      const mockCreatedSchedule = {
        _id: 'schedule_123',
        medicationId: mockMedicationId,
        elderlyId: mockElderlyId,
        frequencyType: 'multiple_daily',
        scheduledTimes: ['08:00', '20:00'],
        timezone: 'America/New_York',
        isActive: true
      };

      jest.spyOn(User, 'findById').mockResolvedValueOnce(mockElderly);
      jest.spyOn(Medication, 'create').mockResolvedValueOnce(mockCreatedMed);
      jest.spyOn(MedicationSchedule, 'create').mockResolvedValueOnce(mockCreatedSchedule);
      jest.spyOn(AuditLog, 'create').mockResolvedValueOnce({});

      const inputData = {
        elderlyId: mockElderlyId,
        name: 'Metformin',
        dosage: '500',
        dosageUnit: 'mg',
        currentStock: 60,
        refillThreshold: 10,
        pillsPerDose: 1,
        schedule: {
          frequencyType: 'multiple_daily',
          scheduledTimes: ['08:00', '20:00']
        }
      };

      const result = await medicationService.createMedication(inputData, mockCreatorId);

      expect(result).toHaveProperty('medication');
      expect(result).toHaveProperty('schedule');
      expect(result.medication.name).toBe('Metformin');
      expect(result.schedule.scheduledTimes).toEqual(['08:00', '20:00']);
      expect(result.schedule.timezone).toBe('America/New_York');
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockCreatorId,
          action: 'MEDICATION_CREATED',
          resourceType: 'MEDICATION',
          resourceId: mockMedicationId
        })
      );

      User.findById.mockRestore();
      Medication.create.mockRestore();
      MedicationSchedule.create.mockRestore();
      AuditLog.create.mockRestore();
    });

    it('should reject medication creation if elderly user is inactive or not found', async () => {
      jest.spyOn(User, 'findById').mockResolvedValueOnce(null);

      await expect(
        medicationService.createMedication(
          {
            elderlyId: mockElderlyId,
            name: 'Aspirin',
            schedule: { frequencyType: 'once_daily', scheduledTimes: ['09:00'] }
          },
          mockCreatorId
        )
      ).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'NOT_FOUND'
      });

      User.findById.mockRestore();
    });
  });

  describe('Inventory Stock Refill', () => {
    it('should increment stock correctly and record audit log', async () => {
      const mockMed = {
        _id: mockMedicationId,
        name: 'Lisinopril',
        currentStock: 5,
        refillThreshold: 10,
        isActive: true,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Medication, 'findById').mockResolvedValueOnce(mockMed);
      jest.spyOn(AuditLog, 'create').mockResolvedValueOnce({});

      const refillResult = await medicationService.refillMedicationStock(mockMedicationId, 30, mockCreatorId);

      expect(refillResult.currentStock).toBe(35);
      expect(mockMed.save).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockCreatorId,
          action: 'MEDICATION_REFILLED',
          metadata: { addedAmount: 30, newStock: 35 }
        })
      );

      Medication.findById.mockRestore();
      AuditLog.create.mockRestore();
    });
  });

  describe('Archive Medication (Soft Delete)', () => {
    it('should set isActive to false on medication and associated schedules', async () => {
      const mockMed = {
        _id: mockMedicationId,
        name: 'Atorvastatin',
        isActive: true,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Medication, 'findById').mockResolvedValueOnce(mockMed);
      jest.spyOn(MedicationSchedule, 'updateMany').mockResolvedValueOnce({ modifiedCount: 1 });
      jest.spyOn(AuditLog, 'create').mockResolvedValueOnce({});

      const result = await medicationService.archiveMedication(mockMedicationId, mockCreatorId);

      expect(result.success).toBe(true);
      expect(mockMed.isActive).toBe(false);
      expect(MedicationSchedule.updateMany).toHaveBeenCalledWith(
        { medicationId: mockMedicationId, isActive: true },
        { $set: { isActive: false } }
      );
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockCreatorId,
          action: 'MEDICATION_ARCHIVED'
        })
      );

      Medication.findById.mockRestore();
      MedicationSchedule.updateMany.mockRestore();
      AuditLog.create.mockRestore();
    });
  });
});

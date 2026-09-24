import { jest } from '@jest/globals';
import { MedicationDose } from '../src/models/MedicationDose.js';
import { Medication } from '../src/models/Medication.js';
import { MedicationLog } from '../src/models/MedicationLog.js';
import { MedicationSchedule } from '../src/models/MedicationSchedule.js';
import { ElderlyProfile } from '../src/models/ElderlyProfile.js';
import * as doseGeneratorService from '../src/services/doseGeneratorService.js';
import * as doseService from '../src/services/doseService.js';
import * as reconciliationService from '../src/services/reconciliationService.js';
import { DOSE_STATUSES, DOSE_ACTIONS } from '../src/constants/doseStatuses.js';

describe('Scheduling Engine & Dose Management Tests', () => {
  const mockScheduleId = '507f1f77bcf86cd799439055';
  const mockMedicationId = '507f1f77bcf86cd799439044';
  const mockElderlyId = '507f1f77bcf86cd799439022';
  const mockDoseId = '507f1f77bcf86cd799439066';
  const mockActorId = '507f1f77bcf86cd799439011';

  describe('Dose Generation (48-Hour Sliding Window)', () => {
    it('should generate candidate doses with formatted idempotency keys', async () => {
      const mockSchedule = {
        _id: mockScheduleId,
        medicationId: mockMedicationId,
        elderlyId: mockElderlyId,
        frequencyType: 'multiple_daily',
        scheduledTimes: ['08:00', '20:00'],
        daysOfWeek: [],
        timezone: 'UTC',
        isActive: true
      };

      jest.spyOn(MedicationDose, 'updateOne').mockResolvedValue({ acknowledged: true, upsertedCount: 1 });

      const result = await doseGeneratorService.generateDosesForSchedule(mockSchedule, 48);

      expect(result.totalCandidateDoses).toBeGreaterThanOrEqual(4); // 2 times per day * >=2 days
      expect(MedicationDose.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: expect.stringContaining(mockScheduleId) }),
        expect.any(Object),
        { upsert: true }
      );

      MedicationDose.updateOne.mockRestore();
    });
  });

  describe('Dose Action Engine (TAKEN, SKIPPED, SNOOZED)', () => {
    it('should record TAKEN: update status, decrement stock, and create MedicationLog', async () => {
      const mockDose = {
        _id: mockDoseId,
        medicationId: mockMedicationId,
        elderlyId: mockElderlyId,
        status: DOSE_STATUSES.REMINDER_SENT,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockMedication = {
        _id: mockMedicationId,
        currentStock: 20,
        refillThreshold: 5,
        pillsPerDose: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(MedicationDose, 'findById').mockResolvedValueOnce(mockDose);
      jest.spyOn(Medication, 'findById').mockResolvedValueOnce(mockMedication);
      jest.spyOn(MedicationLog, 'create').mockResolvedValueOnce({ _id: 'log_1' });

      const result = await doseService.recordDoseAction(
        mockDoseId,
        DOSE_ACTIONS.TAKE,
        {},
        mockActorId
      );

      expect(mockDose.status).toBe(DOSE_STATUSES.TAKEN);
      expect(mockDose.save).toHaveBeenCalled();
      expect(mockMedication.currentStock).toBe(19);
      expect(mockMedication.save).toHaveBeenCalled();
      expect(MedicationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          doseId: mockDoseId,
          actedBy: mockActorId,
          action: DOSE_ACTIONS.TAKE
        })
      );

      MedicationDose.findById.mockRestore();
      Medication.findById.mockRestore();
      MedicationLog.create.mockRestore();
    });

    it('should record SNOOZE: advance overdueThresholdAt by preferred snooze duration', async () => {
      const initialOverdue = new Date(Date.now() + 10 * 60 * 1000);
      const mockDose = {
        _id: mockDoseId,
        medicationId: mockMedicationId,
        elderlyId: mockElderlyId,
        status: DOSE_STATUSES.REMINDER_SENT,
        overdueThresholdAt: initialOverdue,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockMedication = {
        _id: mockMedicationId,
        currentStock: 20,
        pillsPerDose: 1
      };

      jest.spyOn(MedicationDose, 'findById').mockResolvedValueOnce(mockDose);
      jest.spyOn(Medication, 'findById').mockResolvedValueOnce(mockMedication);
      jest.spyOn(ElderlyProfile, 'findOne').mockResolvedValueOnce({ preferredSnoozeMinutes: 30 });
      jest.spyOn(MedicationLog, 'create').mockResolvedValueOnce({ _id: 'log_2' });

      await doseService.recordDoseAction(
        mockDoseId,
        DOSE_ACTIONS.SNOOZE,
        {},
        mockActorId
      );

      expect(mockDose.status).toBe(DOSE_STATUSES.SNOOZED);
      expect(mockDose.overdueThresholdAt.getTime()).toBeGreaterThan(initialOverdue.getTime());
      expect(mockDose.save).toHaveBeenCalled();

      MedicationDose.findById.mockRestore();
      Medication.findById.mockRestore();
      ElderlyProfile.findOne.mockRestore();
      MedicationLog.create.mockRestore();
    });
  });

  describe('Sleeping Backend Dose Reconciliation', () => {
    it('should transition past scheduled doses to reminder_sent and overdue doses to missed', async () => {
      const mockDueDose = {
        _id: 'due_1',
        status: DOSE_STATUSES.SCHEDULED,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockMissedDose = {
        _id: 'missed_1',
        status: DOSE_STATUSES.REMINDER_SENT,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(MedicationDose, 'find')
        .mockResolvedValueOnce([mockDueDose]) // for due doses query
        .mockResolvedValueOnce([mockMissedDose]); // for missed doses query
      jest.spyOn(MedicationSchedule, 'find').mockResolvedValueOnce([]);

      const report = await reconciliationService.reconcileDoses();

      expect(report.remindersTriggered).toBe(1);
      expect(report.dosesMarkedMissed).toBe(1);
      expect(mockDueDose.status).toBe(DOSE_STATUSES.REMINDER_SENT);
      expect(mockMissedDose.status).toBe(DOSE_STATUSES.MISSED);
      expect(mockDueDose.save).toHaveBeenCalled();
      expect(mockMissedDose.save).toHaveBeenCalled();

      MedicationDose.find.mockRestore();
      MedicationSchedule.find.mockRestore();
    });
  });
});

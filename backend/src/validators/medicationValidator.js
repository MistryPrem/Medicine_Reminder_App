import { z } from 'zod';
import { DOSAGE_UNITS } from '../models/Medication.js';
import { FREQUENCY_TYPES } from '../models/MedicationSchedule.js';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createMedicationSchema = z.object({
  body: z.object({
    elderlyId: z.string().min(1, 'Elderly user ID is required'),
    name: z.string().min(1, 'Medication name is required').max(120).trim(),
    genericName: z.string().max(120).trim().optional(),
    dosage: z.string().min(1, 'Dosage amount is required').trim(),
    dosageUnit: z.enum(DOSAGE_UNITS),
    instructions: z.string().max(500).trim().optional(),
    currentStock: z.number().int().nonnegative('Stock cannot be negative').default(30),
    refillThreshold: z.number().int().nonnegative('Refill threshold cannot be negative').default(7),
    pillsPerDose: z.number().positive('Pills per dose must be positive').default(1),
    colorCode: z.string().optional(),
    schedule: z.object({
      frequencyType: z.enum(FREQUENCY_TYPES),
      scheduledTimes: z
        .array(z.string().regex(timeRegex, 'Time must be in 24-hour HH:mm format (e.g. 08:00)'))
        .min(1, 'At least one scheduled time is required'),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      intervalHours: z.number().int().min(1).max(48).optional(),
      startDate: z.string().datetime().or(z.string().date()).optional(),
      endDate: z.string().datetime().or(z.string().date()).nullable().optional(),
      timezone: z.string().optional()
    })
  })
});

export const updateMedicationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).trim().optional(),
    genericName: z.string().max(120).trim().optional(),
    dosage: z.string().min(1).trim().optional(),
    dosageUnit: z.enum(DOSAGE_UNITS).optional(),
    instructions: z.string().max(500).trim().optional(),
    currentStock: z.number().int().nonnegative().optional(),
    refillThreshold: z.number().int().nonnegative().optional(),
    pillsPerDose: z.number().positive().optional(),
    colorCode: z.string().optional(),
    schedule: z
      .object({
        frequencyType: z.enum(FREQUENCY_TYPES).optional(),
        scheduledTimes: z
          .array(z.string().regex(timeRegex, 'Time must be in 24-hour HH:mm format'))
          .min(1)
          .optional(),
        daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
        intervalHours: z.number().int().min(1).max(48).optional(),
        startDate: z.string().datetime().or(z.string().date()).optional(),
        endDate: z.string().datetime().or(z.string().date()).nullable().optional(),
        timezone: z.string().optional()
      })
      .optional()
  })
});

export const refillMedicationSchema = z.object({
  body: z.object({
    refillAmount: z.number().int().positive('Refill amount must be a positive integer')
  })
});

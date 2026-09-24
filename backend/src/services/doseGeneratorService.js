import { DateTime } from 'luxon';
import { MedicationSchedule } from '../models/MedicationSchedule.js';
import { MedicationDose } from '../models/MedicationDose.js';
import { DOSE_STATUSES } from '../constants/doseStatuses.js';
import { logger } from '../utils/logger.js';

export const generateDosesForSchedule = async (schedule, windowHours = 48) => {
  if (!schedule.isActive) return [];

  const timezone = schedule.timezone || 'UTC';
  const localNow = DateTime.now().setZone(timezone);
  const localEnd = localNow.plus({ hours: windowHours });

  const dosesToInsert = [];
  const daysDiff = Math.ceil(localEnd.diff(localNow, 'days').days);

  for (let d = 0; d <= daysDiff; d++) {
    const currentDay = localNow.plus({ days: d });
    // In Luxon: 1 = Monday, 7 = Sunday. In standard JS/cron: 0 = Sunday, 6 = Saturday
    const jsDayOfWeek = currentDay.weekday % 7;

    // Check frequency conditions
    if (schedule.frequencyType === 'specific_days') {
      if (!schedule.daysOfWeek.includes(jsDayOfWeek)) {
        continue; // Skip this day
      }
    }

    for (const timeStr of schedule.scheduledTimes) {
      const [hour, minute] = timeStr.split(':').map(Number);
      const doseLocalDateTime = currentDay.set({ hour, minute, second: 0, millisecond: 0 });

      // Only generate doses within the schedule's active date range
      const doseUtcDate = doseLocalDateTime.toUTC().toJSDate();
      if (schedule.startDate && doseUtcDate < schedule.startDate) continue;
      if (schedule.endDate && doseUtcDate > schedule.endDate) continue;

      const dateKey = doseLocalDateTime.toFormat('yyyyMMdd_HHmm');
      const idempotencyKey = `${schedule._id}_${dateKey}`;

      // Overdue threshold: 30 minutes after scheduled dose time
      const overdueThresholdAt = doseLocalDateTime.plus({ minutes: 30 }).toUTC().toJSDate();

      dosesToInsert.push({
        scheduleId: schedule._id,
        medicationId: schedule.medicationId,
        elderlyId: schedule.elderlyId,
        scheduledFor: doseUtcDate,
        status: DOSE_STATUSES.SCHEDULED,
        idempotencyKey,
        overdueThresholdAt
      });
    }
  }

  // Idempotent insertion: ignore duplicate key violations cleanly
  let insertedCount = 0;
  for (const dose of dosesToInsert) {
    try {
      await MedicationDose.updateOne(
        { idempotencyKey: dose.idempotencyKey },
        { $setOnInsert: dose },
        { upsert: true }
      );
      insertedCount++;
    } catch (err) {
      if (err.code !== 11000) {
        logger.error('Error generating dose instance', { error: err.message, dose });
      }
    }
  }

  return { totalCandidateDoses: dosesToInsert.length, processed: insertedCount };
};

export const generateDosesForActiveSchedules = async (windowHours = 48) => {
  const activeSchedules = await MedicationSchedule.find({ isActive: true });
  let totalProcessed = 0;

  for (const schedule of activeSchedules) {
    try {
      const result = await generateDosesForSchedule(schedule, windowHours);
      totalProcessed += result.processed;
    } catch (err) {
      logger.error('Failed to generate doses for schedule', { scheduleId: schedule._id, error: err.message });
    }
  }

  return { schedulesChecked: activeSchedules.length, totalProcessed };
};

import { MedicationDose } from '../models/MedicationDose.js';
import { DOSE_STATUSES } from '../constants/doseStatuses.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Calculates adherence analytics over a specified number of days (default: 30)
 * Computes:
 * - Overall adherence rate (% of taken vs total scheduled/past doses)
 * - Current streak (consecutive days with 100% adherence)
 * - Longest streak
 * - Daily breakdown for chart visualization
 * - Summary counts (taken, missed, skipped, scheduled)
 */
export const getAdherenceStats = async (elderlyId, days = 30) => {
  const elderly = await User.findById(elderlyId);
  if (!elderly) {
    throw AppError.notFound('Elderly user not found', ERROR_CODES.NOT_FOUND);
  }

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const doses = await MedicationDose.find({
    elderlyId,
    scheduledFor: { $gte: startDate, $lte: now }
  })
    .sort({ scheduledFor: 1 })
    .populate('medicationId', 'name dosage dosageUnit')
    .lean();

  const totalDoses = doses.length;
  let takenCount = 0;
  let missedCount = 0;
  let skippedCount = 0;
  let scheduledCount = 0;

  // Group by date (YYYY-MM-DD)
  const dayMap = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split('T')[0];
    dayMap[dateKey] = {
      date: dateKey,
      total: 0,
      taken: 0,
      missed: 0,
      skipped: 0,
      adherenceRate: 100
    };
  }

  for (const dose of doses) {
    const dateKey = new Date(dose.scheduledFor).toISOString().split('T')[0];
    if (!dayMap[dateKey]) {
      dayMap[dateKey] = { date: dateKey, total: 0, taken: 0, missed: 0, skipped: 0, adherenceRate: 100 };
    }

    dayMap[dateKey].total++;

    if (dose.status === DOSE_STATUSES.TAKEN) {
      takenCount++;
      dayMap[dateKey].taken++;
    } else if (dose.status === DOSE_STATUSES.MISSED) {
      missedCount++;
      dayMap[dateKey].missed++;
    } else if (dose.status === DOSE_STATUSES.SKIPPED) {
      skippedCount++;
      dayMap[dateKey].skipped++;
    } else {
      scheduledCount++;
    }
  }

  // Calculate daily rates & streaks
  const dailyBreakdown = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const day of dailyBreakdown) {
    if (day.total > 0) {
      day.adherenceRate = Math.round((day.taken / day.total) * 100);
      if (day.taken === day.total) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
  }

  // Current streak (counting backwards from yesterday/today)
  const reverseDays = [...dailyBreakdown].reverse();
  for (const day of reverseDays) {
    if (day.total === 0) continue;
    if (day.taken === day.total) {
      currentStreak++;
    } else {
      break;
    }
  }

  const finishedDosesCount = takenCount + missedCount + skippedCount;
  const overallAdherenceRate =
    finishedDosesCount > 0 ? Math.round((takenCount / finishedDosesCount) * 100) : 100;

  return {
    elderlyId,
    daysPeriod: days,
    overallAdherenceRate,
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    counts: {
      total: totalDoses,
      taken: takenCount,
      missed: missedCount,
      skipped: skippedCount,
      pending: scheduledCount
    },
    dailyBreakdown
  };
};

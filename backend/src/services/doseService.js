import { MedicationDose } from '../models/MedicationDose.js';
import { Medication } from '../models/Medication.js';
import { MedicationLog } from '../models/MedicationLog.js';
import { User } from '../models/User.js';
import { ElderlyProfile } from '../models/ElderlyProfile.js';
import { DOSE_STATUSES, DOSE_ACTIONS } from '../constants/doseStatuses.js';
import { getDayBoundsUtc } from '../utils/timezoneUtils.js';
import { reconcileDoses } from './reconciliationService.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export const recordDoseAction = async (doseId, action, options = {}, actedBy) => {
  const dose = await MedicationDose.findById(doseId);
  if (!dose) {
    throw AppError.notFound('Scheduled dose not found', ERROR_CODES.NOT_FOUND);
  }

  const medication = await Medication.findById(dose.medicationId);
  if (!medication) {
    throw AppError.notFound('Associated medication not found', ERROR_CODES.NOT_FOUND);
  }

  const now = new Date();

  // If already marked as TAKEN, return idempotently
  if (dose.status === DOSE_STATUSES.TAKEN && action === DOSE_ACTIONS.TAKE) {
    return { dose, message: 'Dose already recorded as taken' };
  }

  switch (action) {
    case DOSE_ACTIONS.TAKE: {
      dose.status = DOSE_STATUSES.TAKEN;
      dose.statusUpdatedAt = now;

      // Decrement inventory stock
      const pillsToDeduct = medication.pillsPerDose || 1;
      medication.currentStock = Math.max(0, medication.currentStock - pillsToDeduct);
      await medication.save();
      break;
    }

    case DOSE_ACTIONS.SKIP: {
      dose.status = DOSE_STATUSES.SKIPPED;
      dose.statusUpdatedAt = now;
      break;
    }

    case DOSE_ACTIONS.SNOOZE: {
      let snoozeMinutes = options.snoozeDurationMinutes;
      if (!snoozeMinutes) {
        const profile = await ElderlyProfile.findOne({ userId: dose.elderlyId });
        snoozeMinutes = profile?.preferredSnoozeMinutes || 15;
      }

      dose.status = DOSE_STATUSES.SNOOZED;
      dose.statusUpdatedAt = now;
      // Reschedule overdue threshold forward
      dose.overdueThresholdAt = new Date(now.getTime() + snoozeMinutes * 60 * 1000);
      break;
    }

    default:
      throw AppError.badRequest(`Unsupported dose action: ${action}`, ERROR_CODES.VALIDATION_ERROR);
  }

  await dose.save();

  // Record audit event in MedicationLog
  const log = await MedicationLog.create({
    doseId: dose._id,
    actedBy,
    action,
    actionTimestamp: now,
    skipReason: options.skipReason || null,
    snoozeDurationMinutes: action === DOSE_ACTIONS.SNOOZE ? (options.snoozeDurationMinutes || 15) : null,
    wasOfflineSync: options.wasOfflineSync || false
  });

  return {
    dose,
    log,
    currentStock: medication.currentStock,
    isLowStock: medication.currentStock <= medication.refillThreshold
  };
};

export const getTodayDosesForElderly = async (elderlyId) => {
  const elderly = await User.findById(elderlyId);
  if (!elderly) {
    throw AppError.notFound('Elderly user not found', ERROR_CODES.NOT_FOUND);
  }

  const timezone = elderly.timezone || 'UTC';

  // 1. Lazy reconciliation on request (Triple-Shield for sleeping free-tier backend)
  await reconcileDoses();

  // 2. Compute today's boundaries in UTC based on senior's timezone
  const { startOfDayUtc, endOfDayUtc } = getDayBoundsUtc(timezone);

  // 3. Query all scheduled doses for today
  const doses = await MedicationDose.find({
    elderlyId,
    scheduledFor: { $gte: startOfDayUtc, $lte: endOfDayUtc }
  })
    .sort({ scheduledFor: 1 })
    .populate('medicationId', 'name genericName dosage dosageUnit instructions currentStock refillThreshold colorCode pillsPerDose')
    .lean();

  return doses;
};

export const getDoseHistory = async (elderlyId, startDate, endDate) => {
  const query = { elderlyId };
  if (startDate || endDate) {
    query.scheduledFor = {};
    if (startDate) query.scheduledFor.$gte = new Date(startDate);
    if (endDate) query.scheduledFor.$lte = new Date(endDate);
  }

  const doses = await MedicationDose.find(query)
    .sort({ scheduledFor: -1 })
    .limit(100)
    .populate('medicationId', 'name dosage dosageUnit')
    .lean();

  return doses;
};

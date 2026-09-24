import { MedicationDose } from '../models/MedicationDose.js';
import { DOSE_STATUSES } from '../constants/doseStatuses.js';
import { generateDosesForActiveSchedules } from './doseGeneratorService.js';
import { sendDoseReminder, sendMissedDoseEscalation } from './notificationService.js';
import { logger } from '../utils/logger.js';

export const reconcileDoses = async () => {
  const now = new Date();
  let remindersTriggered = 0;
  let dosesMarkedMissed = 0;

  try {
    // 1. Transition pending scheduled doses whose time has arrived to 'reminder_sent'
    const dueDoses = await MedicationDose.find({
      status: DOSE_STATUSES.SCHEDULED,
      scheduledFor: { $lte: now }
    });

    for (const dose of dueDoses) {
      dose.status = DOSE_STATUSES.REMINDER_SENT;
      dose.reminderSentAt = now;
      dose.statusUpdatedAt = now;
      await dose.save();
      remindersTriggered++;

      // Dispatch high-priority reminder push to the senior
      sendDoseReminder(dose).catch((err) => {
        logger.error('Failed to dispatch dose reminder push', { doseId: dose._id, error: err.message });
      });
    }

    // 2. Transition unconfirmed doses that passed their overdueThresholdAt to 'missed'
    const missedDoses = await MedicationDose.find({
      status: {
        $in: [DOSE_STATUSES.SCHEDULED, DOSE_STATUSES.REMINDER_SENT, DOSE_STATUSES.SNOOZED]
      },
      overdueThresholdAt: { $lte: now }
    });

    for (const dose of missedDoses) {
      dose.status = DOSE_STATUSES.MISSED;
      dose.statusUpdatedAt = now;
      await dose.save();
      dosesMarkedMissed++;

      // Escalate to linked caregivers
      sendMissedDoseEscalation(dose).catch((err) => {
        logger.error('Failed to dispatch missed dose escalation push', { doseId: dose._id, error: err.message });
      });
    }

    // 3. Ensure upcoming doses exist for the next 48 hours
    const genResult = await generateDosesForActiveSchedules(48);

    logger.info('Dose reconciliation cycle completed', {
      remindersTriggered,
      dosesMarkedMissed,
      schedulesChecked: genResult.schedulesChecked
    });

    return {
      success: true,
      remindersTriggered,
      dosesMarkedMissed,
      schedulesChecked: genResult.schedulesChecked,
      reconciledAt: now.toISOString()
    };
  } catch (error) {
    logger.error('Error during dose reconciliation cycle', { error: error.message });
    throw error;
  }
};

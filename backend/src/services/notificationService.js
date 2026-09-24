import { Notification } from '../models/Notification.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { CaregiverRelationship } from '../models/CaregiverRelationship.js';
import { User } from '../models/User.js';
import { Medication } from '../models/Medication.js';
import { dispatchPushNotification } from '../notifications/notificationDispatcher.js';
import { logger } from '../utils/logger.js';

export const registerDeviceToken = async (userId, fcmToken, devicePlatform = 'android') => {
  const token = await DeviceToken.findOneAndUpdate(
    { fcmToken },
    {
      userId,
      devicePlatform,
      lastSeenAt: new Date()
    },
    { upsert: true, new: true }
  );

  return token;
};

export const unregisterDeviceToken = async (fcmToken) => {
  if (!fcmToken) return;
  await DeviceToken.deleteOne({ fcmToken });
};

export const sendDoseReminder = async (dose) => {
  const idempotencyKey = `REMINDER_${dose._id}`;

  // Idempotency check: prevent duplicate reminder push dispatches
  const existing = await Notification.findOne({ idempotencyKey });
  if (existing) {
    return { skipped: true, reason: 'Already dispatched' };
  }

  const medication = await Medication.findById(dose.medicationId);
  if (!medication) return null;

  const title = 'Time for your medication';
  const body = `Take ${medication.dosage} ${medication.dosageUnit} of ${medication.name}`;

  // Retrieve active device tokens for the elderly user
  const userTokens = await DeviceToken.find({ userId: dose.elderlyId }).lean();
  const fcmTokens = userTokens.map((t) => t.fcmToken);

  const payload = {
    title,
    body,
    data: {
      type: 'MEDICATION_REMINDER',
      doseId: dose._id.toString(),
      medicationId: medication._id.toString(),
      medicationName: medication.name
    }
  };

  const dispatchResult = await dispatchPushNotification(fcmTokens, payload);

  const notification = await Notification.create({
    recipientId: dose.elderlyId,
    doseId: dose._id,
    type: 'MEDICATION_REMINDER',
    title,
    body,
    status: dispatchResult.failedCount > 0 && dispatchResult.sentCount === 0 ? 'FAILED' : 'SENT',
    idempotencyKey,
    metadata: {
      sentCount: dispatchResult.sentCount,
      failedCount: dispatchResult.failedCount
    },
    sentAt: new Date()
  });

  return notification;
};

export const sendMissedDoseEscalation = async (dose) => {
  const elderly = await User.findById(dose.elderlyId);
  const medication = await Medication.findById(dose.medicationId);
  if (!elderly || !medication) return [];

  // Query all active linked caregivers for this elderly individual
  const relationships = await CaregiverRelationship.find({
    elderlyId: dose.elderlyId,
    status: 'accepted'
  }).lean();

  const notificationsCreated = [];

  for (const rel of relationships) {
    const caregiverId = rel.caregiverId;
    const idempotencyKey = `MISSED_ESCALATION_${dose._id}_${caregiverId}`;

    const existing = await Notification.findOne({ idempotencyKey });
    if (existing) continue;

    const title = `Missed Medication Alert: ${elderly.fullName}`;
    const body = `${elderly.fullName} has not confirmed taking ${medication.dosage} ${medication.dosageUnit} of ${medication.name}.`;

    const caregiverTokens = await DeviceToken.find({ userId: caregiverId }).lean();
    const fcmTokens = caregiverTokens.map((t) => t.fcmToken);

    const payload = {
      title,
      body,
      data: {
        type: 'MISSED_DOSE_ESCALATION',
        doseId: dose._id.toString(),
        elderlyId: elderly._id.toString(),
        elderlyName: elderly.fullName,
        medicationName: medication.name
      }
    };

    const dispatchResult = await dispatchPushNotification(fcmTokens, payload);

    const notif = await Notification.create({
      recipientId: caregiverId,
      doseId: dose._id,
      type: 'MISSED_DOSE_ESCALATION',
      title,
      body,
      status: 'SENT',
      idempotencyKey,
      metadata: { dispatchResult },
      sentAt: new Date()
    });

    notificationsCreated.push(notif);
  }

  logger.info(`Dispatched missed dose escalation to ${notificationsCreated.length} caregivers`, {
    doseId: dose._id,
    elderlyId: dose.elderlyId
  });

  return notificationsCreated;
};

export const sendLowStockAlert = async (medication) => {
  const elderly = await User.findById(medication.elderlyId);
  if (!elderly) return [];

  const relationships = await CaregiverRelationship.find({
    elderlyId: medication.elderlyId,
    status: 'accepted'
  }).lean();

  const notificationsCreated = [];

  for (const rel of relationships) {
    const caregiverId = rel.caregiverId;
    const idempotencyKey = `LOW_STOCK_${medication._id}_${medication.currentStock}_${caregiverId}`;

    const existing = await Notification.findOne({ idempotencyKey });
    if (existing) continue;

    const title = `Medication Refill Needed: ${medication.name}`;
    const body = `Only ${medication.currentStock} pills remaining of ${medication.name} for ${elderly.fullName}. Please refill soon.`;

    const caregiverTokens = await DeviceToken.find({ userId: caregiverId }).lean();
    const fcmTokens = caregiverTokens.map((t) => t.fcmToken);

    const payload = {
      title,
      body,
      data: {
        type: 'LOW_STOCK_ALERT',
        medicationId: medication._id.toString(),
        medicationName: medication.name,
        currentStock: medication.currentStock.toString()
      }
    };

    await dispatchPushNotification(fcmTokens, payload);

    const notif = await Notification.create({
      recipientId: caregiverId,
      type: 'LOW_STOCK_ALERT',
      title,
      body,
      status: 'SENT',
      idempotencyKey,
      metadata: { currentStock: medication.currentStock },
      sentAt: new Date()
    });

    notificationsCreated.push(notif);
  }

  return notificationsCreated;
};

export const getNotificationHistory = async (userId, limit = 50) => {
  return Notification.find({ recipientId: userId })
    .sort({ sentAt: -1 })
    .limit(limit)
    .lean();
};

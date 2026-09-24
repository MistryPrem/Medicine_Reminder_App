import { getMessaging } from '../config/firebase.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { logger } from '../utils/logger.js';

export const dispatchPushNotification = async (fcmTokens = [], payload) => {
  if (!fcmTokens || fcmTokens.length === 0) {
    logger.info('No active device tokens found for recipient. Push notification skipped.', {
      title: payload.title
    });
    return { sentCount: 0, failedCount: 0, prunedCount: 0 };
  }

  const messaging = getMessaging();

  // If Firebase credentials are not configured, simulate delivery safely
  if (!messaging) {
    logger.info('[FCM Mock / Dev Push Notification Dispatched]', {
      tokensCount: fcmTokens.length,
      title: payload.title,
      body: payload.body,
      data: payload.data
    });
    return { sentCount: fcmTokens.length, failedCount: 0, prunedCount: 0 };
  }

  const message = {
    tokens: fcmTokens,
    notification: {
      title: payload.title,
      body: payload.body
    },
    data: Object.fromEntries(
      Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
    ),
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'medication_reminders',
        priority: 'max'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          contentAvailable: true
        }
      }
    }
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    let prunedCount = 0;

    if (response.failureCount > 0) {
      const tokensToPrune = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            tokensToPrune.push(fcmTokens[idx]);
          }
        }
      });

      if (tokensToPrune.length > 0) {
        await DeviceToken.deleteMany({ fcmToken: { $in: tokensToPrune } });
        prunedCount = tokensToPrune.length;
        logger.info(`Pruned ${prunedCount} unregistered device tokens from database`);
      }
    }

    return {
      sentCount: response.successCount,
      failedCount: response.failureCount,
      prunedCount
    };
  } catch (error) {
    logger.error('Error dispatching multicast FCM push notification', { error: error.message });
    return { sentCount: 0, failedCount: fcmTokens.length, prunedCount: 0 };
  }
};

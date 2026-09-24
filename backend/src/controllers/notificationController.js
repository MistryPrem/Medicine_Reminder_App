import * as notificationService from '../services/notificationService.js';
import { successResponse } from '../utils/apiResponse.js';

export const registerDevice = async (req, res, next) => {
  try {
    const { fcmToken, devicePlatform } = req.body;
    const token = await notificationService.registerDeviceToken(req.user._id, fcmToken, devicePlatform);
    return successResponse(res, 'Device token registered successfully', token, 200);
  } catch (err) {
    next(err);
  }
};

export const unregisterDevice = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    await notificationService.unregisterDeviceToken(fcmToken);
    return successResponse(res, 'Device token unregistered successfully', {}, 200);
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const history = await notificationService.getNotificationHistory(req.user._id);
    return successResponse(res, 'Notification history retrieved successfully', history, 200);
  } catch (err) {
    next(err);
  }
};

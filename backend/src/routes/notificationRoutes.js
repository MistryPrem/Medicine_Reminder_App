import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  registerDeviceTokenSchema,
  unregisterDeviceTokenSchema
} from '../validators/notificationValidator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/register-device',
  validate(registerDeviceTokenSchema),
  notificationController.registerDevice
);

router.delete(
  '/unregister-device',
  validate(unregisterDeviceTokenSchema),
  notificationController.unregisterDevice
);

router.get('/history', notificationController.getHistory);

export default router;

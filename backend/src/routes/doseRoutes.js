import { Router } from 'express';
import * as doseController from '../controllers/doseController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { verifyElderlyAccess } from '../middleware/relationshipGuard.js';
import { recordDoseActionSchema } from '../validators/doseValidator.js';

const router = Router();

router.use(authenticate);

// Today's doses query (runs lazy reconciliation)
router.get(
  '/today',
  verifyElderlyAccess('view_only'),
  doseController.getTodayDoses
);

// Record dose action (Take / Skip / Snooze)
router.post(
  '/:id/action',
  validate(recordDoseActionSchema),
  doseController.recordDoseAction
);

// Dose history
router.get(
  '/history',
  verifyElderlyAccess('view_only'),
  doseController.getDoseHistory
);

export default router;

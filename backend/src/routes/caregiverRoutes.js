import { Router } from 'express';
import * as relationshipController from '../controllers/relationshipController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { verifyElderlyAccess } from '../middleware/relationshipGuard.js';
import { createInviteSchema } from '../validators/relationshipValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All caregiver routes require authentication and caregiver role
router.use(authenticate);

router.post(
  '/invitations',
  authorize(ROLES.CAREGIVER),
  validate(createInviteSchema),
  relationshipController.createInvitation
);

router.get(
  '/elderly-list',
  authorize(ROLES.CAREGIVER),
  relationshipController.getCaregiverElderlyList
);

router.get(
  '/elderly/:elderlyId/profile',
  authorize(ROLES.CAREGIVER, ROLES.ADMIN),
  verifyElderlyAccess('view_only'),
  relationshipController.getElderlyProfileById
);

export default router;

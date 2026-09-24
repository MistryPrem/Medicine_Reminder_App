import { Router } from 'express';
import * as relationshipController from '../controllers/relationshipController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { linkElderlySchema, updateElderlyProfileSchema } from '../validators/relationshipValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All elderly routes require authentication
router.use(authenticate);

router.post(
  '/link',
  authorize(ROLES.ELDERLY),
  validate(linkElderlySchema),
  relationshipController.linkElderly
);

router.get(
  '/my-profile',
  authorize(ROLES.ELDERLY),
  relationshipController.getMyProfile
);

router.patch(
  '/my-profile',
  authorize(ROLES.ELDERLY),
  validate(updateElderlyProfileSchema),
  relationshipController.updateMyProfile
);

export default router;

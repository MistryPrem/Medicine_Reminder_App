import { Router } from 'express';
import * as medicationController from '../controllers/medicationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { verifyElderlyAccess } from '../middleware/relationshipGuard.js';
import {
  createMedicationSchema,
  updateMedicationSchema,
  refillMedicationSchema
} from '../validators/medicationValidator.js';

const router = Router();

// All medication endpoints require authentication
router.use(authenticate);

// Create new medication & schedule
router.post(
  '/',
  validate(createMedicationSchema),
  verifyElderlyAccess('full'),
  medicationController.createMedication
);

// List medications for senior
router.get(
  '/',
  verifyElderlyAccess('view_only'),
  medicationController.getMedications
);

// Retrieve single medication
router.get('/:id', medicationController.getMedicationById);

// Update medication
router.patch(
  '/:id',
  validate(updateMedicationSchema),
  medicationController.updateMedication
);

// Archive (soft delete) medication
router.delete('/:id', medicationController.archiveMedication);

// Refill medication stock
router.patch(
  '/:id/refill',
  validate(refillMedicationSchema),
  medicationController.refillMedication
);

export default router;

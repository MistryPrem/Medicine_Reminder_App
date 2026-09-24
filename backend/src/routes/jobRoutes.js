import { Router } from 'express';
import * as doseController from '../controllers/doseController.js';

const router = Router();

// Public endpoint for free external heartbeat crons (e.g. Cron-Job.org / UptimeRobot)
router.get('/reconcile', doseController.triggerReconciliation);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { verifyElderlyAccess } from '../middleware/relationshipGuard.js';
import { getAdherenceStats } from '../services/analyticsService.js';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/analytics/elderly/:elderlyId/adherence?days=30
 * Returns adherence rates, current & longest streak, and daily compliance breakdown
 */
router.get(
  '/elderly/:elderlyId/adherence',
  verifyElderlyAccess('view_only'),
  async (req, res, next) => {
    try {
      const { elderlyId } = req.params;
      const days = parseInt(req.query.days, 10) || 30;
      const stats = await getAdherenceStats(elderlyId, days);
      return successResponse(res, 'Adherence analytics retrieved successfully', stats, 200);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

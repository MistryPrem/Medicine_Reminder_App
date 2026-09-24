import * as doseService from '../services/doseService.js';
import * as reconciliationService from '../services/reconciliationService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getTodayDoses = async (req, res, next) => {
  try {
    const elderlyId = req.query.elderlyId || req.user._id;
    const doses = await doseService.getTodayDosesForElderly(elderlyId);
    return successResponse(res, 'Today doses retrieved successfully', doses, 200);
  } catch (err) {
    next(err);
  }
};

export const recordDoseAction = async (req, res, next) => {
  try {
    const { action, skipReason, snoozeDurationMinutes, wasOfflineSync } = req.body;
    const result = await doseService.recordDoseAction(
      req.params.id,
      action,
      { skipReason, snoozeDurationMinutes, wasOfflineSync },
      req.user._id
    );
    return successResponse(res, `Dose marked as ${action.toLowerCase()} successfully`, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getDoseHistory = async (req, res, next) => {
  try {
    const elderlyId = req.query.elderlyId || req.user._id;
    const { startDate, endDate } = req.query;
    const history = await doseService.getDoseHistory(elderlyId, startDate, endDate);
    return successResponse(res, 'Dose history retrieved successfully', history, 200);
  } catch (err) {
    next(err);
  }
};

export const triggerReconciliation = async (req, res, next) => {
  try {
    const result = await reconciliationService.reconcileDoses();
    return successResponse(res, 'Dose reconciliation completed successfully', result, 200);
  } catch (err) {
    next(err);
  }
};

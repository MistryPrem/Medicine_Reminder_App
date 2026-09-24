import { CaregiverRelationship } from '../models/CaregiverRelationship.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ROLES } from '../constants/roles.js';

export const verifyElderlyAccess = (requiredPermission = 'view_only') => {
  return async (req, res, next) => {
    try {
      const targetElderlyId = req.params.elderlyId || req.body.elderlyId || req.query.elderlyId;

      if (!targetElderlyId) {
        throw AppError.badRequest('Elderly identifier is required', ERROR_CODES.VALIDATION_ERROR);
      }

      // 1. Admins have system-wide access
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      // 2. Elderly individuals accessing their own records
      if (req.user._id.toString() === targetElderlyId.toString()) {
        return next();
      }

      // 3. Caregiver access verification
      if (req.user.role === ROLES.CAREGIVER) {
        const relationship = await CaregiverRelationship.findOne({
          caregiverId: req.user._id,
          elderlyId: targetElderlyId,
          status: 'accepted'
        });

        if (!relationship) {
          throw AppError.forbidden(
            'You do not have an active caregiver relationship with this elderly individual',
            ERROR_CODES.FORBIDDEN
          );
        }

        if (requiredPermission === 'full' && relationship.permissions !== 'full') {
          throw AppError.forbidden(
            'Your caregiver relationship has view-only permissions for this elderly individual',
            ERROR_CODES.FORBIDDEN
          );
        }

        req.relationship = relationship;
        return next();
      }

      throw AppError.forbidden('You are not authorized to access this elderly individual', ERROR_CODES.FORBIDDEN);
    } catch (err) {
      next(err);
    }
  };
};

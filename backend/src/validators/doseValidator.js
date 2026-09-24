import { z } from 'zod';
import { DOSE_ACTIONS } from '../constants/doseStatuses.js';

export const recordDoseActionSchema = z.object({
  body: z.object({
    action: z.enum([DOSE_ACTIONS.TAKE, DOSE_ACTIONS.SKIP, DOSE_ACTIONS.SNOOZE]),
    skipReason: z.string().max(300).optional(),
    snoozeDurationMinutes: z.number().int().min(5).max(120).optional(),
    wasOfflineSync: z.boolean().optional()
  })
});

export const DOSE_STATUSES = {
  SCHEDULED: 'scheduled',
  REMINDER_SENT: 'reminder_sent',
  TAKEN: 'taken',
  SNOOZED: 'snoozed',
  SKIPPED: 'skipped',
  MISSED: 'missed'
};

export const DOSE_STATUS_LIST = Object.values(DOSE_STATUSES);

export const DOSE_ACTIONS = {
  TAKE: 'TAKEN',
  SKIP: 'SKIPPED',
  SNOOZE: 'SNOOZED',
  OVERRIDE: 'OVERRIDDEN'
};

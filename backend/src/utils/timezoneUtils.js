import { DateTime } from 'luxon';

/**
 * Returns the current DateTime object in the specified timezone
 */
export const nowInTimezone = (timezone = 'UTC') => {
  return DateTime.now().setZone(timezone);
};

/**
 * Converts a date and 24-hr time string (HH:mm) in a local timezone to a UTC Date object
 */
export const localTimeToUtc = (dateIsoOrObj, timeStr, timezone = 'UTC') => {
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const baseDate = DateTime.fromISO(
    typeof dateIsoOrObj === 'string' ? dateIsoOrObj : dateIsoOrObj.toISOString(),
    { zone: timezone }
  );

  const localDateTime = baseDate.set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  });

  return localDateTime.toUTC().toJSDate();
};

/**
 * Returns the start and end of "today" in UTC based on the user's timezone
 */
export const getDayBoundsUtc = (timezone = 'UTC', dateOffsetDays = 0) => {
  let localDay = DateTime.now().setZone(timezone);
  if (dateOffsetDays !== 0) {
    localDay = localDay.plus({ days: dateOffsetDays });
  }

  const startOfDayUtc = localDay.startOf('day').toUTC().toJSDate();
  const endOfDayUtc = localDay.endOf('day').toUTC().toJSDate();

  return { startOfDayUtc, endOfDayUtc };
};

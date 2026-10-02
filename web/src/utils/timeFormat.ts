/**
 * Time and Date formatting utilities
 * Defaults to Indian Standard Time (IST - Asia/Kolkata) with 12-hour AM/PM format,
 * while allowing automatic detection or customization based on user profile.
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata'; // Indian Standard Time (IST)

/**
 * Returns the effective timezone to use.
 * Defaults to Asia/Kolkata (IST), but respects custom specified timezone or user preference.
 */
export function getEffectiveTimeZone(customTimeZone?: string | null): string {
  if (customTimeZone && customTimeZone.trim() !== '') {
    return customTimeZone;
  }
  // Try checking localStorage for a user-overridden timezone preference
  const savedTz = typeof window !== 'undefined' ? localStorage.getItem('user_timezone') : null;
  if (savedTz) {
    return savedTz;
  }
  return DEFAULT_TIMEZONE;
}

/**
 * Formats a Date or ISO date string into 12-hour AM/PM time format.
 * Example output: "09:30 AM", "01:15 PM"
 */
export function formatTo12HourTime(
  dateOrIso: Date | string | number,
  timeZone: string = DEFAULT_TIMEZONE,
  includeSeconds: boolean = false
): string {
  if (!dateOrIso) return '';
  const date = typeof dateOrIso === 'string' || typeof dateOrIso === 'number' ? new Date(dateOrIso) : dateOrIso;
  
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
    timeZone: timeZone || DEFAULT_TIMEZONE
  });
}

/**
 * Converts a 24-hour time string ("HH:MM" or "HH:MM:SS") into a 12-hour format string ("hh:mm AM/PM").
 * Example: "08:00" -> "8:00 AM", "14:30" -> "2:30 PM", "00:15" -> "12:15 AM"
 */
export function format24HourStringTo12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  const hours24 = parseInt(parts[0], 10);
  const minutes = parts[1];

  if (isNaN(hours24)) return timeStr;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  return `${hours12}:${minutes} ${period}`;
}

/**
 * Formats a date into a localized friendly string with weekday, day, and month.
 * Example: "Friday, Oct 2"
 */
export function formatFriendlyDate(
  dateOrIso: Date | string | number = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): string {
  const date = typeof dateOrIso === 'string' || typeof dateOrIso === 'number' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: timeZone || DEFAULT_TIMEZONE
  });
}

/**
 * Returns current date and time formatted in IST 12-hour AM/PM with timezone suffix
 * Example: "1:05 PM IST"
 */
export function getCurrentFormattedTimeWithZone(timeZone: string = DEFAULT_TIMEZONE): string {
  const timeStr = formatTo12HourTime(new Date(), timeZone);
  const zoneShort = timeZone === 'Asia/Kolkata' ? 'IST' : timeZone;
  return `${timeStr} (${zoneShort})`;
}

import moment from 'moment-timezone';

// Dominican Republic timezone
export const DOMINICAN_TIMEZONE = 'America/Santo_Domingo';

/**
 * Get current time in Dominican timezone
 */
export const getDominicanTime = (): Date => {
  return moment().tz(DOMINICAN_TIMEZONE).toDate();
};

/**
 * Convert any date to Dominican timezone
 */
export const toDominicanTime = (date: Date | string): Date => {
  return moment(date).tz(DOMINICAN_TIMEZONE).toDate();
};

/**
 * Format date in Dominican timezone
 */
export const formatDominicanTime = (
  date: Date | string,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  return moment(date).tz(DOMINICAN_TIMEZONE).format(format);
};

/**
 * Get Dominican timezone offset
 */
export const getDominicanOffset = (): string => {
  return moment().tz(DOMINICAN_TIMEZONE).format('Z');
};

/**
 * Check if it's business hours in Dominican Republic (8 AM - 6 PM)
 */
export const isDominicanBusinessHours = (): boolean => {
  const now = moment().tz(DOMINICAN_TIMEZONE);
  const hour = now.hour();
  return hour >= 8 && hour < 18;
};
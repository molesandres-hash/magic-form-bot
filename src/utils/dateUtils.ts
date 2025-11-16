/**
 * Date utility functions for Italian course data processing
 */

/** Italian month names */
export const MESI_ITALIANI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

/** Italian day names */
export const GIORNI_ITALIANI = [
  'Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'
];

/**
 * Parses a date string in DD/MM/YYYY format to a Date object
 *
 * @param dateStr - Date string in format DD/MM/YYYY (e.g., "25/12/2025")
 * @returns Date object, or current date if parsing fails
 *
 * @example
 * parseDate("25/12/2025") // Returns Date object for December 25, 2025
 */
export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  console.warn(`Invalid date format: ${dateStr}, using current date`);
  return new Date();
}

/**
 * Formats a Date object to Italian date string format
 *
 * @param date - Date object to format
 * @returns Formatted date string in DD/MM/YYYY format
 *
 * @example
 * formatDate(new Date(2025, 11, 25)) // Returns "25/12/2025"
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Gets the Italian month name from a date
 *
 * @param date - Date object
 * @returns Italian month name (e.g., "Gennaio")
 */
export function getItalianMonth(date: Date): string {
  return MESI_ITALIANI[date.getMonth()];
}

/**
 * Gets the Italian day name from a date
 *
 * @param date - Date object
 * @returns Italian day name (e.g., "Lunedì")
 */
export function getItalianDayName(date: Date): string {
  return GIORNI_ITALIANI[date.getDay()];
}

/**
 * Extracts year from a date string in DD/MM/YYYY format
 *
 * @param dateStr - Date string in format DD/MM/YYYY
 * @returns Year as string, or empty string if invalid
 */
export function extractYear(dateStr: string): string {
  const parts = dateStr.split('/');
  return parts.length === 3 ? parts[2] : '';
}

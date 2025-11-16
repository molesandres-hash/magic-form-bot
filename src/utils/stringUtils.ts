/**
 * String parsing utilities for course data
 */

/**
 * Parses capacity string in format "current/total" (e.g., "15/20")
 *
 * @param capienza - Capacity string in format "current/total"
 * @returns Object with current and total capacity numbers
 *
 * @example
 * parseCapienza("15/20") // Returns { current: 15, total: 20 }
 * parseCapienza("invalid") // Returns { current: 0, total: 0 }
 */
export function parseCapienza(capienza: string): { current: number; total: number } {
  const match = capienza.match(/(\d+)\/(\d+)/);
  if (match) {
    return {
      current: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
    };
  }
  return { current: 0, total: 0 };
}

/**
 * Splits a full name into first name and last name
 * Assumes format "FirstName LastName" or "FirstName MiddleName LastName"
 *
 * @param fullName - Full name string
 * @returns Object with nome (first name) and cognome (last name)
 *
 * @example
 * splitFullName("Mario Rossi") // Returns { nome: "Mario", cognome: "Rossi" }
 * splitFullName("Maria Anna Bianchi") // Returns { nome: "Maria", cognome: "Anna Bianchi" }
 */
export function splitFullName(fullName: string): { nome: string; cognome: string } {
  const parts = (fullName || '').trim().split(' ');
  return {
    nome: parts[0] || '',
    cognome: parts.slice(1).join(' ') || '',
  };
}

/**
 * Combines first name and last name into full name
 *
 * @param nome - First name
 * @param cognome - Last name
 * @returns Full name string
 *
 * @example
 * combineFullName("Mario", "Rossi") // Returns "Mario Rossi"
 */
export function combineFullName(nome: string, cognome: string): string {
  return `${nome} ${cognome}`.trim();
}

/**
 * Cleans and normalizes a string by trimming and removing extra spaces
 *
 * @param str - String to clean
 * @returns Cleaned string
 */
export function cleanString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

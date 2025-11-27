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

/**
 * Extracts the city name from a location string.
 * Heuristic: Splits by common separators (comma, dash) and returns the first part
 * that doesn't look like an address (e.g. contains numbers).
 *
 * @param location - The full location string (e.g. "Milano - Via Roma 1")
 * @returns The extracted city name (e.g. "Milano")
 */
export function extractCityName(location: string | undefined | null): string {
  if (!location) return '';

  // Normalize
  const clean = location.trim();
  if (!clean) return '';

  // Split by common separators: " - ", ", ", " ("
  // We want to find the part that is most likely the city.
  // Often format is "City - Address" or "Address, City" or "City (Prov)"

  // Strategy 1: If it contains " - ", assume "City - Address" or "Address - City"
  // But usually in this app it seems to be "City - Address" based on user request "MILANO (VARESE)" -> "MILANO"

  // Let's try splitting by non-alphanumeric separators that might delimit city/address
  const parts = clean.split(/[\-\,]/).map(p => p.trim()).filter(Boolean);

  if (parts.length === 0) return clean;

  // Return the first part. 
  // The user example "FIX ALSO {{VERBALE_LUOGO} AND LET THAT HERE SHOULD BE SAVED ONLY THE CIY (MILANO) (VARESE)"
  // implies that if the input is "MILANO (VARESE)" or "MILANO - VIA ROMA", we want "MILANO".
  // If the input is just "MILANO", we want "MILANO".

  // If there are parentheses, remove them and their content if it looks like a province?
  // User said "(MILANO) (VARESE)", maybe they meant examples of output?
  // "LET THAT HERE SHOULD BE SAVED ONLY THE CIY (MILANO) (VARESE)"
  // I interpret this as: if the value is "Milano - Via X", output "Milano".

  // Let's take the first part of split by " - " or ",".
  const firstPart = parts[0];

  // Also remove anything in parentheses if present in that first part?
  // e.g. "Milano (MI)" -> "Milano"
  return firstPart.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
}

/**
 * Extracts Meeting ID and Passcode from a Zoom link
 */
export function extractZoomDetails(link: string): { id: string; passcode: string } {
  if (!link) return { id: '', passcode: '' };

  let id = '';
  let passcode = '';

  // Extract ID (usually 9-11 digits)
  // Format: /j/123456789 or /my/123456789
  const idMatch = link.match(/\/j\/(\d+)/) || link.match(/\/my\/(\d+)/) || link.match(/(\d{9,11})/);
  if (idMatch) {
    id = idMatch[1];
    // Format ID with spaces for readability (e.g. 123 456 789)
    id = id.replace(/(\d{3})(?=\d)/g, '$1 ');
  }

  // Extract Passcode (pwd=...)
  const pwdMatch = link.match(/[?&]pwd=([^&]+)/);
  if (pwdMatch) {
    passcode = pwdMatch[1];
  }

  return { id, passcode };
}

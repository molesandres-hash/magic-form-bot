/**
 * Validation utilities for Italian course data
 * Shared between frontend and backend (Edge Functions)
 */

/**
 * Validates an Italian Codice Fiscale (Tax Code)
 * Format: 6 letters + 2 digits + 1 letter + 2 digits + 1 letter + 3 digits + 1 letter
 * Example: RSSMRA80A01H501Z
 *
 * @param cf - The Codice Fiscale to validate
 * @returns true if valid, false otherwise
 */
export function validateCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false;
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  return regex.test(cf.toUpperCase());
}

/**
 * Validates an email address
 * Basic email format validation
 *
 * @param email - The email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validates an Italian phone number
 * Accepts formats: 3331234567, 333 123 4567, 333-123-4567
 * With or without leading 0
 *
 * @param phone - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-]/g, '');
  return /^0?\d{9,10}$/.test(cleaned);
}

/**
 * Validates all participant fields
 * Returns validation status for Codice Fiscale, email, and phone
 *
 * @param participant - Participant object with codice_fiscale, email, telefono
 * @returns Object with validation results for each field
 */
export function validatePartecipante(participant: {
  codice_fiscale?: string;
  email?: string;
  telefono?: string;
}): {
  cf_valid: boolean;
  email_valid: boolean;
  phone_valid: boolean;
} {
  return {
    cf_valid: validateCodiceFiscale(participant.codice_fiscale || ''),
    email_valid: validateEmail(participant.email || ''),
    phone_valid: validatePhone(participant.telefono || ''),
  };
}

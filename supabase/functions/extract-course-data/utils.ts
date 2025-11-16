/**
 * Utility functions for processing extracted course data
 */

import type {
  RawCorso,
  RawModulo,
  RawSessione,
  RawPartecipante,
  RawTrainer,
  ProcessedCorso,
  ProcessedModulo,
  ProcessedSessione,
  ProcessedPartecipante,
  ProcessedTrainer,
  Metadata,
} from './types.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const MESI_ITALIANI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const GIORNI_ITALIANI = [
  'Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates an Italian Codice Fiscale (Tax Code)
 * Format: 6 letters + 2 digits + 1 letter + 2 digits + 1 letter + 3 digits + 1 letter
 *
 * @param cf - The Codice Fiscale to validate
 * @returns true if valid, false otherwise
 */
function validateCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false;
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  return regex.test(cf.toUpperCase());
}

/**
 * Validates an email address
 *
 * @param email - The email address to validate
 * @returns true if valid, false otherwise
 */
function validateEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validates an Italian phone number
 *
 * @param phone - The phone number to validate
 * @returns true if valid, false otherwise
 */
function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-]/g, '');
  return /^0?\d{9,10}$/.test(cleaned);
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parses capacity string in format "current/total"
 *
 * @param capienza - Capacity string (e.g., "15/20")
 * @returns Object with current and total capacity
 */
function parseCapienza(capienza: string): { current: number; total: number } {
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
 * Parses date string in DD/MM/YYYY format
 *
 * @param dateStr - Date string (e.g., "25/12/2025")
 * @returns Date object
 */
function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  console.warn(`Invalid date format: ${dateStr}`);
  return new Date();
}

/**
 * Extracts year from date string in DD/MM/YYYY format
 *
 * @param dateStr - Date string
 * @returns Year as string
 */
function extractYear(dateStr: string): string {
  const parts = dateStr.split('/');
  return parts.length === 3 ? parts[2] : '';
}

// ============================================================================
// SESSION DETECTION
// ============================================================================

/**
 * Determines if a session is FAD (online/distance learning)
 *
 * @param tipo_sede - Type of venue
 * @param sede - Venue name
 * @returns true if FAD session
 */
function isFAD(tipo_sede: string, sede: string): boolean {
  const tipo = (tipo_sede || '').toLowerCase();
  const sedeLower = (sede || '').toLowerCase();
  return tipo.includes('online') || tipo.includes('fad') ||
         sedeLower.includes('online') || sedeLower.includes('fad');
}

// ============================================================================
// PROCESSING FUNCTIONS
// ============================================================================

/**
 * Processes raw corso data to add calculated fields
 *
 * @param corso - Raw corso data from AI
 * @returns Processed corso with anno, capienza_numero, capienza_totale
 */
export function processCorso(corso: RawCorso): ProcessedCorso {
  const { current, total } = parseCapienza(corso.capienza || '0/0');

  return {
    ...corso,
    anno: corso.data_inizio ? extractYear(corso.data_inizio) : '',
    capienza_numero: current,
    capienza_totale: total,
  };
}

/**
 * Processes raw trainer data to split full name
 *
 * @param trainer - Raw trainer data
 * @returns Processed trainer with nome and cognome
 */
export function processTrainer(trainer: RawTrainer): ProcessedTrainer {
  const parts = (trainer.nome_completo || '').trim().split(' ');
  return {
    ...trainer,
    nome: parts[0] || '',
    cognome: parts.slice(1).join(' ') || '',
  };
}

/**
 * Processes raw partecipanti array to add validations and numbering
 *
 * @param partecipanti - Array of raw participant data
 * @returns Array of processed participants with validations
 */
export function processPartecipanti(partecipanti: RawPartecipante[]): ProcessedPartecipante[] {
  return partecipanti.map((p, index) => ({
    ...p,
    numero: index + 1,
    nome_completo: `${p.nome} ${p.cognome}`,
    _validations: {
      cf_valid: validateCodiceFiscale(p.codice_fiscale),
      email_valid: validateEmail(p.email),
      phone_valid: validatePhone(p.telefono),
    },
  }));
}

/**
 * Filters sessions to only include in-person (non-FAD) sessions
 *
 * @param sessioni_raw - Array of raw sessions
 * @returns Filtered array with only in-person sessions
 */
export function filterSessioniPresenza(sessioni_raw: RawSessione[]): RawSessione[] {
  return sessioni_raw.filter(sess => !isFAD(sess.tipo_sede || '', sess.sede || ''));
}

/**
 * Generates processed sessions from raw session data
 *
 * @param sessioni_raw - Array of raw sessions
 * @returns Array of processed sessions with date components
 */
export function generateSessioni(sessioni_raw: RawSessione[]): ProcessedSessione[] {
  return sessioni_raw.map((sess, idx) => {
    const date = parseDate(sess.data);

    return {
      numero: idx + 1,
      data_completa: sess.data,
      giorno: date.getDate().toString(),
      mese: MESI_ITALIANI[date.getMonth()],
      mese_numero: (date.getMonth() + 1).toString().padStart(2, '0'),
      anno: date.getFullYear().toString(),
      giorno_settimana: GIORNI_ITALIANI[date.getDay()],
      ora_inizio_giornata: sess.ora_inizio || '09:00',
      ora_fine_giornata: sess.ora_fine || '18:00',
      sede: sess.sede || '',
      tipo_sede: sess.tipo_sede || '',
      is_fad: isFAD(sess.tipo_sede || '', sess.sede || ''),
    };
  });
}

/**
 * Processes raw modulo data with sessions
 *
 * @param modulo - Raw modulo data
 * @returns Processed modulo with sessions and calculated fields
 */
export function processModulo(modulo: RawModulo): ProcessedModulo {
  const sessioni_modulo_raw = modulo.sessioni_raw || [];
  const sessioni_modulo = generateSessioni(sessioni_modulo_raw);
  const sessioni_presenza_modulo_raw = filterSessioniPresenza(sessioni_modulo_raw);
  const sessioni_presenza_modulo = generateSessioni(sessioni_presenza_modulo_raw);
  const { current, total } = parseCapienza(modulo.capienza || '0/0');

  return {
    id: modulo.id || '',
    titolo: modulo.titolo || '',
    id_corso: modulo.id_corso || '',
    id_sezione: modulo.id_sezione || '',
    data_inizio: modulo.data_inizio || '',
    data_fine: modulo.data_fine || '',
    ore_totali: modulo.ore_totali || '',
    durata: modulo.durata || '',
    ore_rendicontabili: modulo.ore_rendicontabili || '',
    capienza: modulo.capienza || '0/0',
    capienza_numero: current,
    capienza_totale: total,
    stato: modulo.stato || '',
    tipo_sede: modulo.tipo_sede || '',
    provider: modulo.provider || '',
    numero_sessioni: sessioni_modulo.length,
    sessioni: sessioni_modulo,
    sessioni_presenza: sessioni_presenza_modulo,
  };
}

// ============================================================================
// METADATA GENERATION
// ============================================================================

/**
 * Counts filled fields in the extracted data
 *
 * @param data - Partial extraction data
 * @returns Number of filled fields
 */
function countFilledFields(data: {
  corso?: ProcessedCorso;
  moduli?: ProcessedModulo[];
  partecipanti?: ProcessedPartecipante[];
  sessioni?: ProcessedSessione[];
}): number {
  let count = 0;

  if (data.corso?.id) count++;
  if (data.corso?.titolo) count++;
  if (data.moduli && data.moduli.length > 0) count += data.moduli.length;
  if (data.partecipanti && data.partecipanti.length > 0) count += data.partecipanti.length;
  if (data.sessioni && data.sessioni.length > 0) count += data.sessioni.length;

  return count;
}

/**
 * Generates metadata for extracted data
 *
 * @param data - Extraction data
 * @returns Metadata object with warnings and completion percentage
 */
export function generateMetadata(data: {
  corso: ProcessedCorso;
  moduli: ProcessedModulo[];
  partecipanti: ProcessedPartecipante[];
  sessioni: ProcessedSessione[];
}): Metadata {
  const campi_mancanti: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!data.corso?.id) campi_mancanti.push('corso.id');
  if (!data.corso?.titolo) campi_mancanti.push('corso.titolo');
  if (!data.partecipanti || data.partecipanti.length === 0) {
    campi_mancanti.push('partecipanti');
  }

  // Validate participants
  data.partecipanti?.forEach((p, idx) => {
    if (!p._validations.cf_valid) {
      warnings.push(`Partecipante ${idx + 1}: Codice Fiscale non valido (${p.codice_fiscale})`);
    }
    if (!p._validations.email_valid) {
      warnings.push(`Partecipante ${idx + 1}: Email non valida (${p.email})`);
    }
  });

  // Calculate completion percentage
  const total_fields = 50;
  const filled_fields = countFilledFields(data);
  const completamento_percentuale = Math.round((filled_fields / total_fields) * 100);

  return {
    data_estrazione: new Date().toISOString(),
    versione_sistema: '2.0.0',
    utente: '',
    completamento_percentuale,
    campi_mancanti,
    warnings,
  };
}

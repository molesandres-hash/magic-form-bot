/**
 * Robust Helper Utilities
 *
 * Purpose: Provide safe, error-resistant helper functions
 * - Safe data access with fallbacks
 * - Retry logic for flaky operations
 * - Data sanitization and normalization
 * - Recovery strategies
 */

import { toast } from 'sonner';

// ============================================================================
// SAFE DATA ACCESS
// ============================================================================

/**
 * Safely gets nested property with fallback
 * Example: safeGet(obj, 'a.b.c', 'default')
 */
export function safeGet(obj: any, path: string, defaultValue: any = null): any {
  try {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely sets nested property
 * Creates intermediate objects if needed
 */
export function safeSet(obj: any, path: string, value: any): void {
  try {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  } catch (error) {
    console.error('Error setting value:', error);
  }
}

/**
 * Safely parses JSON with fallback
 */
export function safeJSONParse<T = any>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    console.warn('JSON parse failed, returning fallback');
    return fallback;
  }
}

/**
 * Safely stringifies with error handling
 */
export function safeJSONStringify(
  obj: any,
  pretty: boolean = false
): string {
  try {
    return JSON.stringify(obj, null, pretty ? 2 : 0);
  } catch (error) {
    console.error('JSON stringify failed:', error);
    return '{}';
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retries an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

      console.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms...`,
        error
      );

      if (onRetry) {
        onRetry(attempt, error);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Retries with user feedback
 */
export async function withRetryAndToast<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(operation, {
    ...options,
    onRetry: (attempt, error) => {
      toast.error(`${operationName} fallito (tentativo ${attempt})`, {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// DATA NORMALIZATION
// ============================================================================

/**
 * Normalizes date string to DD/MM/YYYY
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';

  try {
    // Try parsing various formats
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      // Try DD/MM/YYYY format
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return dateStr;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Normalizes time string to HH:MM
 */
export function normalizeTime(timeStr: string): string {
  if (!timeStr) return '';

  try {
    // Remove spaces and normalize separators
    const cleaned = timeStr.trim().replace(/[.:]/g, ':');

    // Extract hours and minutes
    const parts = cleaned.split(':');
    if (parts.length >= 2) {
      const hours = String(parseInt(parts[0])).padStart(2, '0');
      const minutes = String(parseInt(parts[1])).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    return timeStr;
  } catch {
    return timeStr;
  }
}

/**
 * Normalizes codice fiscale (uppercase, no spaces)
 */
export function normalizeCodiceFiscale(cf: string): string {
  if (!cf) return '';
  return cf.toUpperCase().replace(/\s/g, '');
}

/**
 * Normalizes email (lowercase, trimmed)
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

// ============================================================================
// VALIDATION WITH FEEDBACK
// ============================================================================

/**
 * Validates and normalizes course data
 * Returns normalized data with validation warnings
 */
export function validateAndNormalizeData(data: any): {
  normalizedData: any;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  const normalized = JSON.parse(JSON.stringify(data));

  // Normalize corso
  if (normalized.corso) {
    if (normalized.corso.data_inizio) {
      normalized.corso.data_inizio = normalizeDate(normalized.corso.data_inizio);
    }
    if (normalized.corso.data_fine) {
      normalized.corso.data_fine = normalizeDate(normalized.corso.data_fine);
    }

    if (!normalized.corso.id) {
      errors.push('ID Corso mancante');
    }
    if (!normalized.corso.titolo) {
      warnings.push('Titolo corso mancante');
    }
  } else {
    errors.push('Sezione "corso" mancante');
  }

  // Normalize partecipanti
  if (normalized.partecipanti && Array.isArray(normalized.partecipanti)) {
    normalized.partecipanti = normalized.partecipanti.map((p: any, idx: number) => {
      const normalizedP = { ...p };

      if (p.codice_fiscale) {
        normalizedP.codice_fiscale = normalizeCodiceFiscale(p.codice_fiscale);
      } else {
        warnings.push(`Partecipante ${idx + 1}: Codice fiscale mancante`);
      }

      if (p.email) {
        normalizedP.email = normalizeEmail(p.email);
      }

      return normalizedP;
    });
  } else {
    warnings.push('Nessun partecipante trovato');
  }

  // Normalize sessioni
  if (normalized.sessioni && Array.isArray(normalized.sessioni)) {
    normalized.sessioni = normalized.sessioni.map((s: any) => {
      const normalizedS = { ...s };

      if (s.data_completa) {
        normalizedS.data_completa = normalizeDate(s.data_completa);
      }
      if (s.ora_inizio_giornata) {
        normalizedS.ora_inizio_giornata = normalizeTime(s.ora_inizio_giornata);
      }
      if (s.ora_fine_giornata) {
        normalizedS.ora_fine_giornata = normalizeTime(s.ora_fine_giornata);
      }

      return normalizedS;
    });
  }

  return {
    normalizedData: normalized,
    warnings,
    errors,
  };
}

// ============================================================================
// ERROR RECOVERY
// ============================================================================

/**
 * Attempts to recover data from multiple sources
 */
export function recoverData(): any | null {
  const sources = [
    // 1. Auto-save
    () => {
      const autoSave = localStorage.getItem('magic_form_bot_autosave');
      return autoSave ? JSON.parse(autoSave) : null;
    },
    // 2. Last export
    () => {
      const lastExport = localStorage.getItem('magic_form_bot_last_export');
      return lastExport ? JSON.parse(lastExport) : null;
    },
    // 3. Session storage
    () => {
      const session = sessionStorage.getItem('current_course_data');
      return session ? JSON.parse(session) : null;
    },
  ];

  for (const source of sources) {
    try {
      const data = source();
      if (data) {
        console.log('Data recovered from source');
        return data;
      }
    } catch (error) {
      console.warn('Recovery source failed:', error);
    }
  }

  return null;
}

/**
 * Merges partial data with defaults
 */
export function mergeWithDefaults(partial: any, defaults: any): any {
  const merged = { ...defaults };

  for (const key in partial) {
    if (partial[key] !== null && partial[key] !== undefined) {
      if (
        typeof partial[key] === 'object' &&
        !Array.isArray(partial[key]) &&
        typeof defaults[key] === 'object' &&
        !Array.isArray(defaults[key])
      ) {
        // Recursively merge objects
        merged[key] = mergeWithDefaults(partial[key], defaults[key] || {});
      } else {
        merged[key] = partial[key];
      }
    }
  }

  return merged;
}

// ============================================================================
// SAFE FILE OPERATIONS
// ============================================================================

/**
 * Safely reads file as text
 */
export async function safeReadFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Impossibile leggere il file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validates file type and size
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[];
    maxSizeMB?: number;
  } = {}
): { isValid: boolean; error?: string } {
  const { allowedTypes, maxSizeMB } = options;

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Tipo file non valido. Permessi: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (maxSizeMB) {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        isValid: false,
        error: `File troppo grande (max ${maxSizeMB}MB)`,
      };
    }
  }

  return { isValid: true };
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttles a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

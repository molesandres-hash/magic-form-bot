/**
 * Centralized Error Handling Utility
 *
 * Purpose: Provides standardized error handling across the application
 * Ensures consistent error logging, user messaging, and error classification
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Each function handles one error-related task
 * - DRY: Common error patterns extracted to reusable functions
 * - Named Constants: Error types and messages clearly defined
 * - Error Context: Provides detailed error information for debugging
 * - User-Friendly: Translates technical errors to Italian user messages
 *
 * Why Centralized: Maintains consistent error handling patterns across all services
 */

import { toast } from 'sonner';

// ============================================================================
// CONSTANTS - Error Types and Categories
// ============================================================================

/**
 * Error Categories
 * Why: Helps classify errors for appropriate handling and logging
 */
export enum ErrorCategory {
  API = 'API',                   // External API errors (Google Gemini)
  VALIDATION = 'VALIDATION',     // User input validation errors
  NETWORK = 'NETWORK',           // Network connectivity errors
  AUTHENTICATION = 'AUTH',       // Authentication/authorization errors
  GENERATION = 'GENERATION',     // Document generation errors
  PARSING = 'PARSING',           // Data parsing errors
  STORAGE = 'STORAGE',           // Local/session storage errors
  UNKNOWN = 'UNKNOWN',           // Unclassified errors
}

/**
 * Error Severity Levels
 * Why: Determines logging level and user notification strategy
 */
export enum ErrorSeverity {
  LOW = 'LOW',         // Minor issues, user can continue
  MEDIUM = 'MEDIUM',   // Significant issues, user should be aware
  HIGH = 'HIGH',       // Critical issues, operation cannot continue
  FATAL = 'FATAL',     // System-level failures requiring attention
}

// ============================================================================
// CONSTANTS - Common Error Messages (Italian)
// ============================================================================

/**
 * User-facing error messages in Italian
 * Why: Centralizes all error messages for easy translation
 */
export const ERROR_MESSAGES = {
  // API Errors
  API_KEY_MISSING: 'Chiave API mancante',
  API_KEY_INVALID: 'Chiave API non valida o scaduta',
  API_QUOTA_EXCEEDED: 'Limite di richieste API raggiunto',
  API_TIMEOUT: 'Timeout della richiesta API',
  API_RATE_LIMIT: 'Troppe richieste, riprova tra qualche secondo',
  API_GENERIC: 'Errore di comunicazione con il servizio AI',

  // Network Errors
  NETWORK_OFFLINE: 'Connessione internet non disponibile',
  NETWORK_TIMEOUT: 'Timeout di rete, verifica la connessione',
  NETWORK_GENERIC: 'Errore di rete durante l\'operazione',

  // Validation Errors
  VALIDATION_REQUIRED: 'Campo obbligatorio mancante',
  VALIDATION_INVALID: 'Dati non validi',
  VALIDATION_FORMAT: 'Formato dati non corretto',

  // Generation Errors
  GENERATION_WORD: 'Errore durante la generazione del documento Word',
  GENERATION_EXCEL: 'Errore durante la generazione del file Excel',
  GENERATION_ZIP: 'Errore durante la creazione del pacchetto ZIP',
  GENERATION_GENERIC: 'Errore durante la generazione del documento',

  // Parsing Errors
  PARSING_JSON: 'Errore durante la lettura dei dati JSON',
  PARSING_DATA: 'Dati ricevuti non validi o incompleti',

  // Generic
  GENERIC: 'Si è verificato un errore imprevisto',
  RETRY: 'Riprova tra qualche secondo',
} as const;

/**
 * Error descriptions (additional context for users)
 * Why: Provides actionable guidance to users
 */
export const ERROR_DESCRIPTIONS = {
  API_KEY_MISSING: 'Configura la chiave API nelle impostazioni',
  API_KEY_INVALID: 'Verifica che la chiave API sia corretta e attiva',
  API_QUOTA_EXCEEDED: 'Hai esaurito le richieste gratuite. Riprova domani o aggiorna il piano',
  API_TIMEOUT: 'Il servizio AI sta impiegando troppo tempo. Riprova con dati più piccoli',
  API_RATE_LIMIT: 'Attendi qualche secondo prima di riprovare',

  NETWORK_OFFLINE: 'Controlla la connessione internet e riprova',
  NETWORK_TIMEOUT: 'Il server non risponde. Controlla la connessione e riprova',

  VALIDATION_REQUIRED: 'Compila tutti i campi obbligatori prima di procedere',
  VALIDATION_INVALID: 'Controlla i dati inseriti e riprova',

  GENERATION_WORD: 'Contatta il supporto se il problema persiste',
  GENERATION_EXCEL: 'Contatta il supporto se il problema persiste',
  GENERATION_ZIP: 'Verifica lo spazio disponibile e riprova',

  PARSING_JSON: 'I dati ricevuti sono corrotti. Riprova',
  PARSING_DATA: 'Verifica che i dati copiati siano completi',

  GENERIC: 'Se il problema persiste, contatta il supporto',
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Structured error information
 * Why: Provides comprehensive error context for logging and handling
 */
export interface ErrorInfo {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;            // User-facing message (Italian)
  description?: string;       // Additional context for user
  technicalDetails?: string;  // Technical error details (for logs)
  originalError?: Error;      // Original error object
  context?: Record<string, any>; // Additional context data
  timestamp: string;          // ISO timestamp
}

/**
 * Error handling options
 * Why: Allows customization of error handling behavior
 */
export interface ErrorHandlingOptions {
  showToast?: boolean;        // Show toast notification (default: true)
  logToConsole?: boolean;     // Log to console (default: true)
  rethrow?: boolean;          // Re-throw after handling (default: false)
  customMessage?: string;     // Override default message
  customDescription?: string; // Override default description
  context?: Record<string, any>; // Additional context for logging
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Classifies an error into a category based on error message and type
 * Why: Enables appropriate error handling based on error type
 *
 * @param error - Error object or message
 * @returns ErrorCategory
 */
export function classifyError(error: Error | string): ErrorCategory {
  const errorMessage = typeof error === 'string' ? error : error.message.toLowerCase();

  // API errors
  if (errorMessage.includes('api key') || errorMessage.includes('apikey')) {
    return ErrorCategory.AUTHENTICATION;
  }
  if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
    return ErrorCategory.API;
  }
  if (errorMessage.includes('gemini') || errorMessage.includes('api')) {
    return ErrorCategory.API;
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return ErrorCategory.NETWORK;
  }
  if (errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return ErrorCategory.NETWORK;
  }

  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return ErrorCategory.VALIDATION;
  }
  if (errorMessage.includes('required') || errorMessage.includes('missing')) {
    return ErrorCategory.VALIDATION;
  }

  // Generation errors
  if (errorMessage.includes('document') || errorMessage.includes('generation')) {
    return ErrorCategory.GENERATION;
  }
  if (errorMessage.includes('word') || errorMessage.includes('excel') || errorMessage.includes('zip')) {
    return ErrorCategory.GENERATION;
  }

  // Parsing errors
  if (errorMessage.includes('parse') || errorMessage.includes('json')) {
    return ErrorCategory.PARSING;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Determines error severity based on category and error details
 * Why: Helps prioritize error handling and logging
 *
 * @param category - Error category
 * @param error - Error object
 * @returns ErrorSeverity
 */
export function determineSeverity(category: ErrorCategory, error: Error | string): ErrorSeverity {
  const errorMessage = typeof error === 'string' ? error : error.message.toLowerCase();

  // Fatal errors
  if (errorMessage.includes('fatal') || errorMessage.includes('critical')) {
    return ErrorSeverity.FATAL;
  }

  // High severity
  if (category === ErrorCategory.AUTHENTICATION) {
    return ErrorSeverity.HIGH;
  }
  if (errorMessage.includes('quota exceeded')) {
    return ErrorSeverity.HIGH;
  }

  // Medium severity
  if (category === ErrorCategory.API || category === ErrorCategory.NETWORK) {
    return ErrorSeverity.MEDIUM;
  }
  if (category === ErrorCategory.GENERATION) {
    return ErrorSeverity.MEDIUM;
  }

  // Low severity
  if (category === ErrorCategory.VALIDATION) {
    return ErrorSeverity.LOW;
  }

  return ErrorSeverity.MEDIUM; // Default to medium
}

// ============================================================================
// USER-FRIENDLY MESSAGE MAPPING
// ============================================================================

/**
 * Maps technical error to user-friendly Italian message
 * Why: Provides clear, actionable feedback to users
 *
 * @param error - Error object or message
 * @param category - Error category
 * @returns Object with title and description
 */
export function getUserFriendlyMessage(
  error: Error | string,
  category: ErrorCategory
): { title: string; description: string } {
  const errorMessage = typeof error === 'string' ? error : error.message.toLowerCase();

  // API Key errors
  if (errorMessage.includes('api key not found') || errorMessage.includes('missing')) {
    return {
      title: ERROR_MESSAGES.API_KEY_MISSING,
      description: ERROR_DESCRIPTIONS.API_KEY_MISSING,
    };
  }
  if (errorMessage.includes('api key') && errorMessage.includes('invalid')) {
    return {
      title: ERROR_MESSAGES.API_KEY_INVALID,
      description: ERROR_DESCRIPTIONS.API_KEY_INVALID,
    };
  }

  // Quota errors
  if (errorMessage.includes('quota')) {
    return {
      title: ERROR_MESSAGES.API_QUOTA_EXCEEDED,
      description: ERROR_DESCRIPTIONS.API_QUOTA_EXCEEDED,
    };
  }

  // Rate limit
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return {
      title: ERROR_MESSAGES.API_RATE_LIMIT,
      description: ERROR_DESCRIPTIONS.API_RATE_LIMIT,
    };
  }

  // Network errors
  if (category === ErrorCategory.NETWORK) {
    if (errorMessage.includes('timeout')) {
      return {
        title: ERROR_MESSAGES.NETWORK_TIMEOUT,
        description: ERROR_DESCRIPTIONS.NETWORK_TIMEOUT,
      };
    }
    return {
      title: ERROR_MESSAGES.NETWORK_GENERIC,
      description: ERROR_DESCRIPTIONS.NETWORK_OFFLINE,
    };
  }

  // Validation errors
  if (category === ErrorCategory.VALIDATION) {
    if (errorMessage.includes('required')) {
      return {
        title: ERROR_MESSAGES.VALIDATION_REQUIRED,
        description: ERROR_DESCRIPTIONS.VALIDATION_REQUIRED,
      };
    }
    return {
      title: ERROR_MESSAGES.VALIDATION_INVALID,
      description: ERROR_DESCRIPTIONS.VALIDATION_INVALID,
    };
  }

  // Generation errors
  if (category === ErrorCategory.GENERATION) {
    if (errorMessage.includes('word')) {
      return {
        title: ERROR_MESSAGES.GENERATION_WORD,
        description: ERROR_DESCRIPTIONS.GENERATION_WORD,
      };
    }
    if (errorMessage.includes('excel')) {
      return {
        title: ERROR_MESSAGES.GENERATION_EXCEL,
        description: ERROR_DESCRIPTIONS.GENERATION_EXCEL,
      };
    }
    if (errorMessage.includes('zip')) {
      return {
        title: ERROR_MESSAGES.GENERATION_ZIP,
        description: ERROR_DESCRIPTIONS.GENERATION_ZIP,
      };
    }
    return {
      title: ERROR_MESSAGES.GENERATION_GENERIC,
      description: ERROR_DESCRIPTIONS.GENERIC,
    };
  }

  // Parsing errors
  if (category === ErrorCategory.PARSING) {
    if (errorMessage.includes('json')) {
      return {
        title: ERROR_MESSAGES.PARSING_JSON,
        description: ERROR_DESCRIPTIONS.PARSING_JSON,
      };
    }
    return {
      title: ERROR_MESSAGES.PARSING_DATA,
      description: ERROR_DESCRIPTIONS.PARSING_DATA,
    };
  }

  // Generic fallback
  return {
    title: ERROR_MESSAGES.GENERIC,
    description: ERROR_DESCRIPTIONS.GENERIC,
  };
}

// ============================================================================
// ERROR HANDLING FUNCTIONS
// ============================================================================

/**
 * Creates structured error information from an error object
 * Why: Standardizes error information across the application
 *
 * @param error - Error object or message
 * @param context - Additional context data
 * @returns ErrorInfo object
 */
export function createErrorInfo(
  error: Error | string,
  context?: Record<string, any>
): ErrorInfo {
  const category = classifyError(error);
  const severity = determineSeverity(category, error);
  const { title, description } = getUserFriendlyMessage(error, category);

  return {
    category,
    severity,
    message: title,
    description,
    technicalDetails: typeof error === 'string' ? error : error.message,
    originalError: typeof error === 'string' ? undefined : error,
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handles an error with standardized logging and user notification
 * Why: Provides consistent error handling across the application
 *
 * @param error - Error object or message
 * @param options - Error handling options
 * @returns ErrorInfo object
 */
export function handleError(
  error: Error | string,
  options: ErrorHandlingOptions = {}
): ErrorInfo {
  const {
    showToast = true,
    logToConsole = true,
    rethrow = false,
    customMessage,
    customDescription,
    context,
  } = options;

  // Create error information
  const errorInfo = createErrorInfo(error, context);

  // Override messages if provided
  if (customMessage) errorInfo.message = customMessage;
  if (customDescription) errorInfo.description = customDescription;

  // Log to console
  if (logToConsole) {
    const logLevel = errorInfo.severity === ErrorSeverity.FATAL || errorInfo.severity === ErrorSeverity.HIGH
      ? 'error'
      : errorInfo.severity === ErrorSeverity.MEDIUM
      ? 'warn'
      : 'log';

    console[logLevel]('Error handled:', {
      category: errorInfo.category,
      severity: errorInfo.severity,
      message: errorInfo.message,
      technicalDetails: errorInfo.technicalDetails,
      context: errorInfo.context,
      timestamp: errorInfo.timestamp,
    });

    if (errorInfo.originalError && errorInfo.originalError.stack) {
      console[logLevel]('Stack trace:', errorInfo.originalError.stack);
    }
  }

  // Show toast notification
  if (showToast) {
    const toastFn = errorInfo.severity === ErrorSeverity.LOW ? toast.warning : toast.error;
    toastFn(errorInfo.message, {
      description: errorInfo.description,
      duration: 5000,
    });
  }

  // Re-throw if requested
  if (rethrow) {
    throw errorInfo.originalError || new Error(errorInfo.message);
  }

  return errorInfo;
}

/**
 * Wraps an async function with error handling
 * Why: Simplifies error handling in async operations
 *
 * Usage:
 * ```typescript
 * const safeFunction = withErrorHandling(
 *   async () => { /* your code * / },
 *   { customMessage: 'Operation failed' }
 * );
 * await safeFunction();
 * ```
 *
 * @param fn - Async function to wrap
 * @param options - Error handling options
 * @returns Wrapped function
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): () => Promise<T | null> {
  return async () => {
    try {
      return await fn();
    } catch (error: any) {
      handleError(error, options);
      return null;
    }
  };
}

/**
 * Logs an error without showing toast notification
 * Why: For errors that should be logged but not shown to user
 *
 * @param error - Error object or message
 * @param context - Additional context data
 */
export function logError(error: Error | string, context?: Record<string, any>): void {
  handleError(error, {
    showToast: false,
    logToConsole: true,
    context,
  });
}

/**
 * Shows a simple error toast without full error handling
 * Why: For simple user notifications without extensive logging
 *
 * @param message - Error message
 * @param description - Optional description
 */
export function showErrorToast(message: string, description?: string): void {
  toast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Shows a simple warning toast
 * Why: For non-critical issues that user should be aware of
 *
 * @param message - Warning message
 * @param description - Optional description
 */
export function showWarningToast(message: string, description?: string): void {
  toast.warning(message, {
    description,
    duration: 5000,
  });
}

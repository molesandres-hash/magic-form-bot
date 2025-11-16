/**
 * Utils Barrel Export
 *
 * Purpose: Centralizes all utility exports for cleaner imports
 * Why: Enables importing multiple utilities from single path
 *
 * Usage:
 * ```typescript
 * import { handleError, validateCodiceFiscale, formatDate } from '@/utils';
 * ```
 */

// Error Handling
export {
  // Functions
  handleError,
  withErrorHandling,
  logError,
  showErrorToast,
  showWarningToast,
  createErrorInfo,
  classifyError,
  determineSeverity,
  getUserFriendlyMessage,

  // Constants
  ERROR_MESSAGES,
  ERROR_DESCRIPTIONS,

  // Types
  ErrorCategory,
  ErrorSeverity,
  type ErrorInfo,
  type ErrorHandlingOptions,
} from './errorHandling';

// Validators
export * from './validators';

// Date Utilities
export * from './dateUtils';

// String Utilities
export * from './stringUtils';

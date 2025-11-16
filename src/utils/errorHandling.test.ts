/**
 * Error Handling Utility Tests
 *
 * Purpose: Tests error classification, severity detection, and user messaging
 * Coverage: All public functions from errorHandling.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  classifyError,
  determineSeverity,
  getUserFriendlyMessage,
  createErrorInfo,
  handleError,
  withErrorHandling,
  logError,
  ErrorCategory,
  ErrorSeverity,
  ERROR_MESSAGES,
} from './errorHandling';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

describe('errorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console mocks
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('classifyError', () => {
    it('should classify API key errors as AUTHENTICATION', () => {
      const error1 = new Error('API key not found');
      const error2 = new Error('Invalid apikey provided');

      expect(classifyError(error1)).toBe(ErrorCategory.AUTHENTICATION);
      expect(classifyError(error2)).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('should classify quota errors as API', () => {
      const error = new Error('Quota exceeded for this API key');
      expect(classifyError(error)).toBe(ErrorCategory.API);
    });

    it('should classify network errors as NETWORK', () => {
      const error1 = new Error('Network timeout');
      const error2 = new Error('Failed to fetch');

      expect(classifyError(error1)).toBe(ErrorCategory.NETWORK);
      expect(classifyError(error2)).toBe(ErrorCategory.NETWORK);
    });

    it('should classify validation errors as VALIDATION', () => {
      const error1 = new Error('Validation failed');
      const error2 = new Error('Required field missing');

      expect(classifyError(error1)).toBe(ErrorCategory.VALIDATION);
      expect(classifyError(error2)).toBe(ErrorCategory.VALIDATION);
    });

    it('should classify generation errors as GENERATION', () => {
      const error1 = new Error('Document generation failed');
      const error2 = new Error('Error creating Word file');

      expect(classifyError(error1)).toBe(ErrorCategory.GENERATION);
      expect(classifyError(error2)).toBe(ErrorCategory.GENERATION);
    });

    it('should classify parsing errors as PARSING', () => {
      const error1 = new Error('JSON parse error');
      const error2 = new Error('Invalid data format');

      expect(classifyError(error1)).toBe(ErrorCategory.PARSING);
    });

    it('should classify unknown errors as UNKNOWN', () => {
      const error = new Error('Something went wrong');
      expect(classifyError(error)).toBe(ErrorCategory.UNKNOWN);
    });

    it('should handle string errors', () => {
      const result = classifyError('api key is invalid');
      expect(result).toBe(ErrorCategory.AUTHENTICATION);
    });
  });

  describe('determineSeverity', () => {
    it('should mark fatal errors as FATAL', () => {
      const error = new Error('Fatal system error');
      const severity = determineSeverity(ErrorCategory.UNKNOWN, error);
      expect(severity).toBe(ErrorSeverity.FATAL);
    });

    it('should mark authentication errors as HIGH', () => {
      const error = new Error('Auth failed');
      const severity = determineSeverity(ErrorCategory.AUTHENTICATION, error);
      expect(severity).toBe(ErrorSeverity.HIGH);
    });

    it('should mark quota errors as HIGH', () => {
      const error = new Error('Quota exceeded');
      const severity = determineSeverity(ErrorCategory.API, error);
      expect(severity).toBe(ErrorSeverity.MEDIUM); // Default for API

      const quotaError = new Error('quota exceeded');
      const quotaSeverity = determineSeverity(ErrorCategory.API, quotaError);
      expect(quotaSeverity).toBe(ErrorSeverity.HIGH);
    });

    it('should mark API errors as MEDIUM', () => {
      const error = new Error('API request failed');
      const severity = determineSeverity(ErrorCategory.API, error);
      expect(severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should mark validation errors as LOW', () => {
      const error = new Error('Validation error');
      const severity = determineSeverity(ErrorCategory.VALIDATION, error);
      expect(severity).toBe(ErrorSeverity.LOW);
    });

    it('should handle string errors', () => {
      const severity = determineSeverity(ErrorCategory.VALIDATION, 'invalid input');
      expect(severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should provide friendly message for missing API key', () => {
      const error = new Error('API key not found');
      const result = getUserFriendlyMessage(error, ErrorCategory.AUTHENTICATION);

      expect(result.title).toBe(ERROR_MESSAGES.API_KEY_MISSING);
      expect(result.description).toContain('Configura');
    });

    it('should provide friendly message for invalid API key', () => {
      const error = new Error('API key invalid');
      const result = getUserFriendlyMessage(error, ErrorCategory.AUTHENTICATION);

      expect(result.title).toBe(ERROR_MESSAGES.API_KEY_INVALID);
      expect(result.description).toContain('Verifica');
    });

    it('should provide friendly message for quota errors', () => {
      const error = new Error('quota exceeded');
      const result = getUserFriendlyMessage(error, ErrorCategory.API);

      expect(result.title).toBe(ERROR_MESSAGES.API_QUOTA_EXCEEDED);
      expect(result.description).toContain('esaurito');
    });

    it('should provide friendly message for network timeout', () => {
      const error = new Error('Request timeout');
      const result = getUserFriendlyMessage(error, ErrorCategory.NETWORK);

      expect(result.title).toBe(ERROR_MESSAGES.NETWORK_TIMEOUT);
      expect(result.description).toContain('connessione');
    });

    it('should provide friendly message for validation errors', () => {
      const error = new Error('Required field');
      const result = getUserFriendlyMessage(error, ErrorCategory.VALIDATION);

      expect(result.title).toBe(ERROR_MESSAGES.VALIDATION_REQUIRED);
      expect(result.description).toContain('Compila');
    });

    it('should provide friendly message for generation errors', () => {
      const error = new Error('Word document generation failed');
      const result = getUserFriendlyMessage(error, ErrorCategory.GENERATION);

      expect(result.title).toBe(ERROR_MESSAGES.GENERATION_WORD);
      expect(result.description).toContain('supporto');
    });

    it('should provide generic message for unknown errors', () => {
      const error = new Error('Unknown error');
      const result = getUserFriendlyMessage(error, ErrorCategory.UNKNOWN);

      expect(result.title).toBe(ERROR_MESSAGES.GENERIC);
      expect(result.description).toContain('supporto');
    });
  });

  describe('createErrorInfo', () => {
    it('should create comprehensive error info', () => {
      const error = new Error('API key invalid');
      const context = { userId: 123, action: 'extraction' };

      const errorInfo = createErrorInfo(error, context);

      expect(errorInfo.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(errorInfo.severity).toBe(ErrorSeverity.HIGH);
      expect(errorInfo.message).toBeTruthy();
      expect(errorInfo.description).toBeTruthy();
      expect(errorInfo.technicalDetails).toBe(error.message);
      expect(errorInfo.originalError).toBe(error);
      expect(errorInfo.context).toEqual(context);
      expect(errorInfo.timestamp).toBeTruthy();
    });

    it('should handle string errors', () => {
      const errorInfo = createErrorInfo('Something went wrong');

      expect(errorInfo.technicalDetails).toBe('Something went wrong');
      expect(errorInfo.originalError).toBeUndefined();
      expect(errorInfo.timestamp).toBeTruthy();
    });

    it('should include context data', () => {
      const error = new Error('Test error');
      const context = {
        component: 'Wizard',
        step: 1,
        data: 'test-data'
      };

      const errorInfo = createErrorInfo(error, context);

      expect(errorInfo.context).toEqual(context);
    });
  });

  describe('handleError', () => {
    it('should log error to console by default', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');

      handleError(error);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should show toast by default', async () => {
      const { toast } = await import('sonner');
      const error = new Error('Test error');

      handleError(error);

      expect(toast.error).toHaveBeenCalled();
    });

    it('should not show toast when showToast is false', async () => {
      const { toast } = await import('sonner');
      const error = new Error('Test error');

      handleError(error, { showToast: false });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should not log when logToConsole is false', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');

      handleError(error, { logToConsole: false });

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should use custom message when provided', async () => {
      const { toast } = await import('sonner');
      const error = new Error('Test error');

      handleError(error, { customMessage: 'Custom error message' });

      expect(toast.error).toHaveBeenCalledWith(
        'Custom error message',
        expect.any(Object)
      );
    });

    it('should rethrow error when rethrow is true', () => {
      const error = new Error('Test error');

      expect(() => {
        handleError(error, { rethrow: true, showToast: false });
      }).toThrow(error);
    });

    it('should include context in error info', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');
      const context = { step: 1, data: 'test' };

      handleError(error, { context });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          context: expect.objectContaining(context),
        })
      );
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap async function and handle errors', async () => {
      const errorFn = async () => {
        throw new Error('Test error');
      };

      const wrappedFn = withErrorHandling(errorFn, { showToast: false });
      const result = await wrappedFn();

      expect(result).toBeNull();
    });

    it('should return result on success', async () => {
      const successFn = async () => {
        return 'success';
      };

      const wrappedFn = withErrorHandling(successFn);
      const result = await wrappedFn();

      expect(result).toBe('success');
    });

    it('should pass options to handleError', async () => {
      const { toast } = await import('sonner');
      const errorFn = async () => {
        throw new Error('Test error');
      };

      const wrappedFn = withErrorHandling(errorFn, {
        customMessage: 'Custom message',
        showToast: true
      });
      await wrappedFn();

      expect(toast.error).toHaveBeenCalledWith(
        'Custom message',
        expect.any(Object)
      );
    });
  });

  describe('logError', () => {
    it('should log error without showing toast', async () => {
      const { toast } = await import('sonner');
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');

      logError(error);

      expect(consoleSpy).toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should include context in log', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');
      const context = { userId: 123 };

      logError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({
          context: expect.objectContaining(context),
        })
      );
    });
  });

  describe('Error severity logging', () => {
    it('should use console.error for FATAL severity', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Fatal error');

      handleError(error, { showToast: false });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use console.warn for MEDIUM severity', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const error = new Error('Network timeout');

      handleError(error, { showToast: false });

      expect(warnSpy).toHaveBeenCalled();
    });

    it('should use console.log for LOW severity', () => {
      const logSpy = vi.spyOn(console, 'log');
      const error = new Error('Validation failed');

      handleError(error, { showToast: false });

      expect(logSpy).toHaveBeenCalled();
    });
  });
});

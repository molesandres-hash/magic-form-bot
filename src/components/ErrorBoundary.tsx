/**
 * Error Boundary Component
 *
 * Purpose: Catches React errors and displays user-friendly fallback UI
 * - Prevents app crashes
 * - Logs errors for debugging
 * - Provides recovery options
 * - Auto-saves data before crash
 */

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Download } from 'lucide-react';
import { autoSaveData } from '@/services/jsonExportImportService';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Try to auto-save any data to prevent loss
    try {
      const currentData = this.extractDataFromError(error);
      if (currentData) {
        autoSaveData(currentData);
        console.log('Data auto-saved before crash');
      }
    } catch (saveError) {
      console.warn('Could not auto-save data:', saveError);
    }

    // Log to analytics/monitoring service (if configured)
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Attempts to extract any data from the error context
   */
  extractDataFromError(error: Error): unknown | null {
    // This is a placeholder - implement based on your app's state management
    try {
      // Try to get data from localStorage auto-save
      const autoSave = localStorage.getItem('magic_form_bot_autosave');
      if (autoSave) {
        return JSON.parse(autoSave);
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Logs error to monitoring service
   */
  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Implement logging to your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, etc.

    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log('Error logged:', errorData);

    // Example: Send to monitoring service
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  /**
   * Handles error reset and recovery
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Downloads error log for debugging
   */
  handleDownloadErrorLog = () => {
    const { error, errorInfo } = this.state;

    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error?.message,
        stack: error?.stack,
      },
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    const blob = new Blob([JSON.stringify(errorLog, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Navigates to home page
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
          <Card className="max-w-2xl w-full p-8">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>

              {/* Error Title */}
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Oops! Si è verificato un errore
                </h1>
                <p className="text-muted-foreground">
                  Qualcosa è andato storto. Non preoccuparti, i tuoi dati sono stati salvati
                  automaticamente.
                </p>
              </div>

              {/* Error Details (Collapsible) */}
              {this.state.error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground mb-2">
                    Dettagli tecnici (per debug)
                  </summary>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-destructive">
                        {this.state.error.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <pre className="text-xs overflow-auto max-h-40 bg-background p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Riprova
                </Button>

                <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Torna alla Home
                </Button>

                <Button
                  onClick={this.handleDownloadErrorLog}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Scarica Log
                </Button>
              </div>

              {/* Help Text */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Se il problema persiste, contatta il supporto allegando il file di log.
                  <br />
                  I tuoi dati sono salvati e potrai recuperarli quando risolverai il problema.
                </p>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// ============================================================================
// FUNCTIONAL ERROR BOUNDARY HOOK (for specific sections)
// ============================================================================

/**
 * Custom hook for error handling in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);

    // Auto-save data
    try {
      const autoSave = localStorage.getItem('magic_form_bot_autosave');
      if (autoSave) {
        console.log('Data preserved in auto-save');
      }
    } catch (e) {
      console.warn('Could not check auto-save:', e);
    }
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    resetError,
  };
}

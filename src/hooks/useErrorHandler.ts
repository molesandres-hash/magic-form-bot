import React from 'react';

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

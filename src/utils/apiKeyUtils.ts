export const API_KEY_STORAGE_KEY = "gemini_api_key";

/**
 * Utility function to get the API key from localStorage
 * @returns The stored API key or null if not found
 */
export function getStoredApiKey(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
}

/**
 * Utility function to check if an API key is configured
 * @returns true if API key exists in localStorage
 */
export function hasApiKey(): boolean {
    return !!localStorage.getItem(API_KEY_STORAGE_KEY);
}

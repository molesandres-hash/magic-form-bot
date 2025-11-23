/**
 * Predefined Data Utilities
 * 
 * Purpose: Helper functions for managing predefined data in localStorage
 * Provides type-safe access to predefined data for dropdowns in the wizard
 */

import type {
    PredefinedDataSettings,
    PredefinedLocation,
    PredefinedEntity,
    PredefinedResponsabile,
    PredefinedSupervisor,
    PredefinedTrainer,
    PredefinedPlatform,
} from '@/types/userSettings';
import { DEFAULT_PREDEFINED_DATA } from '@/types/userSettings';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'predefinedData';

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Loads predefined data from localStorage
 * @returns PredefinedDataSettings object or defaults if not found
 */
export function loadPredefinedData(): PredefinedDataSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);

            // Merge with defaults to ensure all keys exist
            // IMPORTANT: For arrays, we want to ensure we don't lose user data
            // but also want to provide defaults if the user has NONE

            return {
                ...DEFAULT_PREDEFINED_DATA,
                ...parsed,
                // Ensure arrays exist if they were empty in stored data but have defaults now
                // This is a simple merge strategy: if stored has data, use it. 
                // If stored is empty array AND default has data, use default? 
                // No, that might overwrite user's intentional deletion.
                // Better strategy: If a category is missing in parsed, use default.
                locations: (parsed.locations && parsed.locations.length > 0) ? parsed.locations : DEFAULT_PREDEFINED_DATA.locations,
                entities: (parsed.entities && parsed.entities.length > 0) ? parsed.entities : DEFAULT_PREDEFINED_DATA.entities,
                responsabili: (parsed.responsabili && parsed.responsabili.length > 0) ? parsed.responsabili : DEFAULT_PREDEFINED_DATA.responsabili,
                directors: (parsed.directors && parsed.directors.length > 0) ? parsed.directors : DEFAULT_PREDEFINED_DATA.directors,
                supervisors: (parsed.supervisors && parsed.supervisors.length > 0) ? parsed.supervisors : DEFAULT_PREDEFINED_DATA.supervisors,
                trainers: (parsed.trainers && parsed.trainers.length > 0) ? parsed.trainers : DEFAULT_PREDEFINED_DATA.trainers,
                platforms: (parsed.platforms && parsed.platforms.length > 0) ? parsed.platforms : DEFAULT_PREDEFINED_DATA.platforms,
            };
        }
    } catch (error) {
        console.error('Error loading predefined data:', error);
    }
    return DEFAULT_PREDEFINED_DATA;
}

/**
 * Saves predefined data to localStorage
 * @param data - PredefinedDataSettings to save
 */
export function savePredefinedData(data: PredefinedDataSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving predefined data:', error);
        throw error;
    }
}

// ============================================================================
// GETTER FUNCTIONS (Enabled Items Only)
// ============================================================================

/**
 * Gets all enabled locations
 */
export function getEnabledLocations(): PredefinedLocation[] {
    const data = loadPredefinedData();
    return data.locations.filter(item => item.enabled);
}

/**
 * Gets all enabled entities
 */
export function getEnabledEntities(): PredefinedEntity[] {
    const data = loadPredefinedData();
    return data.entities.filter(item => item.enabled);
}

/**
 * Gets all enabled responsables
 */
export function getEnabledResponsabili(): PredefinedResponsabile[] {
    const data = loadPredefinedData();
    return data.responsabili.filter(item => item.enabled);
}

/**
 * Gets all enabled directors
 */
export function getEnabledDirectors(): PredefinedSupervisor[] {
    const data = loadPredefinedData();
    return data.directors.filter(item => item.enabled);
}

/**
 * Gets all enabled supervisors
 */
export function getEnabledSupervisors(): PredefinedSupervisor[] {
    const data = loadPredefinedData();
    return data.supervisors.filter(item => item.enabled);
}

/**
 * Gets all enabled trainers
 */
export function getEnabledTrainers(): PredefinedTrainer[] {
    const data = loadPredefinedData();
    return data.trainers.filter(item => item.enabled);
}

/**
 * Gets all enabled platforms
 */
export function getEnabledPlatforms(): PredefinedPlatform[] {
    const data = loadPredefinedData();
    return data.platforms.filter(item => item.enabled);
}

// ============================================================================
// FIND FUNCTIONS (By ID)
// ============================================================================

/**
 * Finds a location by ID
 */
export function findLocationById(id: string): PredefinedLocation | undefined {
    const data = loadPredefinedData();
    return data.locations.find(item => item.id === id);
}

/**
 * Finds an entity by ID
 */
export function findEntityById(id: string): PredefinedEntity | undefined {
    const data = loadPredefinedData();
    return data.entities.find(item => item.id === id);
}

/**
 * Finds a responsabile by ID
 */
export function findResponsabileById(id: string): PredefinedResponsabile | undefined {
    const data = loadPredefinedData();
    return data.responsabili.find(item => item.id === id);
}

/**
 * Finds a director by ID
 */
export function findDirectorById(id: string): PredefinedSupervisor | undefined {
    const data = loadPredefinedData();
    return data.directors.find(item => item.id === id);
}

/**
 * Finds a supervisor by ID
 */
export function findSupervisorById(id: string): PredefinedSupervisor | undefined {
    const data = loadPredefinedData();
    return data.supervisors.find(item => item.id === id);
}

/**
 * Finds a trainer by ID
 */
export function findTrainerById(id: string): PredefinedTrainer | undefined {
    const data = loadPredefinedData();
    return data.trainers.find(item => item.id === id);
}

/**
 * Finds a platform by ID
 */
export function findPlatformById(id: string): PredefinedPlatform | undefined {
    const data = loadPredefinedData();
    return data.platforms.find(item => item.id === id);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates Codice Fiscale format
 * @param cf - Codice Fiscale to validate
 * @returns true if valid, false otherwise
 */
export function validateCodiceFiscale(cf: string): boolean {
    const CF_PATTERN = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
    return CF_PATTERN.test(cf.toUpperCase().trim());
}

/**
 * Validates date format (DD/MM/YYYY)
 * @param date - Date string to validate
 * @returns true if valid, false otherwise
 */
export function validateDateFormat(date: string): boolean {
    const DATE_PATTERN = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return DATE_PATTERN.test(date.trim());
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a unique ID for new predefined data items
 * @param prefix - Prefix for the ID (e.g., 'location', 'trainer')
 * @returns Unique ID string
 */
export function generatePredefinedDataId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Checks if any predefined data exists for a given category
 * @param category - Category name to check
 * @returns true if data exists, false otherwise
 */
export function hasPredefinedData(category: keyof PredefinedDataSettings): boolean {
    const data = loadPredefinedData();
    return data[category].length > 0;
}

// ============================================================================
// EXPORT/IMPORT FUNCTIONS
// ============================================================================

/**
 * Exports predefined data to a JSON file
 * Downloads the file to the user's computer
 */
export function exportPredefinedData(): void {
    try {
        const data = loadPredefinedData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `predefined-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting predefined data:', error);
        throw error;
    }
}

/**
 * Imports predefined data from a JSON file
 * @param file - File object containing JSON data
 * @returns Promise that resolves with the imported data
 */
export async function importPredefinedData(file: File): Promise<PredefinedDataSettings> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);

                // Validate structure
                if (!parsed.locations || !parsed.entities || !parsed.trainers || !parsed.platforms) {
                    throw new Error('Invalid data structure: missing required fields');
                }

                // Merge with defaults to ensure all keys exist
                const validatedData: PredefinedDataSettings = {
                    ...DEFAULT_PREDEFINED_DATA,
                    ...parsed,
                };

                // Save to localStorage
                savePredefinedData(validatedData);
                resolve(validatedData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
}

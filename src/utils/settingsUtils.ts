import { FolderStructureSettings, DEFAULT_FOLDER_STRUCTURE } from '@/types/userSettings';

const FOLDER_STRUCTURE_STORAGE_KEY = 'folderStructureSettings';
const PLACEHOLDER_SETTINGS_STORAGE_KEY = 'placeholderSettings';

export interface CustomPlaceholder {
    id: string;
    name: string;
    label: string;
    description: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    defaultValue?: string;
    extractionHint?: string;
    category: 'corso' | 'partecipanti' | 'moduli' | 'ente' | 'altro';
}

export interface PlaceholderConfig {
    customPlaceholders: CustomPlaceholder[];
}

/**
 * Export function to load folder structure settings
 */
export function loadFolderStructureSettings(): FolderStructureSettings {
    try {
        const stored = localStorage.getItem(FOLDER_STRUCTURE_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading folder structure settings:', error);
    }
    return DEFAULT_FOLDER_STRUCTURE;
}

/**
 * Export function to load placeholder settings
 */
export function loadPlaceholderSettings(): PlaceholderConfig {
    try {
        const stored = localStorage.getItem(PLACEHOLDER_SETTINGS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading placeholder settings:', error);
    }
    return { customPlaceholders: [] };
}

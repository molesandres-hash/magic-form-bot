/**
 * JSON Export/Import Service
 *
 * Purpose: Save and restore extracted course data
 * - Export JSON for backup and reuse
 * - Import JSON to regenerate documents
 * - Validate imported data structure
 * - Auto-save to localStorage as backup
 */

import { saveAs } from 'file-saver';
import type { CourseData } from '@/types/courseData';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  AUTO_SAVE: 'magic_form_bot_autosave',
  LAST_EXPORT: 'magic_form_bot_last_export',
  EXPORT_HISTORY: 'magic_form_bot_export_history',
} as const;

const MAX_HISTORY_ITEMS = 10; // Keep last 10 exports in history

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Exports course data as JSON file
 * Creates a clean, formatted JSON with metadata
 *
 * @param data - Course data to export
 * @param filename - Optional custom filename
 */
export function exportDataAsJSON(data: any, filename?: string): void {
  try {
    // Create export object with metadata
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'Magic Form Bot',
      data,
    };

    // Convert to formatted JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Generate filename if not provided
    const courseId = data.corso?.id || 'NA';
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = filename || `corso_${courseId}_${timestamp}.json`;

    // Download file
    saveAs(blob, finalFilename);

    // Save to export history
    saveToExportHistory(exportData);

    console.log(`JSON exported successfully: ${finalFilename}`);
  } catch (error: any) {
    console.error('Error exporting JSON:', error);
    throw new Error(`Errore durante l'esportazione JSON: ${error.message}`);
  }
}

/**
 * Exports extracted data with additional context
 * Includes extraction metadata, warnings, and completeness info
 */
export function exportExtractedDataWithMetadata(
  data: any,
  extractionMetadata?: {
    source: string;
    templateUsed: string;
    aiModel: string;
    doubleCheckPerformed?: boolean;
    matchPercentage?: number;
  }
): void {
  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    extractionMetadata,
    courseData: data,
  };

  const courseId = data.corso?.id || 'NA';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `corso_${courseId}_estratto_${timestamp}.json`;

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  saveAs(blob, filename);

  // Also auto-save to localStorage
  autoSaveData(data);
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Imports and validates JSON data
 * Checks structure and data integrity
 *
 * @param file - JSON file to import
 * @returns Validated course data
 */
export async function importDataFromJSON(file: File): Promise<any> {
  try {
    // Read file
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Validate structure
    const validation = validateImportedJSON(parsed);

    if (!validation.isValid) {
      throw new Error(
        `JSON non valido:\n${validation.errors.join('\n')}`
      );
    }

    // Extract data (handle both old and new format)
    const data = parsed.data || parsed.courseData || parsed;

    console.log('JSON imported successfully:', data);

    return data;
  } catch (error: any) {
    console.error('Error importing JSON:', error);

    if (error instanceof SyntaxError) {
      throw new Error('File JSON non valido: formato non riconosciuto');
    }

    throw new Error(`Errore durante l'importazione: ${error.message}`);
  }
}

/**
 * Validates imported JSON structure
 * Checks for required fields and data integrity
 */
function validateImportedJSON(data: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data exists
  if (!data) {
    errors.push('File JSON vuoto');
    return { isValid: false, errors, warnings };
  }

  // Extract course data (handle different formats)
  const courseData = data.data || data.courseData || data;

  // Check required fields
  if (!courseData.corso) {
    errors.push('Manca sezione "corso"');
  } else {
    if (!courseData.corso.id) {
      warnings.push('Manca ID corso');
    }
    if (!courseData.corso.titolo) {
      warnings.push('Manca titolo corso');
    }
  }

  // Check optional but important fields
  if (!courseData.partecipanti || courseData.partecipanti.length === 0) {
    warnings.push('Nessun partecipante trovato');
  }

  if (!courseData.sessioni || courseData.sessioni.length === 0) {
    warnings.push('Nessuna sessione trovata');
  }

  // Check moduli (if present)
  if (courseData.moduli && !Array.isArray(courseData.moduli)) {
    errors.push('Campo "moduli" deve essere un array');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// AUTO-SAVE FUNCTIONALITY
// ============================================================================

/**
 * Auto-saves data to localStorage as backup
 * Prevents data loss on browser crash/refresh
 */
export function autoSaveData(data: any): void {
  try {
    const autoSaveData = {
      savedAt: new Date().toISOString(),
      data,
    };

    localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, JSON.stringify(autoSaveData));
    console.log('Data auto-saved to localStorage');
  } catch (error) {
    console.warn('Could not auto-save to localStorage:', error);
    // Don't throw - auto-save is non-critical
  }
}

/**
 * Loads auto-saved data from localStorage
 */
export function loadAutoSavedData(): {
  data: any;
  savedAt: string;
} | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return parsed;
  } catch (error) {
    console.warn('Could not load auto-saved data:', error);
    return null;
  }
}

/**
 * Clears auto-saved data
 */
export function clearAutoSavedData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTO_SAVE);
    console.log('Auto-saved data cleared');
  } catch (error) {
    console.warn('Could not clear auto-saved data:', error);
  }
}

/**
 * Checks if there's auto-saved data available
 */
export function hasAutoSavedData(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
    return !!saved;
  } catch {
    return false;
  }
}

// ============================================================================
// EXPORT HISTORY
// ============================================================================

/**
 * Saves export to history
 */
function saveToExportHistory(exportData: any): void {
  try {
    const history = getExportHistory();

    // Add new export (keep metadata only, not full data)
    const historyItem = {
      exportedAt: exportData.exportedAt,
      courseId: exportData.data?.corso?.id || 'N/A',
      courseName: exportData.data?.corso?.titolo || 'Senza titolo',
      participantsCount: exportData.data?.partecipanti?.length || 0,
      sessionsCount: exportData.data?.sessioni?.length || 0,
    };

    history.unshift(historyItem);

    // Keep only last N exports
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(
      STORAGE_KEYS.EXPORT_HISTORY,
      JSON.stringify(trimmedHistory)
    );
  } catch (error) {
    console.warn('Could not save to export history:', error);
  }
}

/**
 * Gets export history
 */
export function getExportHistory(): any[] {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.EXPORT_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Clears export history
 */
export function clearExportHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.EXPORT_HISTORY);
  } catch (error) {
    console.warn('Could not clear export history:', error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a backup copy with timestamp
 */
export function createBackup(data: any, label?: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const courseId = data.corso?.id || 'NA';
  const backupLabel = label ? `_${label}` : '';
  const filename = `backup_${courseId}${backupLabel}_${timestamp}.json`;

  exportDataAsJSON(data, filename);
}

/**
 * Compares two data objects and returns differences
 */
export function compareData(data1: any, data2: any): {
  hasDifferences: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  // Compare corso ID
  if (data1.corso?.id !== data2.corso?.id) {
    differences.push(`ID Corso: "${data1.corso?.id}" vs "${data2.corso?.id}"`);
  }

  // Compare participants count
  const count1 = data1.partecipanti?.length || 0;
  const count2 = data2.partecipanti?.length || 0;
  if (count1 !== count2) {
    differences.push(`Partecipanti: ${count1} vs ${count2}`);
  }

  // Compare sessions count
  const sessions1 = data1.sessioni?.length || 0;
  const sessions2 = data2.sessioni?.length || 0;
  if (sessions1 !== sessions2) {
    differences.push(`Sessioni: ${sessions1} vs ${sessions2}`);
  }

  return {
    hasDifferences: differences.length > 0,
    differences,
  };
}

/**
 * Sanitizes data for export (removes internal fields)
 */
export function sanitizeDataForExport(data: any): any {
  const sanitized = JSON.parse(JSON.stringify(data));

  // Remove internal validation fields
  if (sanitized.partecipanti) {
    sanitized.partecipanti = sanitized.partecipanti.map((p: any) => {
      const { _validations, ...rest } = p;
      return rest;
    });
  }

  return sanitized;
}

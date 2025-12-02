/**
 * FAD Multi-File Generator Service
 * 
 * Purpose: Generates separate Word documents for each FAD session day
 * Uses template: modello B FAD_placeholder.docx
 * 
 * Creates one file per FAD session with:
 * - Date (day, month, year)
 * - Lesson time (start-end)
 * - Random topic from configured list
 */

import type { CourseData } from '@/types/courseData';
import { processWordTemplate } from './wordTemplateProcessor';
import { loadPredefinedData } from '@/utils/predefinedDataUtils';
import { mapCourseDataToTemplate } from './templateDataMapper';

// ============================================================================
// CONSTANTS
// ============================================================================

const FAD_TEMPLATE_PATH = '/templates/modello B FAD_placeholder.docx';
const FAD_TEMPLATE_A_PATH = '/templates/modello_A_FAD_con_placeholder.docx';

const MONTH_NAMES = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generates a single FAD registry document (Modello B) for one specific day
 * 
 * @param data - Complete course data
 * @param sessionIndex - Index of the FAD session to generate (0-based)
 * @returns Document blob ready for download/ZIP packaging
 */
export async function generateFADRegistryForDay(
    data: CourseData,
    sessionIndex: number
): Promise<Blob> {
    try {
        // 1. Get FAD sessions
        const fadSessions = (data.sessioni || []).filter(s => s.is_fad);

        if (sessionIndex < 0 || sessionIndex >= fadSessions.length) {
            throw new Error(`Invalid session index: ${sessionIndex}`);
        }

        const session = fadSessions[sessionIndex];

        // 2. Load template
        const templateResponse = await fetch(FAD_TEMPLATE_PATH);
        if (!templateResponse.ok) {
            throw new Error('Template non trovato: modello B FAD_placeholder.docx');
        }
        const templateBlob = await templateResponse.blob();

        // 3. Prepare data for this specific session
        const templateData = prepareFADSessionData(data, session, sessionIndex, fadSessions.length);

        // 4. Process template
        const blob = await processWordTemplate({
            template: templateBlob,
            data: templateData,
            filename: `Registro_FAD_${formatDateForFilename(session.data_completa)}.docx`
        });

        return blob;
    } catch (error: any) {
        console.error('Error generating FAD registry for day:', error);
        throw new Error(`Errore generazione registro FAD: ${error.message}`);
    }
}

/**
 * Generates a single FAD Modello A document for one specific day
 * 
 * @param data - Complete course data
 * @param sessionIndex - Index of the FAD session to generate (0-based)
 * @returns Document blob ready for download/ZIP packaging
 */
export async function generateModelloAFAD(
    data: CourseData,
    sessionIndex: number
): Promise<Blob> {
    try {
        // 1. Get FAD sessions
        const fadSessions = (data.sessioni || []).filter(s => s.is_fad);

        if (sessionIndex < 0 || sessionIndex >= fadSessions.length) {
            throw new Error(`Invalid session index: ${sessionIndex}`);
        }

        const session = fadSessions[sessionIndex];

        // 2. Load template
        const templateResponse = await fetch(FAD_TEMPLATE_A_PATH);
        if (!templateResponse.ok) {
            throw new Error('Template non trovato: modello_A_FAD_con_placeholder.docx');
        }
        const templateBlob = await templateResponse.blob();

        // 3. Prepare data for this specific session
        // Assuming Modello A uses the same data structure as Modello B
        const templateData = prepareFADSessionData(data, session, sessionIndex, fadSessions.length);

        // 4. Process template
        const blob = await processWordTemplate({
            template: templateBlob,
            data: templateData,
            filename: `Modello_A_FAD_${formatDateForFilename(session.data_completa)}.docx`
        });

        return blob;
    } catch (error: any) {
        console.error('Error generating Modello A FAD for day:', error);
        throw new Error(`Errore generazione Modello A FAD: ${error.message}`);
    }
}

/**
 * Generates ALL FAD registry documents (Modello A and Modello B) and returns them as an array
 * Used by ZIP packager to include all FAD files
 * 
 * @param data - Complete course data
 * @returns Array of {filename, blob} objects for each FAD session
 */
export async function generateAllFADRegistries(
    data: CourseData
): Promise<Array<{ filename: string; blob: Blob }>> {
    const fadSessions = (data.sessioni || []).filter(s => s.is_fad);
    const results: Array<{ filename: string; blob: Blob }> = [];

    for (let i = 0; i < fadSessions.length; i++) {
        const session = fadSessions[i];

        // Generate Modello B (Registro FAD) - One per session
        try {
            const blobB = await generateFADRegistryForDay(data, i);
            const filenameB = `Registro_FAD_${formatDateForFilename(session.data_completa)}.docx`;
            results.push({ filename: filenameB, blob: blobB });
        } catch (e) {
            console.error(`Failed to generate Modello B for session ${i}`, e);
        }
    }

    // Generate Modello A - ONCE per module/course context
    // We use the first session (index 0) as the reference for start date/context if needed,
    // but the template should mostly use general course data.
    if (fadSessions.length > 0) {
        try {
            // Use index 0 to provide a valid session context, but data is module-wide
            const blobA = await generateModelloAFAD(data, 0);
            // Filename can be generic or based on start date
            const filenameA = `Modello_A_FAD_Generale.docx`;
            results.push({ filename: filenameA, blob: blobA });
        } catch (e) {
            console.error(`Failed to generate Modello A`, e);
        }
    }

    return results;
}

// ============================================================================
// DATA PREPARATION
// ============================================================================

/**
 * Prepares placeholder data for a single FAD session
 * Uses the centralized mapCourseDataToTemplate to ensure consistency
 */
function prepareFADSessionData(
    data: CourseData,
    session: any,
    sessionIndex: number,
    totalSessions: number
): Record<string, any> {
    // 1. Get full centralized data mapping
    const fullData = mapCourseDataToTemplate(data);

    // 2. Get specific session data from the pre-calculated SESSIONI_FAD list
    // We use the index to find the matching session
    const sessionData = fullData.SESSIONI_FAD[sessionIndex];

    if (!sessionData) {
        console.error(`Session data not found for index ${sessionIndex}`);
        return fullData; // Fallback
    }

    // 3. Get Topic (Argument)
    const topic = getTopicForDay(sessionIndex, totalSessions);

    // 4. Prepare Participants list for this session
    // Inject session-specific fields into each participant for loop access
    const participants = (sessionData.PARTECIPANTI_SESSIONE || []).map((p: any) => ({
        ...p,
        // Inject fields that might be needed inside the participant loop
        ARGOMENTO: topic,
        argomento: topic, // Lowercase alias
        ORARIO_LEZIONE: `${sessionData.ora_inizio} / ${sessionData.ora_fine}`,
        orario_lezione: `${sessionData.ora_inizio} / ${sessionData.ora_fine}`, // Lowercase alias
        DATA_SESSIONE: sessionData.data,
        // Ensure these are available as uppercase too if needed
        ORA_CONNESSIONE: p.ora_connessione,
        ORA_DISCONNESSIONE: p.ora_disconnessione
    }));

    // 5. Merge everything
    // Priority: Session Data > Full Data > Defaults
    return {
        ...fullData, // Global course info (NOME_CORSO, ENTE, etc.)
        ...sessionData, // Session specific info (giorno, mese, anno, ora_inizio, etc.)

        // Explicit overrides to ensure top-level keys match template expectations
        GIORNO: sessionData.giorno,
        MESE: sessionData.mese,
        ANNO: sessionData.anno,
        DATA: sessionData.data,

        ORA_INIZIO: sessionData.ora_inizio,
        ORA_FINE: sessionData.ora_fine,

        ARGOMENTO: topic,

        // FAD Details
        LINK: session.link || fullData.ZOOM_LINK || '',
        MEETING_ID: extractZoomDetails(session.link || '').id || fullData.ZOOM_MEETING_ID || '',
        PASSCODE: extractZoomDetails(session.link || '').passcode || fullData.ZOOM_PASSCODE || '',

        // Lists
        PARTECIPANTI: participants, // Use the enriched list

        // Indices
        NUMERO_SESSIONE: sessionIndex + 1,
        TOTALE_SESSIONI: totalSessions
    };
}

/**
 * Extracts Zoom meeting ID and passcode from a link
 */
function extractZoomDetails(link: string): { id: string; passcode: string } {
    if (!link) return { id: '', passcode: '' };

    let id = '';
    let passcode = '';

    // Extract ID (usually 9-11 digits)
    // Format: /j/123456789 or /my/123456789
    const idMatch = link.match(/\/j\/(\d+)/) || link.match(/\/my\/(\d+)/) || link.match(/(\d{9,11})/);
    if (idMatch) {
        id = idMatch[1];
        // Format ID with spaces for readability (e.g. 123 456 789)
        id = id.replace(/(\d{3})(?=\d)/g, '$1 ');
    }

    // Extract Passcode (pwd=...)
    const pwdMatch = link.match(/[?&]pwd=([^&]+)/);
    if (pwdMatch) {
        passcode = pwdMatch[1];
    }

    return { id, passcode };
}



/**
 * Gets a topic for a specific day based on configured argument lists
 * Logic:
 * - If # arguments == # days: Assign chronologically
 * - If # arguments != # days: Assign sequentially (wrapping around if needed)
 */
function getTopicForDay(dayIndex: number, totalDays: number): string {
    try {
        const predefinedData = loadPredefinedData();
        const argumentLists = predefinedData.argumentLists || [];

        // Filter only enabled lists
        const enabledLists = argumentLists.filter(list => list.enabled);

        if (enabledLists.length === 0) {
            return 'Da definire';
        }

        // Collect all topics from all enabled lists
        const allTopics: string[] = [];
        enabledLists.forEach(list => {
            if (list.arguments && list.arguments.length > 0) {
                allTopics.push(...list.arguments);
            }
        });

        if (allTopics.length === 0) {
            return 'Da definire';
        }

        // If exact match, use direct index
        if (allTopics.length === totalDays) {
            return allTopics[dayIndex] || 'Da definire';
        }

        // Otherwise use modulo to wrap around sequentially
        // This satisfies "casualmente tra quelli disponibili, ma sempre in sequenza cronologica"
        // by ensuring we pick from the list in order, even if counts mismatch.
        return allTopics[dayIndex % allTopics.length];
    } catch (error) {
        console.error('Error getting topic for day:', error);
        return 'Da definire';
    }
}

/**
 * Formats date string for use in filename
 * Converts "22/09/2025" -> "22_09_2025"
 */
function formatDateForFilename(dateString: string): string {
    return dateString.replace(/\//g, '_');
}

// ============================================================================
// UTILITY: Check if course has FAD sessions
// ============================================================================

/**
 * Checks if course has any FAD sessions
 * @param data - Course data
 * @returns true if course has at least one FAD session
 */
export function hasFADSessions(data: CourseData): boolean {
    return (data.sessioni || []).some(s => s.is_fad);
}

/**
 * Gets count of FAD sessions
 * @param data - Course data
 * @returns Number of FAD sessions
 */
export function getFADSessionCount(data: CourseData): number {
    return (data.sessioni || []).filter(s => s.is_fad).length;
}

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
        const templateData = prepareFADSessionData(data, session);

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
        const templateData = prepareFADSessionData(data, session);

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

        // Generate Modello B (Registro FAD)
        try {
            const blobB = await generateFADRegistryForDay(data, i);
            const filenameB = `Registro_FAD_${formatDateForFilename(session.data_completa)}.docx`;
            results.push({ filename: filenameB, blob: blobB });
        } catch (e) {
            console.error(`Failed to generate Modello B for session ${i}`, e);
        }

        // Generate Modello A
        try {
            const blobA = await generateModelloAFAD(data, i);
            const filenameA = `Modello_A_FAD_${formatDateForFilename(session.data_completa)}.docx`;
            results.push({ filename: filenameA, blob: blobA });
        } catch (e) {
            console.error(`Failed to generate Modello A for session ${i}`, e);
        }
    }

    return results;
}

// ============================================================================
// DATA PREPARATION
// ============================================================================

/**
 * Prepares placeholder data for a single FAD session
 */
function prepareFADSessionData(data: CourseData, session: any): Record<string, any> {
    const calculateDuration = (start: string, end: string): number => {
        try {
            const [h1, m1] = (start || '0:0').split(':').map(Number);
            const [h2, m2] = (end || '0:0').split(':').map(Number);
            return (h2 + m2 / 60) - (h1 + m1 / 60);
        } catch {
            return 0;
        }
    };

    const fadSessions = (data.sessioni || []).filter(s => s.is_fad);

    // Hours of FAD calculated on all FAD sessions
    const fadHours = fadSessions.reduce((acc, s) => {
        return acc + calculateDuration(s.ora_inizio_giornata || (s as any).ora_inizio, s.ora_fine_giornata || (s as any).ora_fine);
    }, 0);

    // Flattened topics list (argomenti) across modules
    const listaArgomenti = (data.moduli || []).flatMap(m =>
        (m.argomenti || []).map(arg => ({
            argomento: arg,
            modulo: m.titolo
        }))
    );

    // Full FAD calendar for the table section
    const sessioniFad = fadSessions.map(s => ({
        data: s.data_completa,
        ora_inizio: s.ora_inizio_giornata || (s as any).ora_inizio,
        ora_fine: s.ora_fine_giornata || (s as any).ora_fine,
        durata: calculateDuration(s.ora_inizio_giornata || (s as any).ora_inizio, s.ora_fine_giornata || (s as any).ora_fine).toFixed(1).replace('.0', '')
    }));

    // Dynamic participant placeholders (PARTECIPANTE 1, PARTECIPANTE 1 EMAIL, ...)
    const partecipanti = (data.partecipanti || []).sort((a, b) => a.numero - b.numero);
    const partecipantiDynamic = partecipanti.reduce((acc, p, index) => {
        const num = index + 1;
        acc[`PARTECIPANTE ${num}`] = p.nome_completo;
        acc[`PARTECIPANTE ${num} EMAIL`] = p.email || '';
        return acc;
    }, {} as Record<string, string>);

    // Extract date components
    const { giorno, mese, anno } = extractDateComponents(session.data_completa);

    // Get a random topic from configured lists
    const argomento = getRandomTopic();

    // Calculate FAD hours (duration) for this specific session
    const duration = calculateDuration(
        session.ora_inizio_giornata || (session as any).ora_inizio || '09:00',
        session.ora_fine_giornata || (session as any).ora_fine || '13:00'
    );

    return {
        // Date placeholders
        giorno: giorno,
        mese: mese,
        anno: anno,

        // Time placeholders
        ora_inizio: session.ora_inizio_giornata || (session as any).ora_inizio || '09:00',
        ora_fine: session.ora_fine_giornata || (session as any).ora_fine || '13:00',

        // Topic placeholder
        argomento_sessione: argomento,

        // Course info placeholders
        NOME_CORSO: data.corso?.titolo || 'N/A',
        ID_SEZIONE: data.corso?.id || 'N/A',
        ID_CORSO: data.corso?.id || 'N/A',

        // --- NEW MAPPINGS FOR MODELLO A ---
        ENTE_NOME: data.ente?.nome || 'N/A',
        SEDE_ACCREDITATA: data.sede?.nome || data.ente?.accreditato?.nome || 'N/A',
        ORE_FAD: duration.toFixed(1).replace('.0', ''), // Hours for this specific session/file
        NOME_DOCENTE: data.trainer?.nome_completo || 'N/A',

        // FAD Specifics
        ID_RIUNIONE: data.calendario_fad?.id_riunione || extractZoomDetails(data.calendario_fad?.strumenti || '').id || 'Da definire',
        PASSCODE: data.calendario_fad?.passcode || extractZoomDetails(data.calendario_fad?.strumenti || '').passcode || 'Da definire',
        PIATTAFORMA: data.calendario_fad?.piattaforma || data.calendario_fad?.strumenti || 'Zoom',

        // Lists
        LISTA_ARGOMENTI: (data.moduli || []).flatMap(m =>
            (m.argomenti || []).map(arg => ({
                argomento: arg,
                modulo: m.titolo
            }))
        ),

        // Session list (even if it's just one for this file, the template might use a loop)
        SESSIONI_FAD: [{
            data: session.data_completa,
            ora_inizio: session.ora_inizio_giornata || (session as any).ora_inizio || '09:00',
            ora_fine: session.ora_fine_giornata || (session as any).ora_fine || '13:00',
            NOME_CORSO: data.corso?.titolo || 'N/A',
            NOME_DOCENTE: data.trainer?.nome_completo || 'N/A'
        }],

        // Participants table
        ...partecipantiDynamic,
    };
}

/**
 * Extracts Meeting ID and Passcode from a Zoom link
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
 * Extracts day, month name, and year from date string
 * @param dateString - Date in format "DD/MM/YYYY" or similar
 * @returns Object with giorno, mese (name), anno
 */
function extractDateComponents(dateString: string): { giorno: string; mese: string; anno: string } {
    try {
        // Handle various date formats
        const parts = dateString.split('/');
        if (parts.length < 3) {
            throw new Error('Invalid date format');
        }

        const day = parts[0].padStart(2, '0');
        const monthIndex = parseInt(parts[1], 10) - 1; // 0-based
        const year = parts[2];

        // Get month name in Italian
        const monthName = MONTH_NAMES[monthIndex] || 'N/A';

        return {
            giorno: day,
            mese: monthName,
            anno: year
        };
    } catch (error) {
        console.error('Error extracting date components:', error);
        return {
            giorno: 'XX',
            mese: 'N/A',
            anno: '2025'
        };
    }
}

/**
 * Gets a random topic from the configured argument lists
 * Returns 'Da definire' if no lists are configured
 */
function getRandomTopic(): string {
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

        // Return random topic
        const randomIndex = Math.floor(Math.random() * allTopics.length);
        return allTopics[randomIndex];
    } catch (error) {
        console.error('Error getting random topic:', error);
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

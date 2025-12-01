/**
 * Presence Register Generator Service
 * 
 * Purpose: Generates the "Registro Didattico" as a set of separate files:
 * 1. Head (Frontespizio)
 * 2. Daily Pages (One per presence session)
 * 
 * This approach avoids table formatting issues that occur when merging content into a single DOCX.
 */

import type { CourseData } from '@/types/courseData';
import { processWordTemplate, prepareDataForWordTemplate } from './wordTemplateProcessor';
// @ts-ignore
import DocxMerger from 'docx-merger';

// ============================================================================
// CONSTANTS
// ============================================================================

const TEMPLATE_HEAD_PATH = '/templates/Registro_Presenza/registro_head.docx';
const TEMPLATE_DAY_PATH = '/templates/Registro_Presenza/registro_pagina_giorno.docx';

const MONTH_NAMES = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generates all files for the Presence Register (Head + N Daily Pages)
 * 
 * @param data - Complete course data
 * @returns Array of {filename, blob} objects
 */
export async function generatePresenceRegisterFiles(
    data: CourseData
): Promise<Array<{ filename: string; blob: Blob }>> {
    const results: Array<{ filename: string; blob: Blob }> = [];
    const presenceSessions = (data.sessioni || []).filter(s => !s.is_fad);

    if (presenceSessions.length === 0) {
        return results;
    }

    // 1. Generate HEAD
    let headBlob: Blob | null = null;
    try {
        headBlob = await generateRegisterHead(data, presenceSessions.length);
    } catch (error) {
        console.error('Error generating Register Head:', error);
    }

    if (!headBlob) {
        return results;
    }

    // 2. Generate DAILY PAGES
    const dayBlobs: Blob[] = [];
    for (let i = 0; i < presenceSessions.length; i++) {
        const session = presenceSessions[i];
        try {
            const dayBlob = await generateRegisterDayPage(data, session, i + 1);
            dayBlobs.push(dayBlob);
        } catch (error) {
            console.error(`Error generating Register Day ${i + 1}:`, error);
        }
    }

    // 3. MERGE FILES
    try {
        if (dayBlobs.length > 0) {
            // Convert all blobs to ArrayBuffers for docx-merger
            const headBuffer = await headBlob.arrayBuffer();
            const dayBuffers = await Promise.all(dayBlobs.map(b => b.arrayBuffer()));

            const filesToMerge = [headBuffer, ...dayBuffers];

            const merger = new DocxMerger({}, filesToMerge);

            // docx-merger save returns a Node Buffer or Blob depending on env. 
            // In browser, we might need to handle it.
            // Actually, looking at docx-merger docs/source, save(type, callback)
            // We can use a Promise wrapper.

            const mergedBlob = await new Promise<Blob>((resolve, reject) => {
                merger.save('blob', (data: any) => {
                    resolve(data);
                });
            });

            results.push({ filename: 'Registro_Presenze_Completo.docx', blob: mergedBlob });
        } else {
            // Fallback if no days
            results.push({ filename: 'Registro_Frontespizio.docx', blob: headBlob });
        }
    } catch (error) {
        console.error('Error merging presence register files:', error);
        // Fallback: return separate files if merge fails
        results.push({ filename: '00_Registro_Frontespizio.docx', blob: headBlob });
        dayBlobs.forEach((blob, i) => {
            const dayNum = (i + 1).toString().padStart(2, '0');
            results.push({ filename: `${dayNum}_Registro_Giorno.docx`, blob });
        });
    }

    return results;
}

// ============================================================================
// GENERATORS
// ============================================================================

async function generateRegisterHead(data: CourseData, totalPages: number): Promise<Blob> {
    const response = await fetch(TEMPLATE_HEAD_PATH);
    if (!response.ok) throw new Error(`Template Head not found at ${TEMPLATE_HEAD_PATH}`);
    const templateBlob = await response.blob();

    // Calculate fields
    const numeroPagine = totalPages;
    const dataVidimazione = (numeroPagine * 2) + 2;

    const templateData = {
        ...prepareDataForWordTemplate(data),
        NUMERO_PAGINE: numeroPagine,
        DATA_VIDIMAZIONE: dataVidimazione,
    };

    return processWordTemplate({
        template: templateBlob,
        data: templateData,
        filename: 'Registro_Head'
    });
}

async function generateRegisterDayPage(data: CourseData, session: any, pageNum: number): Promise<Blob> {
    const response = await fetch(TEMPLATE_DAY_PATH);
    if (!response.ok) throw new Error(`Template Day Page not found at ${TEMPLATE_DAY_PATH}`);
    const templateBlob = await response.blob();

    // Parse date
    const { giorno, mese, anno } = extractDateComponents(session.data_completa);

    // Prepare session-specific data
    const sessionData = {
        data: session.data_completa,
        giorno: giorno,
        mese: mese,
        anno: anno,
        ora_inizio: session.ora_inizio_giornata,
        ora_fine: session.ora_fine_giornata,
        luogo: session.sede,
        durata: calculateDuration(session.ora_inizio_giornata, session.ora_fine_giornata),
        modalita: 'Presenza'
    };

    const templateData = {
        ...prepareDataForWordTemplate(data),
        // Override session lists to scope to THIS session only
        SESSIONI_PRESENZA: [sessionData],
        SESSIONI: [sessionData],

        // Direct fields
        giorno: giorno,
        mese: mese,
        anno: anno,
        DATA_LEZIONE: session.data_completa,
        NUMERO_PAGINA: pageNum
    };

    return processWordTemplate({
        template: templateBlob,
        data: templateData,
        filename: `Registro_Day_${pageNum}`
    });
}

// ============================================================================
// HELPERS
// ============================================================================

function extractDateComponents(dateString: string): { giorno: string; mese: string; anno: string } {
    try {
        if (dateString.includes('/')) {
            const [d, m, y] = dateString.split('/');
            const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
            return {
                giorno: d.padStart(2, '0'),
                mese: MONTH_NAMES[dateObj.getMonth()] || 'N/A',
                anno: y
            };
        }
        return { giorno: '', mese: '', anno: '' };
    } catch (e) {
        return { giorno: '', mese: '', anno: '' };
    }
}

function calculateDuration(start: string, end: string): string {
    try {
        const [h1, m1] = (start || '0:0').split(':').map(Number);
        const [h2, m2] = (end || '0:0').split(':').map(Number);
        const diff = (h2 + m2 / 60) - (h1 + m1 / 60);
        return diff.toFixed(1).replace('.0', '');
    } catch {
        return '';
    }
}

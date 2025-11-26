import JSZip from 'jszip';
import { prepareDataForWordTemplate, processWordTemplate } from './wordTemplateProcessor';
import type { CourseData } from '@/types/courseData';

const REGISTRO_ID_TEMPLATE_PATH = '/templates/Registro_ID_con_placeholder.docx';
const OUTPUT_FILENAME = 'Registro presenza ID.docx';

/**
 * Loads the Registro ID template from the public templates folder
 */
export async function loadRegistroIDTemplateBuffer(): Promise<ArrayBuffer> {
    const response = await fetch(REGISTRO_ID_TEMPLATE_PATH);
    if (!response.ok) {
        throw new Error(`Impossibile caricare il template Registro ID: ${REGISTRO_ID_TEMPLATE_PATH}`);
    }
    return await response.arrayBuffer();
}

/**
 * Builds the data object for the Registro ID template
 */
function buildRegistroIDData(data: CourseData): Record<string, any> {
    const course = (data.corso || {}) as any;
    const sede = (data.sede || {}) as any;
    const ente = (data.ente || {}) as any;
    const trainer = (data.trainer || {}) as any;

    // Prepare participants list if needed, though the template might iterate differently
    // For now, we'll pass the standard course data structure which includes 'partecipanti'

    return {
        ...data, // Pass all data to allow flexible usage

        // Explicit mappings for common placeholders if they differ from standard
        NOME_CORSO: course.titolo || '',
        ID_CORSO: course.id || '',
        DATA_INIZIO: course.data_inizio || '',
        DATA_FINE: course.data_fine || '',
        ORE_TOTALI: course.ore_totali || course.durata_totale || '',

        ENTE_NOME: ente.nome || '',
        SEDE_NOME: sede.nome || '',
        SEDE_INDIRIZZO: sede.indirizzo || '',

        DOCENTE_NOME_COMPLETO: trainer.nome_completo || `${trainer.nome || ''} ${trainer.cognome || ''}`.trim(),

        // Ensure participants are available as a list for potential iteration
        PARTECIPANTI: data.partecipanti || [],
    };
}

/**
 * Generates the Registro ID document and adds it to the ZIP
 */
export async function addRegistroIDToZip(zipRoot: JSZip, data: CourseData, templateBuffer?: ArrayBuffer) {
    try {
        const buffer = templateBuffer || await loadRegistroIDTemplateBuffer();

        const templateData = buildRegistroIDData(data);
        const prepared = prepareDataForWordTemplate(templateData);

        const blob = await processWordTemplate({
            template: buffer,
            data: prepared,
            filename: OUTPUT_FILENAME,
        });

        // Add to root of zip or a specific folder? 
        // Plan said "root or appropriate folder". Let's put it in root for now as it seems to be a course-level document.
        zipRoot.file(OUTPUT_FILENAME, blob);

    } catch (err) {
        console.error('Errore generazione Registro ID:', err);
        // Don't throw, just log error so other files can still be generated
    }
}

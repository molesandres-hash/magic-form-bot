import JSZip from 'jszip';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { prepareDataForWordTemplate, processWordTemplate } from './wordTemplateProcessor';
import type { CourseData } from '@/types/courseData';

const REGISTRO_HEAD_TEMPLATE_PATH = '/templates/REGISTRO_PRESENZA/Registro presenzaHEAD.docx';
const GIORNATE_TEMPLATE_PATH = '/templates/REGISTRO_PRESENZA/Giornate.docx';
const OUTPUT_FILENAME = 'Registro presenza ID.docx';

/**
 * Loads a template from the public folder
 */
async function loadTemplateBuffer(path: string): Promise<ArrayBuffer> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Impossibile caricare il template: ${path}`);
    }
    return await response.arrayBuffer();
}

/**
 * Builds the data object for the Registro HEAD template
 */
function buildRegistroHeadData(data: CourseData): Record<string, any> {
    const course = (data.corso || {}) as any;
    const sede = (data.sede || {}) as any;
    const ente = (data.ente || {}) as any;
    const trainer = (data.trainer || {}) as any;

    // Extract ID Sezione from metadata (current module) or first module
    const idSezione = data.metadata?.modulo_corrente?.id_sezione ||
        (data.moduli && data.moduli.length > 0 ? data.moduli[0].id_sezione : '') ||
        '';

    return {
        ...data,
        NOME_CORSO: course.titolo || '',
        ID_CORSO: course.id || '',
        ID_SEZIONE: idSezione,
        DATA_INIZIO: course.data_inizio || '',
        DATA_FINE: course.data_fine || '',
        ORE_TOTALI: course.ore_totali || course.durata_totale || '',
        ENTE_NOME: ente.nome || '',
        ID_ENTE: ente.id || '',
        INDIRIZZO: ente.indirizzo || '',
        ENTE_INDIRIZZO: ente.indirizzo || '',
        SEDE_NOME: sede.nome || '',
        SEDE_INDIRIZZO: sede.indirizzo || '',
        DOCENTE_NOME_COMPLETO: trainer.nome_completo || `${trainer.nome || ''} ${trainer.cognome || ''}`.trim(),
        DOCENTE: trainer.nome_completo || `${trainer.nome || ''} ${trainer.cognome || ''}`.trim(),
        NUMERO_PAGINE: ((data.sessioni_presenza?.length || 0) * 2 + 2).toString(),
        DATA_VIDIMAZIONE: course.data_fine || '',
        LUOGO_VIDIMAZIONE: data.registro?.luogo_vidimazione || '',
        PARTECIPANTI: data.partecipanti || [],
    };
}

/**
 * Builds data for a single Giornata page
 */
function buildGiornataData(session: any): Record<string, any> {
    // Parse date: "DD/MM/YYYY" or "YYYY-MM-DD"
    let dateObj: Date | null = null;
    const dateStr = session.data_completa || session.data || '';

    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
    } else {
        dateObj = new Date(dateStr);
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
        return { GIORNO: '', MESE: '', ANNO: '' };
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString();

    return {
        GIORNO: day,
        MESE: month,
        ANNO: year
    };
}

/**
 * Generates the Registro ID document by concatenating HEAD and Giornate
 */
export async function addRegistroIDToZip(zipRoot: JSZip, data: CourseData, templateBuffer?: ArrayBuffer) {
    try {
        // 1. Load Templates
        const headBuffer = await loadTemplateBuffer(REGISTRO_HEAD_TEMPLATE_PATH);
        const giornateBuffer = await loadTemplateBuffer(GIORNATE_TEMPLATE_PATH);

        // 2. Process HEAD Template
        const headData = buildRegistroHeadData(data);
        const headZip = new PizZip(headBuffer);
        const headDoc = new Docxtemplater(headZip, { paragraphLoop: true, linebreaks: true });
        headDoc.render(headData);

        // 3. Process Giornate for each presence session
        // Filter for presence sessions if not explicitly separated, though data.sessioni_presenza is preferred
        const presenceSessions = data.sessioni_presenza && data.sessioni_presenza.length > 0
            ? data.sessioni_presenza
            : (data.sessioni || []).filter(s => !s.is_fad);

        // Sort sessions by date to be safe
        presenceSessions.sort((a, b) => {
            const da = new Date(a.data_completa || (a as any).data || 0).getTime();
            const db = new Date(b.data_completa || (b as any).data || 0).getTime();
            return da - db;
        });

        // We will append the body of each processed Giornata to the Head document
        // This requires manipulating the underlying XML
        let combinedXml = headDoc.getZip().file("word/document.xml")?.asText();
        if (!combinedXml) throw new Error("Could not read document.xml from Head template");

        // Find the end of the body in the Head document
        const bodyEndIndex = combinedXml.lastIndexOf("</body>");
        if (bodyEndIndex === -1) throw new Error("Invalid Head document XML");

        const xmlHeader = combinedXml.substring(0, bodyEndIndex);
        const xmlFooter = combinedXml.substring(bodyEndIndex);

        let pagesXml = "";

        for (const session of presenceSessions) {
            const giornataData = buildGiornataData(session);
            const giornataZip = new PizZip(giornateBuffer);
            const giornataDoc = new Docxtemplater(giornataZip, { paragraphLoop: true, linebreaks: true });

            giornataDoc.render(giornataData);

            const giornataXml = giornataDoc.getZip().file("word/document.xml")?.asText();
            if (giornataXml) {
                // Extract body content (everything inside <w:body>...</w:body>)
                const match = giornataXml.match(/<w:body>(.*?)<\/w:body>/s);
                if (match && match[1]) {
                    // Add a page break before each new section if needed, or rely on the template having one.
                    // Usually templates for concatenation should start with a page break or the previous one end with it.
                    // If Giornate.docx doesn't have a page break, we might want to force one.
                    // For now, we assume the user's template is set up correctly or we just append.
                    // To be safe, let's append a page break if it's not the very first thing (but here we are appending to Head).

                    // Simple page break XML: <w:p><w:r><w:br w:type="page"/></w:r></w:p>
                    // We'll insert it before the content of the day.
                    pagesXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>${match[1]}`;
                }
            }
        }

        // 4. Combine XML
        const finalXml = xmlHeader + pagesXml + xmlFooter;

        // 5. Update the Head Zip with the new XML
        headDoc.getZip().file("word/document.xml", finalXml);

        // 6. Generate Blob
        const blob = headDoc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // 7. Add to ZIP
        zipRoot.file(OUTPUT_FILENAME, blob);

    } catch (err) {
        console.error('Errore generazione Registro ID:', err);
        // Don't throw, just log error so other files can still be generated
    }
}

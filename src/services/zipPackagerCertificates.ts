import JSZip from 'jszip';
import { prepareDataForWordTemplate, processWordTemplate } from './wordTemplateProcessor';
import type { CourseData, Partecipante } from '@/types/courseData';

const CERT_FOLDER_NAME = 'certificati AKG';
const CERT_TEMPLATE_PATH = '/templates/Attestato/Attestato_con_placeholder.docx';

/**
 * Loads the certificate template from the public templates folder
 */
export async function loadTemplateBufferFromPublic(): Promise<ArrayBuffer> {
  const response = await fetch(CERT_TEMPLATE_PATH);
  if (!response.ok) {
    throw new Error(`Impossibile caricare il template certificato: ${CERT_TEMPLATE_PATH}`);
  }
  return await response.arrayBuffer();
}

/**
 * Builds a map of placeholder values for a given participant and course data
 */
function buildCertificateData(partecipante: Partecipante, data: CourseData): Record<string, any> {
  const course = (data.corso || {}) as any;
  const sede = (data.sede || {}) as any;
  const ente = (data.ente || {}) as any;
  const trainer = (data.trainer || {}) as any;

  return {
    PARTECIPANTE_NOME: partecipante.nome || '',
    PARTECIPANTE_COGNOME: partecipante.cognome || '',
    PARTECIPANTE_NOME_COMPLETO: partecipante.nome_completo || `${partecipante.nome || ''} ${partecipante.cognome || ''}`.trim(),
    PARTECIPANTE_CF: partecipante.codice_fiscale || '',
    PARTECIPANTE_NUMERO: partecipante.numero || '',

    // New placeholders for Attestato_con_placeholder.docx
    NOME_PARTECIPANTE: partecipante.nome_completo || `${partecipante.nome || ''} ${partecipante.cognome || ''}`.trim(),
    CODICE_FISCALE_PARTECIPANTE: partecipante.codice_fiscale || '',
    NOME_CORSO: course.titolo || '',
    ORE_TOTALI: course.ore_totali || course.durata_totale || '',
    VERBALE_LUOGO: data.verbale?.luogo || data.sede?.nome || data.ente?.accreditato?.comune || '',
    DATA_FINE: course.data_fine || '',
    DATA_NASCITA: '', // Not available in data
    LUOGO_NASCITA: '', // Not available in data
    NOME_PROGRAMMA: partecipante.programma || 'GOL',

    CORSO_TITOLO: course.titolo || '',
    CORSO_ID: course.id || '',
    CORSO_DATA_INIZIO: course.data_inizio || '',
    CORSO_DATA_FINE: course.data_fine || '',
    CORSO_ORE_TOTALI: course.ore_totali || course.durata_totale || '',
    CORSO_STATO: course.stato || '',

    ENTE_NOME: ente.nome || '',
    ID_ENTE: ente.id || '',
    ENTE_INDIRIZZO: ente.indirizzo || '',
    ENTE_ACCREDITATO: ente.accreditato?.nome || '',

    SEDE_NOME: sede.nome || '',
    SEDE_INDIRIZZO: sede.indirizzo || '',

    DOCENTE_NOME: trainer.nome || '',
    DOCENTE_COGNOME: trainer.cognome || '',
    DOCENTE_CF: (trainer as any)?.codice_fiscale || (trainer as any)?.codiceFiscale || '',
    DOCENTE_NOME_COMPLETO: trainer.nome_completo || `${trainer.nome || ''} ${trainer.cognome || ''}`.trim(),
  };
}

/**
 * Generates one certificate per participant and attaches them into a subfolder of the ZIP
 */
export async function addCertificatesToZip(zipRoot: JSZip, data: CourseData, templateBuffer?: ArrayBuffer) {
  if (!data.partecipanti || data.partecipanti.length === 0) return;

  const folder = zipRoot.folder(CERT_FOLDER_NAME);
  if (!folder) return;

  const buffer = templateBuffer || await loadTemplateBufferFromPublic();

  for (const participant of data.partecipanti) {
    try {
      const certData = buildCertificateData(participant, data);
      const prepared = prepareDataForWordTemplate(certData);

      const blob = await processWordTemplate({
        template: buffer,
        data: prepared,
        filename: 'temp.docx',
      });

      const safeName = `${participant.numero || ''}_${participant.nome || ''}_${participant.cognome || ''}`
        .replace(/\s+/g, '_')
        .replace(/[^\w.-]/g, '');
      const filename = `Verbale Finale ${data.corso?.id || 'Corso'} - ${safeName || 'partecipante'}.docx`;

      folder.file(filename, blob);
    } catch (err) {
      console.error('Errore generazione certificato per partecipante', participant, err);
    }
  }
}

export async function fillTemplatePlaceholders(buffer: ArrayBuffer, data: Record<string, any>): Promise<Blob> {
  const prepared = prepareDataForWordTemplate(data);
  return processWordTemplate({ template: buffer, data: prepared, filename: 'cert.docx' });
}

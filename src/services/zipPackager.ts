/**
 * ZIP Packager Service
 *
 * Purpose: Creates organized ZIP archives containing all course documents
 * Generates a complete package with Word docs, Excel files, README, and metadata
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Each function creates one type of file
 * - DRY: Common Excel generation logic extracted to helpers
 * - Named Constants: Magic numbers and strings extracted
 * - Error Handling: Comprehensive error handling with logging
 * - Organization: Logical folder structure (Documenti/, Excel/)
 *
 * Why ZIP: Users need all documents together for offline storage/submission
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { CourseData } from '@/types/courseData';
import {
  generateRegistroDidattico,
  generateVerbalePartecipazione,
  generateVerbaleScrutinio,
  generateModelloFAD,
} from './wordDocumentGenerator';
import * as XLSX from 'xlsx';

// ============================================================================
// CONSTANTS - Folder structure and configuration
// ============================================================================

/**
 * ZIP Archive structure
 * Why: Standardized folder names for consistent user experience
 */
const FOLDER_STRUCTURE = {
  DOCUMENTS: 'Documenti',  // Word documents folder
  EXCEL: 'Excel',          // Excel files folder
} as const;

/**
 * File naming patterns
 * Why: Consistent naming makes files easy to identify
 */
const FILE_PREFIX = {
  REGISTRO: 'Registro_Didattico',
  VERBALE_PART: 'Verbale_Partecipazione',
  VERBALE_SCRUT: 'Verbale_Scrutinio',
  FAD: 'Modello_A_FAD',
  PARTICIPANTS: 'Partecipanti',
  ATTENDANCE: 'Registro_Presenze',
  REPORT: 'Report_Completo',
} as const;

/**
 * Excel column widths for consistent formatting
 * Why: Prevents text truncation in generated spreadsheets
 */
const EXCEL_COLUMN_WIDTHS = {
  TINY: 8,      // Numbers, checkmarks
  SMALL: 12,    // Dates, short text
  MEDIUM: 15,   // Names, codes
  LARGE: 20,    // Addresses
  XLARGE: 25,   // Titles
  XXLARGE: 30,  // Emails, long text
  XXXLARGE: 40, // Very long fields
  MEGA: 50,     // Full descriptions
} as const;

/**
 * Creates a complete ZIP package with all course documents
 *
 * Purpose: Bundles all generated documents into one downloadable archive
 * Structure: Organized folders (Documenti/, Excel/) + README + metadata.json
 *
 * Why: Users need a single file containing all documents for submission/archival
 *
 * @param data - Complete course data
 * @throws Error if document generation or ZIP creation fails
 */
export async function createCompleteZIPPackage(data: CourseData): Promise<void> {
  try {
    const zip = new JSZip();
    const courseId = data.corso?.id || 'N_A';
    const courseTitle = data.corso?.titolo || 'Corso';

    // Create logical folder structure
    // Why: Separates document types for better organization
    const documentiFolder = zip.folder(FOLDER_STRUCTURE.DOCUMENTS);
    const excelFolder = zip.folder(FOLDER_STRUCTURE.EXCEL);

    // ========================================================================
    // STEP 1: Generate and add Word documents
    // ========================================================================
    console.log('Generating Word documents...');

    // Registro Didattico - Educational register (always generated)
    const registroBlob = await generateRegistroDidattico(data);
    documentiFolder?.file(`${FILE_PREFIX.REGISTRO}_${courseId}.docx`, registroBlob);

    // Verbale Partecipazione - Participation report (always generated)
    const verbalePartBlob = await generateVerbalePartecipazione(data);
    documentiFolder?.file(`${FILE_PREFIX.VERBALE_PART}_${courseId}.docx`, verbalePartBlob);

    // Verbale Scrutinio - Examination report (always generated)
    const verbaleScrutBlob = await generateVerbaleScrutinio(data);
    documentiFolder?.file(`${FILE_PREFIX.VERBALE_SCRUT}_${courseId}.docx`, verbaleScrutBlob);

    // Modello FAD - E-learning calendar (conditional: only if FAD sessions exist)
    // Why conditional: Not all courses have distance learning components
    if (shouldGenerateFAD(data)) {
      const fadBlob = await generateModelloFAD(data);
      documentiFolder?.file(`${FILE_PREFIX.FAD}_${courseId}.docx`, fadBlob);
    }

    // ========================================================================
    // STEP 2: Generate and add Excel files
    // ========================================================================
    console.log('Generating Excel files...');

    // Participants list - Detailed participant information
    const participantsExcel = generateParticipantsExcelBlob(data);
    excelFolder?.file(`${FILE_PREFIX.PARTICIPANTS}_${courseId}.xlsx`, participantsExcel);

    // Attendance register - Empty template for marking attendance
    const attendanceExcel = generateAttendanceExcelBlob(data);
    excelFolder?.file(`${FILE_PREFIX.ATTENDANCE}_${courseId}.xlsx`, attendanceExcel);

    // Complete report - All course data in spreadsheet format
    const reportExcel = generateCourseReportExcelBlob(data);
    excelFolder?.file(`${FILE_PREFIX.REPORT}_${courseId}.xlsx`, reportExcel);

    // ========================================================================
    // STEP 3: Create README file
    // ========================================================================
    // Why: Users need instructions and package contents overview
    const readmeContent = generateREADME(data);
    zip.file('README.txt', readmeContent);

    // ========================================================================
    // STEP 4: Create metadata JSON file
    // ========================================================================
    // Why: Machine-readable metadata for future processing/archival
    const metadataContent = JSON.stringify(
      {
        corso: data.corso,
        metadata: data.metadata,
        generato_il: new Date().toISOString(),
        sistema_versione: data.metadata?.versione_sistema || '2.1.0',
      },
      null,
      2
    );
    zip.file('metadata.json', metadataContent);

    // ========================================================================
    // STEP 5: Generate and download ZIP archive
    // ========================================================================
    console.log('Creating ZIP archive...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Generate filename with course ID, sanitized title, and date
    const zipFilename = `Corso_${courseId}_${sanitizeFilename(courseTitle)}_${formatDate(new Date())}.zip`;
    saveAs(zipBlob, zipFilename);

    console.log('ZIP package created successfully!');
  } catch (error: any) {
    console.error('Error creating ZIP package:', error);
    throw new Error(`Errore durante la creazione del pacchetto ZIP: ${error.message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS - Utility functions for ZIP creation
// ============================================================================

/**
 * Determines if FAD (distance learning) document should be generated
 * Why: Not all courses have FAD components, saves unnecessary file generation
 *
 * @param data - Course data
 * @returns true if course has FAD sessions
 */
function shouldGenerateFAD(data: CourseData): boolean {
  const hasFADSessions = (data.sessioni || []).some((session) => session.is_fad);
  const isFADCourse = data.corso?.tipo?.toLowerCase().includes('fad');
  return hasFADSessions || isFADCourse;
}

// ============================================================================
// EXCEL GENERATION HELPERS - Create Excel blobs for ZIP packaging
// ============================================================================

/**
 * Generates participants Excel as Blob (for ZIP packaging)
 *
 * Purpose: Creates Excel with full participant roster and validation status
 * Why Blob: Needed for ZIP archive, not direct download
 *
 * @param data - Course data with participants
 * @returns Excel file as Blob
 */
function generateParticipantsExcelBlob(data: CourseData): Blob {
  const participantsData = (data.partecipanti || []).map((p) => ({
    'Numero': p.numero,
    'Nome': p.nome,
    'Cognome': p.cognome,
    'Nome Completo': p.nome_completo,
    'Codice Fiscale': p.codice_fiscale,
    'Email': p.email,
    'Telefono': p.telefono,
    'Cellulare': p.cellulare || '',
    'CF Valido': p._validations?.cf_valid ? 'Sì' : 'No',
    'Email Valida': p._validations?.email_valid ? 'Sì' : 'No',
  }));

  const ws = XLSX.utils.json_to_sheet(participantsData);
  ws['!cols'] = [
    { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
    { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Partecipanti');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generates attendance Excel as Blob (for ZIP packaging)
 */
function generateAttendanceExcelBlob(data: CourseData): Blob {
  const sessionDates = (data.sessioni_presenza || []).map((s) => s.data_completa);

  const attendanceData = (data.partecipanti || []).map((p) => {
    const row: any = {
      'Numero': p.numero,
      'Nome Completo': p.nome_completo,
      'Codice Fiscale': p.codice_fiscale,
    };

    sessionDates.forEach((date) => {
      row[date] = '';
    });

    row['Totale Presenze'] = '';
    row['Percentuale'] = '';

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(attendanceData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registro Presenze');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generates course report Excel as Blob (for ZIP packaging)
 */
function generateCourseReportExcelBlob(data: CourseData): Blob {
  const wb = XLSX.utils.book_new();

  // Course Summary
  const courseSummary = [
    { Campo: 'ID Corso', Valore: data.corso?.id || 'N/A' },
    { Campo: 'Titolo', Valore: data.corso?.titolo || 'N/A' },
    { Campo: 'Data Inizio', Valore: data.corso?.data_inizio || 'N/A' },
    { Campo: 'Data Fine', Valore: data.corso?.data_fine || 'N/A' },
    { Campo: 'Ore Totali', Valore: data.corso?.ore_totali || 'N/A' },
    { Campo: 'Numero Partecipanti', Valore: data.partecipanti_count.toString() },
    { Campo: 'Numero Sessioni', Valore: (data.sessioni || []).length.toString() },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(courseSummary);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Riepilogo');

  // Participants
  const participantsData = (data.partecipanti || []).map((p) => ({
    'N.': p.numero,
    'Nome Completo': p.nome_completo,
    'CF': p.codice_fiscale,
    'Email': p.email,
    'Telefono': p.telefono,
  }));

  const wsParticipants = XLSX.utils.json_to_sheet(participantsData);
  XLSX.utils.book_append_sheet(wb, wsParticipants, 'Partecipanti');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generates README content
 */
function generateREADME(data: CourseData): string {
  const courseId = data.corso?.id || 'N/A';
  const courseTitle = data.corso?.titolo || 'N/A';
  const dateGenerated = new Date().toLocaleString('it-IT');

  return `
========================================
DOCUMENTAZIONE CORSO FORMATIVO
========================================

ID Corso: ${courseId}
Titolo: ${courseTitle}
Data Generazione: ${dateGenerated}
Versione Sistema: ${data.metadata?.versione_sistema || '2.1.0'}

========================================
CONTENUTO DEL PACCHETTO
========================================

Cartella "Documenti/":
- Registro_Didattico_${courseId}.docx
  Registro didattico con elenco partecipanti e sessioni

- Verbale_Partecipazione_${courseId}.docx
  Verbale di partecipazione al corso

- Verbale_Scrutinio_${courseId}.docx
  Verbale di scrutinio finale

${(data.sessioni || []).some((s) => s.is_fad) ? `- Modello_A_FAD_${courseId}.docx\n  Calendario formazione a distanza (FAD)\n` : ''}

Cartella "Excel/":
- Partecipanti_${courseId}.xlsx
  Elenco completo partecipanti con dati di contatto

- Registro_Presenze_${courseId}.xlsx
  Foglio presenze da compilare per ogni sessione

- Report_Completo_${courseId}.xlsx
  Report completo con tutti i dati del corso

File Root:
- README.txt
  Questo file

- metadata.json
  Metadati del corso in formato JSON

========================================
INFORMAZIONI CORSO
========================================

Periodo: dal ${data.corso?.data_inizio || 'N/A'} al ${data.corso?.data_fine || 'N/A'}
Ore Totali: ${data.corso?.ore_totali || 'N/A'}
Numero Partecipanti: ${data.partecipanti_count || 0}
Numero Sessioni: ${(data.sessioni || []).length}
Sessioni in Presenza: ${(data.sessioni_presenza || []).length}
Sessioni FAD: ${(data.sessioni || []).filter((s) => s.is_fad).length}

========================================
ENTE EROGATORE
========================================

Nome: ${data.ente?.accreditato?.nome || data.ente?.nome || 'N/A'}
Indirizzo: ${data.ente?.accreditato?.via || ''} ${data.ente?.accreditato?.numero_civico || ''}
Comune: ${data.ente?.accreditato?.comune || ''} (${data.ente?.accreditato?.provincia || ''})
CAP: ${data.ente?.accreditato?.cap || ''}

========================================
VALIDAZIONI
========================================

Completamento Dati: ${data.metadata?.completamento_percentuale || 0}%
${data.metadata?.warnings && data.metadata.warnings.length > 0 ? `\nAvvisi:\n${data.metadata.warnings.map((w) => `- ${w}`).join('\n')}` : 'Nessun avviso'}

========================================
NOTE
========================================

Tutti i documenti sono stati generati automaticamente
dal sistema "Compilatore Documenti di Avvio Corso".

Per informazioni o supporto, contattare l'amministratore
del sistema.

Generato con Google Gemini AI 2.5 Flash
========================================
`;
}

/**
 * Sanitizes filename for safe file system usage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

/**
 * Formats date as YYYYMMDD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

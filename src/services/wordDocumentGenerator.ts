/**
 * Word Document Generator Service
 *
 * Purpose: Generates standardized Italian training course documents in .docx format
 * This service creates four types of official documents required for course administration:
 * - Registro Didattico (Educational Register)
 * - Verbale di Partecipazione (Participation Report)
 * - Verbale Scrutinio (Examination Report)
 * - Modello A FAD (E-Learning Calendar)
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Each function generates one specific document type
 * - DRY: Common patterns extracted into reusable helper functions
 * - Named Constants: Magic numbers replaced with descriptive constants
 * - Input Validation: All inputs validated before processing
 * - Error Handling: Comprehensive error handling with meaningful messages
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import type { CourseData } from '@/types/courseData';

// ============================================================================
// CONSTANTS - Extracted magic numbers for better maintainability
// ============================================================================

/**
 * Document spacing constants (in twips: 1/20th of a point)
 * Why these values: Based on Italian official document formatting standards
 */
const SPACING = {
  SMALL: 200,      // Small spacing between paragraphs
  MEDIUM: 400,     // Medium spacing for section breaks
  LARGE: 600,      // Large spacing before signatures/footer
} as const;

/**
 * Table column width percentages
 * Why percentages: Ensures responsive layout across different page sizes
 */
const COLUMN_WIDTH = {
  TINY: 10,        // For numbers/indices
  SMALL: 25,       // For names
  MEDIUM: 30,      // For fiscal codes
  LARGE: 40,       // For addresses/descriptions
} as const;

/**
 * Validation error messages in Italian
 */
const ERROR_MESSAGES = {
  INVALID_DATA: 'Dati del corso non validi o mancanti',
  NO_PARTICIPANTS: 'Nessun partecipante trovato',
  NO_SESSIONS: 'Nessuna sessione trovata',
  GENERATION_FAILED: 'Errore durante la generazione del documento',
} as const;

/**
 * Default placeholder text for missing data
 */
const PLACEHOLDER = {
  NOT_AVAILABLE: 'N/A',
  TO_BE_FILLED: '_____________',
  NO_DATA: 'Da compilare',
} as const;

// ============================================================================
// VALIDATION HELPERS - Ensure data integrity before processing
// ============================================================================

/**
 * Validates that course data contains minimum required information
 * Why: Prevents generating documents with missing critical data
 *
 * @param data - Course data to validate
 * @throws Error if required data is missing
 */
function validateCourseData(data: CourseData): void {
  if (!data || !data.corso) {
    throw new Error(ERROR_MESSAGES.INVALID_DATA);
  }
}

/**
 * Safely gets a value or returns placeholder
 * Why: Prevents undefined/null values in documents
 *
 * @param value - Value to check
 * @param placeholder - Placeholder to use if value is missing (default: N/A)
 * @returns Value or placeholder
 */
function getValueOrPlaceholder(value: any, placeholder: string = PLACEHOLDER.NOT_AVAILABLE): string {
  return value?.toString() || placeholder;
}

// ============================================================================
// PARAGRAPH CREATION HELPERS - DRY principle for common paragraph patterns
// ============================================================================

/**
 * Creates a standard labeled paragraph (e.g., "Label: Value")
 * Why: Reduces code duplication for info fields
 *
 * @param label - Field label
 * @param value - Field value
 * @param spacingAfter - Spacing after paragraph (default: SMALL)
 * @returns Paragraph instance
 */
function createInfoParagraph(label: string, value: string, spacingAfter: number = SPACING.SMALL): Paragraph {
  return new Paragraph({
    text: `${label}: ${getValueOrPlaceholder(value)}`,
    spacing: { after: spacingAfter },
  });
}

/**
 * Creates a document title (centered, heading level 1)
 * Why: Consistent title formatting across all documents
 *
 * @param title - Document title text
 * @returns Paragraph instance
 */
function createDocumentTitle(title: string): Paragraph {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: SPACING.MEDIUM },
  });
}

/**
 * Creates a section header (heading level 2)
 * Why: Consistent section formatting across all documents
 *
 * @param title - Section title
 * @param spacingBefore - Spacing before section (default: MEDIUM)
 * @param spacingAfter - Spacing after section (default: SMALL)
 * @returns Paragraph instance
 */
function createSectionHeader(
  title: string,
  spacingBefore: number = SPACING.MEDIUM,
  spacingAfter: number = SPACING.SMALL
): Paragraph {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: spacingBefore, after: spacingAfter },
  });
}

/**
 * Creates a signature line paragraph
 * Why: Standardizes signature formatting
 *
 * @param label - Signature label (e.g., "Il Direttore del Corso")
 * @param spacingBefore - Spacing before signature line (default: LARGE)
 * @returns Array of paragraphs for signature block
 */
function createSignatureLine(label: string, spacingBefore: number = SPACING.LARGE): Paragraph[] {
  return [
    new Paragraph({
      text: label,
      spacing: { before: spacingBefore },
    }),
    new Paragraph({
      text: PLACEHOLDER.TO_BE_FILLED,
      spacing: { after: SPACING.MEDIUM },
    }),
  ];
}

// ============================================================================
// TABLE CREATION HELPERS - Reusable table components
// ============================================================================

/**
 * Creates a table header cell with centered text
 * Why: Consistent header formatting across all tables
 *
 * @param text - Header text
 * @param width - Column width percentage
 * @returns TableCell instance
 */
function createHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ text, alignment: AlignmentType.CENTER })],
    width: { size: width, type: WidthType.PERCENTAGE },
  });
}

/**
 * Creates a standard table data cell
 * Why: Reduces boilerplate for table cell creation
 *
 * @param text - Cell text content
 * @returns TableCell instance
 */
function createDataCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph(getValueOrPlaceholder(text))],
  });
}

// ============================================================================
// DOCUMENT GENERATORS - Main public API
// ============================================================================

/**
 * Generates the "Registro Didattico e Presenze" document
 *
 * Purpose: Creates the official educational register required for course administration
 * Contains: Course info, participant list, session calendar, attendance tracking
 *
 * Why separate function: Single Responsibility - each document type has its own generator
 *
 * @param data - Complete course data
 * @returns Document blob ready for download
 * @throws Error if data validation fails or document generation fails
 */
export async function generateRegistroDidattico(data: CourseData): Promise<Blob> {
  try {
    validateCourseData(data);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Document title
            createDocumentTitle('REGISTRO DIDATTICO E PRESENZE'),

            // Course information section - Using helper functions for consistency
            createInfoParagraph('Corso', data.corso?.titolo),
            createInfoParagraph('ID Corso', data.corso?.id),
            createInfoParagraph('Date', `dal ${data.corso?.data_inizio || PLACEHOLDER.NOT_AVAILABLE} al ${data.corso?.data_fine || PLACEHOLDER.NOT_AVAILABLE}`),
            createInfoParagraph('Ore Totali', data.corso?.ore_totali),
            createInfoParagraph('Numero Pagine', data.registro?.numero_pagine, SPACING.MEDIUM),

            // Participants section
            createSectionHeader('ELENCO PARTECIPANTI'),
            createParticipantsTable(data),

            // Sessions section
            createSectionHeader('CALENDARIO SESSIONI'),
            createSessionsTable(data),

            // Footer - Validation info
            createInfoParagraph('\nData vidimazione', data.registro?.data_vidimazione || PLACEHOLDER.TO_BE_FILLED, SPACING.SMALL),
            createInfoParagraph('Luogo', data.registro?.luogo_vidimazione || PLACEHOLDER.TO_BE_FILLED),
          ],
        },
      ],
    });

    return await Packer.toBlob(doc);
  } catch (error: any) {
    console.error('Error generating Registro Didattico:', error);
    throw new Error(`${ERROR_MESSAGES.GENERATION_FAILED}: ${error.message}`);
  }
}

/**
 * Generates the "Verbale di Partecipazione" document
 *
 * Purpose: Creates official participation report for course completion
 * Contains: Meeting details, course info, entity info, participant list, signatures
 *
 * Why: Required by Italian training regulations for course certification
 *
 * @param data - Complete course data
 * @returns Document blob ready for download
 * @throws Error if data validation fails or document generation fails
 */
export async function generateVerbalePartecipazione(data: CourseData): Promise<Blob> {
  try {
    validateCourseData(data);

    // Extract entity address components for cleaner code
    const entityAddress = buildEntityAddress(data);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Document title
            createDocumentTitle('VERBALE DI PARTECIPAZIONE'),

            // Meeting metadata
            createInfoParagraph('Data', data.verbale?.data || PLACEHOLDER.TO_BE_FILLED),
            createInfoParagraph('Luogo', data.verbale?.luogo || PLACEHOLDER.TO_BE_FILLED),
            createInfoParagraph('Ora', data.verbale?.ora || PLACEHOLDER.TO_BE_FILLED, SPACING.MEDIUM),

            // Course details section
            createSectionHeader('DATI DEL CORSO'),
            createInfoParagraph('Titolo', data.corso?.titolo),
            createInfoParagraph('ID Corso', data.corso?.id),
            createInfoParagraph('Periodo', `dal ${data.corso?.data_inizio || PLACEHOLDER.NOT_AVAILABLE} al ${data.corso?.data_fine || PLACEHOLDER.NOT_AVAILABLE}`),

            // Entity information section
            createSectionHeader('ENTE EROGATORE'),
            createInfoParagraph('Nome', data.ente?.accreditato?.nome || data.ente?.nome),
            createInfoParagraph('Indirizzo', entityAddress, SPACING.MEDIUM),

            // Participants section
            createSectionHeader('PARTECIPANTI'),
            createInfoParagraph('Numero totale partecipanti', data.partecipanti_count?.toString() || '0', SPACING.SMALL),
            createParticipantsTable(data),

            // Signatures section
            new Paragraph({
              text: '\n\nFirme:',
              spacing: { before: SPACING.LARGE },
            }),
            ...createSignatureLine('\n\nIl Direttore del Corso'),
            ...createSignatureLine('Il Supervisore', SPACING.MEDIUM),
          ],
        },
      ],
    });

    return await Packer.toBlob(doc);
  } catch (error: any) {
    console.error('Error generating Verbale Partecipazione:', error);
    throw new Error(`${ERROR_MESSAGES.GENERATION_FAILED}: ${error.message}`);
  }
}

/**
 * Builds formatted entity address string
 * Why: Extracted to helper for better readability and reusability
 *
 * @param data - Course data containing entity info
 * @returns Formatted address string
 */
function buildEntityAddress(data: CourseData): string {
  const via = data.ente?.accreditato?.via || '';
  const civico = data.ente?.accreditato?.numero_civico || '';
  const comune = data.ente?.accreditato?.comune || '';
  const provincia = data.ente?.accreditato?.provincia || '';

  // Build address only if at least one component exists
  if (!via && !civico && !comune && !provincia) {
    return PLACEHOLDER.NOT_AVAILABLE;
  }

  return `${via} ${civico}, ${comune} (${provincia})`.trim();
}

/**
 * Generates the "Verbale Scrutinio" document
 *
 * Purpose: Creates official examination report for course final assessment
 * Contains: Course info, exam details, evaluation criteria, results, committee signatures
 *
 * Why: Required by Italian regulations to document examination process and results
 *
 * @param data - Complete course data
 * @returns Document blob ready for download
 * @throws Error if data validation fails or document generation fails
 */
export async function generateVerbaleScrutinio(data: CourseData): Promise<Blob> {
  try {
    validateCourseData(data);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Document title
            createDocumentTitle('VERBALE DI SCRUTINIO'),

            // Course identification
            createInfoParagraph('Corso', data.corso?.titolo),
            createInfoParagraph('ID Corso', data.corso?.id, SPACING.MEDIUM),

            // Exam details section
            createSectionHeader('DETTAGLI PROVA'),
            createInfoParagraph('Descrizione', data.verbale?.prova?.descrizione),
            createInfoParagraph('Tipo', data.verbale?.prova?.tipo),
            createInfoParagraph('Durata', data.verbale?.prova?.durata),
            createInfoParagraph('Modalità', data.verbale?.prova?.modalita, SPACING.MEDIUM),

            // Evaluation criteria section
            createSectionHeader('CRITERI DI VALUTAZIONE'),
            createInfoParagraph('Descrizione', data.verbale?.criteri?.descrizione, SPACING.MEDIUM),

            // Results section
            createSectionHeader('ESITI'),
            new Paragraph({
              text: 'Partecipanti promossi:',
              spacing: { after: SPACING.SMALL },
            }),
            new Paragraph({
              text: getValueOrPlaceholder(data.verbale?.esiti?.positivi_testo, PLACEHOLDER.NO_DATA),
              spacing: { after: SPACING.MEDIUM },
            }),
            new Paragraph({
              text: 'Partecipanti non promossi:',
              spacing: { after: SPACING.SMALL },
            }),
            new Paragraph({
              text: getValueOrPlaceholder(data.verbale?.esiti?.negativi_testo, 'Nessuno'),
              spacing: { after: SPACING.MEDIUM },
            }),

            // Protocol and signatures
            createInfoParagraph('\n\nProtocollo SIUF', data.verbale?.protocollo_siuf || PLACEHOLDER.TO_BE_FILLED, SPACING.LARGE),
            new Paragraph({
              text: '\n\nFirme della Commissione:',
              spacing: { before: SPACING.MEDIUM },
            }),
            ...createCommissionSignatures(),
          ],
        },
      ],
    });

    return await Packer.toBlob(doc);
  } catch (error: any) {
    console.error('Error generating Verbale Scrutinio:', error);
    throw new Error(`${ERROR_MESSAGES.GENERATION_FAILED}: ${error.message}`);
  }
}

/**
 * Creates signature lines for examination committee
 * Why: Extracted to helper for better code organization
 *
 * @returns Array of paragraphs for committee signatures
 */
function createCommissionSignatures(): Paragraph[] {
  return [
    new Paragraph({ text: '\nPresidente: ' + PLACEHOLDER.TO_BE_FILLED }),
    new Paragraph({ text: '\nMembro 1: ' + PLACEHOLDER.TO_BE_FILLED }),
    new Paragraph({ text: '\nMembro 2: ' + PLACEHOLDER.TO_BE_FILLED }),
  ];
}

/**
 * Generates the "Modello A FAD" document (for e-learning courses)
 *
 * Purpose: Creates official e-learning calendar required for distance training courses
 * Contains: Course info, FAD methodology, tools, objectives, session schedule, evaluation
 *
 * Why: Italian regulations require specific documentation for FAD (Formazione A Distanza) courses
 *
 * @param data - Complete course data
 * @returns Document blob ready for download
 * @throws Error if data validation fails or document generation fails
 */
export async function generateModelloFAD(data: CourseData): Promise<Blob> {
  try {
    validateCourseData(data);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Document title
            createDocumentTitle('MODELLO A - CALENDARIO FAD'),

            // Course identification
            createInfoParagraph('Corso', data.corso?.titolo),
            createInfoParagraph('ID Corso', data.corso?.id, SPACING.MEDIUM),

            // FAD methodology section
            createSectionHeader('DETTAGLI FORMAZIONE A DISTANZA'),
            createInfoParagraph('Modalità', data.calendario_fad?.modalita || 'Piattaforma e-learning'),
            createInfoParagraph('Strumenti', data.calendario_fad?.strumenti),
            createInfoParagraph('Obiettivi', data.calendario_fad?.obiettivi),

            // FAD sessions calendar
            createSectionHeader('CALENDARIO SESSIONI FAD'),
            createFADSessionsTable(data),

            // Evaluation methodology
            new Paragraph({
              text: '\n\nModalità di valutazione:',
              spacing: { before: SPACING.LARGE },
            }),
            new Paragraph({
              text: getValueOrPlaceholder(data.calendario_fad?.valutazione, 'Test finale online'),
            }),
          ],
        },
      ],
    });

    return await Packer.toBlob(doc);
  } catch (error: any) {
    console.error('Error generating Modello FAD:', error);
    throw new Error(`${ERROR_MESSAGES.GENERATION_FAILED}: ${error.message}`);
  }
}

// ============================================================================
// TABLE GENERATORS - Complex table creation for participants and sessions
// ============================================================================

/**
 * Creates participants table with all participant information
 *
 * Purpose: Generates standardized table showing all course participants
 * Why separate function: Table creation is complex, separation improves readability
 *
 * @param data - Course data containing participants array
 * @returns Table instance ready to insert into document
 */
function createParticipantsTable(data: CourseData): Table {
  // Define table headers with semantic column widths
  const headerRow = new TableRow({
    children: [
      createHeaderCell('N.', COLUMN_WIDTH.TINY),
      createHeaderCell('Nome', COLUMN_WIDTH.SMALL),
      createHeaderCell('Cognome', COLUMN_WIDTH.SMALL),
      createHeaderCell('Codice Fiscale', COLUMN_WIDTH.MEDIUM),
      createHeaderCell('Email', COLUMN_WIDTH.TINY),
    ],
  });

  // Create data rows from participants array
  const dataRows = (data.partecipanti || []).map((participant) =>
    new TableRow({
      children: [
        createDataCell(participant.numero.toString()),
        createDataCell(participant.nome),
        createDataCell(participant.cognome),
        createDataCell(participant.codice_fiscale),
        createDataCell(participant.email),
      ],
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Creates sessions table with complete session schedule
 *
 * Purpose: Generates table showing all course sessions (in-person and FAD)
 * Why separate function: Encapsulates session table creation logic
 *
 * @param data - Course data containing sessions array
 * @returns Table instance ready to insert into document
 */
function createSessionsTable(data: CourseData): Table {
  // Define table headers
  const headerRow = new TableRow({
    children: [
      createHeaderCell('N.', COLUMN_WIDTH.TINY),
      createHeaderCell('Data', COLUMN_WIDTH.SMALL),
      createHeaderCell('Orario', COLUMN_WIDTH.SMALL),
      createHeaderCell('Sede', COLUMN_WIDTH.LARGE),
      createHeaderCell('Tipo', COLUMN_WIDTH.SMALL),
    ],
  });

  // Create data rows from sessions array
  const dataRows = (data.sessioni || []).map((session) =>
    new TableRow({
      children: [
        createDataCell(session.numero.toString()),
        createDataCell(session.data_completa),
        createDataCell(`${session.ora_inizio_giornata} - ${session.ora_fine_giornata}`),
        createDataCell(session.sede),
        createDataCell(session.is_fad ? 'FAD' : 'Presenza'),
      ],
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Creates FAD (e-learning) sessions table for distance learning courses
 *
 * Purpose: Generates table showing only FAD sessions with specific details
 * Why separate function: FAD sessions require different columns and filtering logic
 *
 * @param data - Course data containing sessions array
 * @returns Table instance ready to insert into document
 */
function createFADSessionsTable(data: CourseData): Table {
  // Filter only FAD (e-learning) sessions
  // Why filtering: Modello A FAD document should only show distance learning sessions
  const fadSessions = (data.sessioni || []).filter((session) => session.is_fad);

  // Define table headers specific to FAD sessions
  const headerRow = new TableRow({
    children: [
      createHeaderCell('Data', COLUMN_WIDTH.SMALL),
      createHeaderCell('Orario', COLUMN_WIDTH.SMALL),
      createHeaderCell('Argomento', COLUMN_WIDTH.MEDIUM),
      createHeaderCell('Docente', COLUMN_WIDTH.SMALL),
    ],
  });

  // Create data rows from FAD sessions
  const dataRows = fadSessions.map((session) =>
    new TableRow({
      children: [
        createDataCell(session.data_completa),
        createDataCell(`${session.ora_inizio_giornata} - ${session.ora_fine_giornata}`),
        createDataCell('Formazione online'),
        createDataCell(data.trainer?.nome_completo),
      ],
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ============================================================================
// UTILITY FUNCTIONS - File download and helper utilities
// ============================================================================

/**
 * Downloads a Word document to the user's computer
 *
 * Purpose: Triggers browser download of generated document blob
 * Why: Abstraction layer over file-saver library for better testability
 *
 * @param blob - Document blob to download
 * @param filename - Desired filename for the downloaded file
 */
export async function downloadWordDocument(blob: Blob, filename: string): Promise<void> {
  saveAs(blob, filename);
}

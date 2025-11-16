/**
 * Excel Generator Service
 *
 * Purpose: Generates Excel spreadsheets for course data, participants, and attendance
 * Creates three types of Excel files for course administration and tracking
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Each function generates one specific Excel type
 * - DRY: Common Excel creation patterns extracted to helpers
 * - Named Constants: Column widths and sheet names extracted
 * - Error Handling: Comprehensive error handling with logging
 * - Type Safety: Full TypeScript typing throughout
 *
 * Why Excel: Users need spreadsheets for data manipulation, attendance tracking, and reporting
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { CourseData } from '@/types/courseData';

// ============================================================================
// CONSTANTS - Excel configuration and formatting
// ============================================================================

/**
 * Excel column widths for consistent formatting
 * Why: Prevents text truncation and ensures readability
 * Values are in character width units (wch)
 */
const COLUMN_WIDTHS = {
  TINY: 8,       // Numbers, indices (e.g., "N.")
  SMALL: 12,     // Short codes, dates
  MEDIUM: 15,    // Names, phone numbers
  LARGE: 18,     // Fiscal codes
  XLARGE: 20,    // Longer text fields
  XXLARGE: 25,   // Titles, addresses
  XXXLARGE: 30,  // Emails, long descriptions
  MEGA: 40,      // Very long fields
  SUPER: 50,     // Maximum width fields
} as const;

/**
 * Sheet names for Excel workbooks
 * Why: Consistent naming across all generated files
 */
const SHEET_NAMES = {
  PARTICIPANTS: 'Partecipanti',
  COURSE_INFO: 'Info Corso',
  ATTENDANCE: 'Registro Presenze',
  SESSIONS: 'Sessioni',
  SUMMARY: 'Riepilogo Corso',
  MODULES: 'Moduli',
  ALL_SESSIONS: 'Tutte le Sessioni',
  ENTITY: 'Ente e Sede',
} as const;

/**
 * Excel file MIME type
 * Why: Consistent MIME type for all Excel exports
 */
const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' as const;

/**
 * Default values for missing data
 * Why: Prevents undefined/null errors in spreadsheets
 */
const DEFAULTS = {
  EMPTY_STRING: '',
  ZERO: '0',
  NOT_AVAILABLE: 'N/A',
  YES: 'Sì',
  NO: 'No',
} as const;

// ============================================================================
// HELPER FUNCTIONS - Common Excel operations
// ============================================================================

/**
 * Creates an Excel blob from workbook
 * Why: DRY - Centralized blob creation logic
 *
 * @param workbook - XLSX workbook
 * @returns Blob ready for download
 */
function createExcelBlob(workbook: XLSX.WorkBook): Blob {
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: EXCEL_MIME_TYPE });
}

/**
 * Safely gets value or returns default
 * Why: Prevents undefined/null in Excel cells
 *
 * @param value - Value to check
 * @param defaultValue - Default if value is falsy
 * @returns Value or default
 */
function getValueOrDefault(value: any, defaultValue: string = DEFAULTS.EMPTY_STRING): string {
  return value || defaultValue;
}

/**
 * Converts boolean to Italian Yes/No
 * Why: Italian UI language consistency
 *
 * @param value - Boolean value
 * @returns "Sì" or "No"
 */
function booleanToItalian(value: boolean | undefined): string {
  return value ? DEFAULTS.YES : DEFAULTS.NO;
}

// ============================================================================
// EXCEL GENERATORS - Main public API
// ============================================================================

/**
 * Generates a participants roster Excel file
 *
 * Purpose: Creates comprehensive participant list with validation status
 * Contains: Participant info, contact details, validation flags
 *
 * Why: Users need participant data in spreadsheet format for manipulation and reporting
 *
 * @param data - Complete course data
 */
export function generateParticipantsExcel(data: CourseData): void {
  try {
    // Transform participant data to Excel-friendly format
    // Why: Excel requires flat object structure with string headers
    const participantsData = (data.partecipanti || []).map((p) => ({
      'Numero': p.numero,
      'Nome': p.nome,
      'Cognome': p.cognome,
      'Nome Completo': p.nome_completo,
      'Codice Fiscale': p.codice_fiscale,
      'Email': p.email,
      'Telefono': p.telefono,
      'Cellulare': getValueOrDefault(p.cellulare),
      'Programma': getValueOrDefault(p.programma),
      'Ufficio': getValueOrDefault(p.ufficio),
      'Case Manager': getValueOrDefault(p.case_manager),
      'Benefits': getValueOrDefault(p.benefits),
      'CF Valido': booleanToItalian(p._validations?.cf_valid),
      'Email Valida': booleanToItalian(p._validations?.email_valid),
      'Telefono Valido': booleanToItalian(p._validations?.phone_valid),
    }));

    // Create worksheet from JSON data
    const ws = XLSX.utils.json_to_sheet(participantsData);

    // Set column widths for better readability
    // Why: Auto-width doesn't work well, manual widths ensure no truncation
    ws['!cols'] = [
      { wch: COLUMN_WIDTHS.TINY },      // Numero
      { wch: COLUMN_WIDTHS.MEDIUM },    // Nome
      { wch: COLUMN_WIDTHS.MEDIUM },    // Cognome
      { wch: COLUMN_WIDTHS.XXLARGE },   // Nome Completo
      { wch: COLUMN_WIDTHS.LARGE },     // Codice Fiscale
      { wch: COLUMN_WIDTHS.XXXLARGE },  // Email
      { wch: COLUMN_WIDTHS.MEDIUM },    // Telefono
      { wch: COLUMN_WIDTHS.MEDIUM },    // Cellulare
      { wch: COLUMN_WIDTHS.XLARGE },    // Programma
      { wch: COLUMN_WIDTHS.XLARGE },    // Ufficio
      { wch: COLUMN_WIDTHS.XLARGE },    // Case Manager
      { wch: COLUMN_WIDTHS.XLARGE },    // Benefits
      { wch: COLUMN_WIDTHS.SMALL },     // CF Valido
      { wch: COLUMN_WIDTHS.SMALL },     // Email Valida
      { wch: COLUMN_WIDTHS.MEDIUM },    // Telefono Valido
    ];

    // Create workbook and add participants sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, SHEET_NAMES.PARTICIPANTS);

    // Add course info sheet for context
    // Why: Users need course context when viewing participant list
    const courseInfo = [
      { Campo: 'ID Corso', Valore: getValueOrDefault(data.corso?.id, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Titolo', Valore: getValueOrDefault(data.corso?.titolo, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Tipo', Valore: getValueOrDefault(data.corso?.tipo, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Data Inizio', Valore: getValueOrDefault(data.corso?.data_inizio, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Data Fine', Valore: getValueOrDefault(data.corso?.data_fine, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Ore Totali', Valore: getValueOrDefault(data.corso?.ore_totali, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Stato', Valore: getValueOrDefault(data.corso?.stato, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Capienza', Valore: getValueOrDefault(data.corso?.capienza, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Numero Partecipanti', Valore: data.partecipanti_count.toString() },
    ];

    const wsInfo = XLSX.utils.json_to_sheet(courseInfo);
    wsInfo['!cols'] = [{ wch: COLUMN_WIDTHS.XLARGE }, { wch: COLUMN_WIDTHS.SUPER }];
    XLSX.utils.book_append_sheet(wb, wsInfo, SHEET_NAMES.COURSE_INFO);

    // Generate and download Excel file
    const blob = createExcelBlob(wb);
    const filename = `Partecipanti_Corso_${data.corso?.id || 'N_A'}.xlsx`;
    saveAs(blob, filename);

    console.log(`Participants Excel generated: ${filename}`);
  } catch (error: any) {
    console.error('Error generating participants Excel:', error);
    throw new Error(`Errore durante la generazione del file Excel partecipanti: ${error.message}`);
  }
}

/**
 * Generates an attendance tracking Excel file
 *
 * Purpose: Creates empty attendance register for manual marking
 * Contains: Participants in rows, session dates in columns, totals
 *
 * Why: Users need pre-formatted spreadsheet to manually track attendance during sessions
 *
 * @param data - Complete course data
 */
export function generateAttendanceExcel(data: CourseData): void {
  try {
    // Extract session dates for column headers
    // Why: Only in-person sessions require attendance tracking
    const sessionDates = (data.sessioni_presenza || []).map((s) => s.data_completa);

    // Prepare attendance grid
    // Why: Rows = participants, Columns = sessions (empty for manual marking)
    const attendanceData = (data.partecipanti || []).map((p) => {
      const row: any = {
        'Numero': p.numero,
        'Nome Completo': p.nome_completo,
        'Codice Fiscale': p.codice_fiscale,
      };

      // Add empty column for each session date
      // Why: Users will manually mark attendance (P/A/R)
      sessionDates.forEach((date) => {
        row[date] = DEFAULTS.EMPTY_STRING;
      });

      // Add calculated columns (empty for now, users can add formulas)
      row['Totale Presenze'] = DEFAULTS.EMPTY_STRING;
      row['Percentuale'] = DEFAULTS.EMPTY_STRING;

      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(attendanceData);

    // Set column widths dynamically based on number of sessions
    // Why: Ensures all columns are visible without horizontal scrolling
    const colWidths = [
      { wch: COLUMN_WIDTHS.TINY },       // Numero
      { wch: COLUMN_WIDTHS.XXLARGE },    // Nome Completo
      { wch: COLUMN_WIDTHS.LARGE },      // Codice Fiscale
      ...sessionDates.map(() => ({ wch: COLUMN_WIDTHS.SMALL })), // Session date columns
      { wch: COLUMN_WIDTHS.MEDIUM },     // Totale Presenze
      { wch: COLUMN_WIDTHS.SMALL },      // Percentuale
    ];
    ws['!cols'] = colWidths;

    // Create workbook and add attendance sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, SHEET_NAMES.ATTENDANCE);

    // Add sessions info sheet for reference
    // Why: Users need to know what each session column represents
    const sessionsInfo = (data.sessioni_presenza || []).map((s) => ({
      'Numero': s.numero,
      'Data': s.data_completa,
      'Giorno': s.giorno_settimana,
      'Orario': `${s.ora_inizio_giornata} - ${s.ora_fine_giornata}`,
      'Sede': s.sede,
    }));

    const wsSessions = XLSX.utils.json_to_sheet(sessionsInfo);
    wsSessions['!cols'] = [
      { wch: COLUMN_WIDTHS.TINY },    // Numero
      { wch: COLUMN_WIDTHS.SMALL },   // Data
      { wch: COLUMN_WIDTHS.SMALL },   // Giorno
      { wch: COLUMN_WIDTHS.XLARGE },  // Orario
      { wch: COLUMN_WIDTHS.MEGA },    // Sede
    ];
    XLSX.utils.book_append_sheet(wb, wsSessions, SHEET_NAMES.SESSIONS);

    // Generate and download Excel file
    const blob = createExcelBlob(wb);
    const filename = `Presenze_Corso_${data.corso?.id || 'N_A'}.xlsx`;
    saveAs(blob, filename);

    console.log(`Attendance Excel generated: ${filename}`);
  } catch (error: any) {
    console.error('Error generating attendance Excel:', error);
    throw new Error(`Errore durante la generazione del registro presenze: ${error.message}`);
  }
}

/**
 * Generates a detailed course report Excel file
 *
 * Purpose: Creates comprehensive multi-sheet report with all course data
 * Contains: Course summary, modules, sessions, participants, entity info
 *
 * Why: Users need complete data export for analysis, archival, and reporting
 *
 * @param data - Complete course data
 */
export function generateCourseReportExcel(data: CourseData): void {
  try {
    const wb = XLSX.utils.book_new();

    // ========================================================================
    // SHEET 1: Course Summary - High-level course information
    // ========================================================================
    const courseSummary = [
      { Campo: 'ID Corso', Valore: getValueOrDefault(data.corso?.id, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Titolo', Valore: getValueOrDefault(data.corso?.titolo, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Tipo', Valore: getValueOrDefault(data.corso?.tipo, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Data Inizio', Valore: getValueOrDefault(data.corso?.data_inizio, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Data Fine', Valore: getValueOrDefault(data.corso?.data_fine, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Anno', Valore: getValueOrDefault(data.corso?.anno, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Durata Totale', Valore: getValueOrDefault(data.corso?.durata_totale, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Ore Totali', Valore: getValueOrDefault(data.corso?.ore_totali, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Ore Rendicontabili', Valore: getValueOrDefault(data.corso?.ore_rendicontabili, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Stato', Valore: getValueOrDefault(data.corso?.stato, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Capienza', Valore: getValueOrDefault(data.corso?.capienza, DEFAULTS.NOT_AVAILABLE) },
      { Campo: 'Iscritti/Totale', Valore: `${data.corso?.capienza_numero || 0}/${data.corso?.capienza_totale || 0}` },
      { Campo: 'Numero Partecipanti', Valore: data.partecipanti_count.toString() },
      { Campo: 'Numero Sessioni Totali', Valore: (data.sessioni || []).length.toString() },
      { Campo: 'Numero Sessioni Presenza', Valore: (data.sessioni_presenza || []).length.toString() },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(courseSummary);
    wsSummary['!cols'] = [{ wch: COLUMN_WIDTHS.XXLARGE }, { wch: COLUMN_WIDTHS.SUPER }];
    XLSX.utils.book_append_sheet(wb, wsSummary, SHEET_NAMES.SUMMARY);

    // ========================================================================
    // SHEET 2: Modules - Course module details (if multi-module course)
    // ========================================================================
    if (data.moduli && data.moduli.length > 0) {
      const moduliData = data.moduli.map((m) => ({
        'ID Modulo': m.id,
        'ID Sezione': m.id_sezione,
        'Titolo': m.titolo,
        'Data Inizio': m.data_inizio,
        'Data Fine': m.data_fine,
        'Ore Totali': m.ore_totali,
        'Durata': m.durata,
        'Capienza': m.capienza,
        'Stato': m.stato,
        'Tipo Sede': m.tipo_sede,
        'Provider': m.provider,
        'Numero Sessioni': m.numero_sessioni,
      }));

      const wsModuli = XLSX.utils.json_to_sheet(moduliData);
      XLSX.utils.book_append_sheet(wb, wsModuli, SHEET_NAMES.MODULES);
    }

    // ========================================================================
    // SHEET 3: All Sessions - Complete session schedule
    // ========================================================================
    const allSessionsData = (data.sessioni || []).map((s) => ({
      'Numero': s.numero,
      'Data': s.data_completa,
      'Giorno Settimana': s.giorno_settimana,
      'Mese': s.mese,
      'Anno': s.anno,
      'Ora Inizio': s.ora_inizio_giornata,
      'Ora Fine': s.ora_fine_giornata,
      'Sede': s.sede,
      'Tipo Sede': s.tipo_sede,
      'FAD': booleanToItalian(s.is_fad),
    }));

    const wsSessions = XLSX.utils.json_to_sheet(allSessionsData);
    XLSX.utils.book_append_sheet(wb, wsSessions, SHEET_NAMES.ALL_SESSIONS);

    // ========================================================================
    // SHEET 4: Participants - Participant list with validations
    // ========================================================================
    const participantsData = (data.partecipanti || []).map((p) => ({
      'N.': p.numero,
      'Nome': p.nome,
      'Cognome': p.cognome,
      'CF': p.codice_fiscale,
      'Email': p.email,
      'Telefono': p.telefono,
      'CF Valido': booleanToItalian(p._validations?.cf_valid),
      'Email Valida': booleanToItalian(p._validations?.email_valid),
    }));

    const wsParticipants = XLSX.utils.json_to_sheet(participantsData);
    XLSX.utils.book_append_sheet(wb, wsParticipants, SHEET_NAMES.PARTICIPANTS);

    // ========================================================================
    // SHEET 5: Entity and Location - Provider and venue information
    // ========================================================================
    const entityInfo = [
      { Campo: 'Nome Ente', Valore: data.ente?.accreditato?.nome || data.ente?.nome || DEFAULTS.NOT_AVAILABLE },
      { Campo: 'Via', Valore: getValueOrDefault(data.ente?.accreditato?.via) },
      { Campo: 'Numero Civico', Valore: getValueOrDefault(data.ente?.accreditato?.numero_civico) },
      { Campo: 'Comune', Valore: getValueOrDefault(data.ente?.accreditato?.comune) },
      { Campo: 'CAP', Valore: getValueOrDefault(data.ente?.accreditato?.cap) },
      { Campo: 'Provincia', Valore: getValueOrDefault(data.ente?.accreditato?.provincia) },
      { Campo: 'Sede Corso - Tipo', Valore: getValueOrDefault(data.sede?.tipo) },
      { Campo: 'Sede Corso - Nome', Valore: getValueOrDefault(data.sede?.nome) },
      { Campo: 'Sede Corso - Indirizzo', Valore: getValueOrDefault(data.sede?.indirizzo) },
      { Campo: 'Trainer', Valore: getValueOrDefault(data.trainer?.nome_completo, DEFAULTS.NOT_AVAILABLE) },
    ];

    const wsEntity = XLSX.utils.json_to_sheet(entityInfo);
    wsEntity['!cols'] = [{ wch: COLUMN_WIDTHS.XXLARGE }, { wch: COLUMN_WIDTHS.SUPER }];
    XLSX.utils.book_append_sheet(wb, wsEntity, SHEET_NAMES.ENTITY);

    // Generate and download Excel file
    const blob = createExcelBlob(wb);
    const filename = `Report_Completo_Corso_${data.corso?.id || 'N_A'}.xlsx`;
    saveAs(blob, filename);

    console.log(`Course report Excel generated: ${filename}`);
  } catch (error: any) {
    console.error('Error generating course report Excel:', error);
    throw new Error(`Errore durante la generazione del report corso: ${error.message}`);
  }
}

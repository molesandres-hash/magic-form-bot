/**
 * Excel Template Generator with Clean Formatting
 *
 * Purpose: Generates Excel files with text-only formatting (no styles)
 * Implements specific business logic:
 * - Splits sessions into hourly blocks
 * - Skips lunch break (13:00-14:00)
 * - Determines TIPOLOGIA based on location
 * - Creates clean, lightweight Excel files (~11KB not 36KB)
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ExcelColumnDefinition } from '@/types/templateConfig';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Lunch break start hour (13:00) */
const LUNCH_BREAK_START_HOUR = 13;

/** Lunch break end hour (14:00) */
const LUNCH_BREAK_END_HOUR = 14;

/** Minutes per hour */
const MINUTES_PER_HOUR = 60;

/** TIPOLOGIA value for office/in-person sessions */
const TIPOLOGIA_OFFICE = '1';

/** TIPOLOGIA value for online/FAD sessions */
const TIPOLOGIA_ONLINE = '4';

/** SVOLGIMENTO value for office sessions */
const SVOLGIMENTO_OFFICE = '1';

/** SVOLGIMENTO value for online sessions */
const SVOLGIMENTO_ONLINE = '';

// ============================================================================
// TYPES
// ============================================================================

interface SessionData {
  data: string;           // DD/MM/YYYY
  ora_inizio: string;     // HH:MM
  ora_fine: string;       // HH:MM
  luogo: string;          // Location/venue
}

interface ExcelRowData {
  ID_SEZIONE: string;
  DATA_LEZIONE: string;
  TOTALE_ORE: string;
  ORA_INIZIO: string;
  ORA_FINE: string;
  TIPOLOGIA: string;
  CODICE_FISCALE_DOCENTE: string;
  MATERIA: string;
  CONTENUTI_MATERIA: string;
  SVOLGIMENTO_SEDE_LEZIONE: string;
}

// ============================================================================
// BUSINESS LOGIC - Session Processing
// ============================================================================

/**
 * Determines TIPOLOGIA and SVOLGIMENTO based on location
 *
 * Logic:
 * - If location contains "office"/"ufficio" → TIPOLOGIA=1, SVOLGIMENTO=1
 * - Otherwise (online/FAD) → TIPOLOGIA=4, SVOLGIMENTO=""
 */
function determineTipologiaAndSvolgimento(luogo: string): {
  tipologia: string;
  svolgimento: string;
} {
  const luogoLower = luogo.toLowerCase();
  const isOffice =
    luogoLower.includes('office') ||
    luogoLower.includes('ufficio') ||
    luogoLower.includes('presenza');

  return {
    tipologia: isOffice ? TIPOLOGIA_OFFICE : TIPOLOGIA_ONLINE,
    svolgimento: isOffice ? SVOLGIMENTO_OFFICE : SVOLGIMENTO_ONLINE,
  };
}

/**
 * Splits a session into hourly blocks, skipping lunch break
 *
 * Example:
 * Input: 09:00-17:00
 * Output: 7 blocks (09-10, 10-11, 11-12, 12-13, 14-15, 15-16, 16-17)
 * Note: 13:00-14:00 is SKIPPED (lunch break)
 *
 * @param oraInizio - Start time (HH:MM)
 * @param oraFine - End time (HH:MM)
 * @returns Array of hourly time blocks
 */
function splitIntoHourlyBlocks(
  oraInizio: string,
  oraFine: string
): Array<{ ora_inizio: string; ora_fine: string; durata: string }> {
  const blocks: Array<{ ora_inizio: string; ora_fine: string; durata: string }> = [];

  // Validate input
  if (!oraInizio || !oraFine) {
    console.warn('Missing start or end time');
    return blocks;
  }

  // Validate time format
  const timeRegex = /^\d{1,2}:\d{2}$/;
  if (!timeRegex.test(oraInizio) || !timeRegex.test(oraFine)) {
    console.warn('Invalid time format. Expected HH:MM');
    return blocks;
  }

  // Parse times
  const startParts = oraInizio.split(':').map(Number);
  const endParts = oraFine.split(':').map(Number);

  if (startParts.some(isNaN) || endParts.some(isNaN)) {
    console.warn('Invalid time values');
    return blocks;
  }

  const [startHour, startMin] = startParts;
  const [endHour, endMin] = endParts;

  // Validate hour/minute ranges
  if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23 ||
      startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
    console.warn('Invalid hour or minute values');
    return blocks;
  }

  // Check if end time is after start time
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  if (endMinutes <= startMinutes) {
    console.warn('End time must be after start time');
    return blocks;
  }

  // Lunch break constants (in minutes since midnight)
  const LUNCH_START = LUNCH_BREAK_START_HOUR * MINUTES_PER_HOUR; // 780 minutes (13:00)
  const LUNCH_END = LUNCH_BREAK_END_HOUR * MINUTES_PER_HOUR;     // 840 minutes (14:00)

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    // Calculate next hour
    let nextHour = currentHour + 1;
    let nextMin = currentMin;

    // Don't exceed end time
    if (nextHour > endHour || (nextHour === endHour && nextMin > endMin)) {
      nextHour = endHour;
      nextMin = endMin;
    }

    const blockStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    const blockEnd = `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`;

    // Convert current block times to minutes for comparison
    const blockStartMinutes = currentHour * 60 + currentMin;
    const blockEndMinutes = nextHour * 60 + nextMin;

    // Skip if block overlaps with lunch break (13:00-14:00)
    // A block overlaps if it starts before lunch ends AND ends after lunch starts
    const overlapsLunch = blockStartMinutes < LUNCH_END && blockEndMinutes > LUNCH_START;

    if (!overlapsLunch) {
      blocks.push({
        ora_inizio: blockStart,
        ora_fine: blockEnd,
        durata: '1', // 1 hour blocks
      });
    }

    currentHour = nextHour;
    currentMin = nextMin;
  }

  return blocks;
}

/**
 * Processes sessions into Excel rows with hourly blocks
 */
export function processSessionsIntoRows(
  sessions: SessionData[],
  idSezione: string,
  codiceFiscaleDocente: string,
  materia: string
): ExcelRowData[] {
  const rows: ExcelRowData[] = [];

  // Validate inputs
  if (!sessions || !Array.isArray(sessions)) {
    console.warn('Invalid sessions array');
    return rows;
  }

  sessions.forEach((session, index) => {
    // Validate session data
    if (!session) {
      console.warn(`Session at index ${index} is null or undefined`);
      return;
    }

    if (!session.data || !session.ora_inizio || !session.ora_fine || !session.luogo) {
      console.warn(`Session at index ${index} is missing required fields`, session);
      return;
    }

    const { tipologia, svolgimento } = determineTipologiaAndSvolgimento(session.luogo);

    // Split into hourly blocks
    const blocks = splitIntoHourlyBlocks(session.ora_inizio, session.ora_fine);

    blocks.forEach((block) => {
      rows.push({
        ID_SEZIONE: idSezione || '',
        DATA_LEZIONE: session.data || '',
        TOTALE_ORE: block.durata,
        ORA_INIZIO: block.ora_inizio,
        ORA_FINE: block.ora_fine,
        TIPOLOGIA: tipologia,
        CODICE_FISCALE_DOCENTE: codiceFiscaleDocente || '',
        MATERIA: materia || '',
        CONTENUTI_MATERIA: materia || '', // Same as MATERIA as per requirements
        SVOLGIMENTO_SEDE_LEZIONE: svolgimento,
      });
    });
  });

  return rows;
}

// ============================================================================
// EXCEL GENERATION WITH CLEAN FORMATTING
// ============================================================================

/**
 * Creates a clean Excel file with text-only formatting
 *
 * Why: Default XLSX library adds styles that bloat file size (36KB)
 * This function creates minimal Excel with only text cells (~11KB)
 *
 * @param rows - Data rows to write
 * @param columns - Column definitions
 * @param filename - Output filename
 */
export function generateCleanExcel(
  rows: ExcelRowData[],
  columns: ExcelColumnDefinition[],
  filename: string
): void {
  try {
    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: columns.map((c) => c.header),
    });

    // Force ALL cells to TEXT format
    // This prevents Excel from auto-converting strings to numbers/dates
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;

        // Force string type and text format
        ws[cellRef].t = 's'; // Type: string
        ws[cellRef].z = '@'; // Format: text
      }
    }

    // Set column widths
    ws['!cols'] = columns.map((col) => ({ wch: col.width }));

    // Create workbook with minimal settings
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');

    // Write with minimal options (no styles, no themes)
    const excelBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: false, // Disable styles
      bookSST: false,    // Disable shared string table optimization
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, filename);

    console.log(`Clean Excel generated: ${filename}`);
  } catch (error: any) {
    console.error('Error generating clean Excel:', error);
    throw new Error(`Errore durante la generazione Excel: ${error.message}`);
  }
}

/**
 * Generates Excel from template-extracted data
 *
 * @param extractedData - Data extracted by AI based on template
 * @param templateConfig - Template configuration (used for column definitions)
 */
export function generateExcelFromTemplate(
  extractedData: Record<string, any>,
  templateConfig: any // TemplateConfig
): void {
  try {
    // Extract required fields
    const idSezione = extractedData.ID_SEZIONE || '';
    const codiceFiscaleDocente = extractedData.CODICE_FISCALE_DOCENTE || '';
    const materia = extractedData.MATERIA || '';
    const sessioni: SessionData[] = extractedData.SESSIONI || [];

    if (!sessioni || sessioni.length === 0) {
      throw new Error('Nessuna sessione trovata nei dati estratti');
    }

    // Process sessions into rows
    const rows = processSessionsIntoRows(
      sessioni,
      idSezione,
      codiceFiscaleDocente,
      materia
    );

    console.log(`Generated ${rows.length} rows from ${sessioni.length} sessions`);

    // Get column definitions from template config
    const columns =
      templateConfig.postProcessing?.excelColumns || getDefaultColumns();

    // Generate filename
    const filename = `Registro_Ore_${idSezione || 'NA'}_${formatDate(new Date())}.xlsx`;

    // Generate clean Excel
    generateCleanExcel(rows, columns, filename);
  } catch (error: any) {
    console.error('Error generating Excel from template:', error);
    throw error;
  }
}

/**
 * Default column definitions if not specified in template
 */
function getDefaultColumns(): ExcelColumnDefinition[] {
  return [
    { header: 'ID_SEZIONE', variableName: 'ID_SEZIONE', width: 15, format: 'text' },
    { header: 'DATA LEZIONE', variableName: 'DATA_LEZIONE', width: 12, format: 'text' },
    { header: 'TOTALE_ORE', variableName: 'TOTALE_ORE', width: 10, format: 'text' },
    { header: 'ORA_INIZIO', variableName: 'ORA_INIZIO', width: 10, format: 'text' },
    { header: 'ORA_FINE', variableName: 'ORA_FINE', width: 10, format: 'text' },
    { header: 'TIPOLOGIA', variableName: 'TIPOLOGIA', width: 10, format: 'text' },
    { header: 'CODICE FISCALE DOCENTE', variableName: 'CODICE_FISCALE_DOCENTE', width: 20, format: 'text' },
    { header: 'MATERIA', variableName: 'MATERIA', width: 30, format: 'text' },
    { header: 'CONTENUTI MATERIA', variableName: 'CONTENUTI_MATERIA', width: 30, format: 'text' },
    { header: 'SVOLGIMENTO SEDE LEZIONE', variableName: 'SVOLGIMENTO_SEDE_LEZIONE', width: 25, format: 'text' },
  ];
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

// ============================================================================
// EXPORT UTILITY FOR BLOB CREATION (for ZIP packaging)
// ============================================================================

/**
 * Creates Excel blob without saving (for ZIP packaging)
 */
export function createCleanExcelBlob(
  rows: ExcelRowData[],
  columns: ExcelColumnDefinition[]
): Blob {
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((c) => c.header),
  });

  // Force text format on all cells
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;
      ws[cellRef].t = 's';
      ws[cellRef].z = '@';
    }
  }

  ws['!cols'] = columns.map((col) => ({ wch: col.width }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registro');

  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: false,
    bookSST: false,
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}


import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { CourseData } from '@/types/courseData';

/**
 * Generates an Excel attendance register with formulas
 */
export const generateAttendanceRegister = async (data: CourseData): Promise<void> => {
  // 1. Prepare data structures
  const participants = (data.partecipanti || []).sort((a, b) => a.numero - b.numero);
  // Filter only presence sessions or use all? User said "calendario delle lezioni". 
  // Usually attendance register is for all sessions.
  const sessions = (data.sessioni || []).sort((a, b) => {
    // Sort by date/time
    const dateA = new Date(a.data_completa.split('/').reverse().join('-') + ' ' + a.ora_inizio_giornata);
    const dateB = new Date(b.data_completa.split('/').reverse().join('-') + ' ' + b.ora_inizio_giornata);
    return dateA.getTime() - dateB.getTime();
  });

  if (participants.length === 0 || sessions.length === 0) {
    console.warn('No participants or sessions to generate register');
    return;
  }

  // 2. Create Worksheet
  const wb = XLSX.utils.book_new();
  const ws_data: any[][] = [];

  // --- HEADERS (Row 1) ---
  const headers = ['Nome Corsista'];
  sessions.forEach(s => headers.push(s.data_completa)); // Dates as headers
  headers.push('Totale Ore Corsista'); // Last column
  ws_data.push(headers);

  // --- PARTICIPANT ROWS (Row 2 to N+1) ---
  // Start row index is 1 (0-based) -> Row 2 in Excel
  const startRow = 2;
  const numParticipants = participants.length;
  const endRow = startRow + numParticipants - 1; // Excel row number of last participant

  // Column indices
  const firstDateColIdx = 1; // Column B (0-based index 1)
  const lastDateColIdx = firstDateColIdx + sessions.length - 1;
  const totalColIdx = lastDateColIdx + 1;

  participants.forEach((p) => {
    const row: any[] = [p.nome_completo];
    // Empty cells for hours (or 0)
    for (let i = 0; i < sessions.length; i++) {
      row.push(''); // User will fill this
    }
    // Placeholder for total formula (will be set via cell object directly later, or we can push a dummy)
    row.push(0);
    ws_data.push(row);
  });

  // --- FOOTER ROWS ---
  // Totali Giorno (Row N+2)
  const totalDayRow: any[] = ['Totali Giorno'];
  for (let i = 0; i < sessions.length; i++) {
    totalDayRow.push(0); // Placeholder for formula
  }
  totalDayRow.push(''); // Empty for total column
  ws_data.push(totalDayRow);

  // Cumulative (Row N+3)
  const cumulativeRow: any[] = ['Ore Cumulative'];
  for (let i = 0; i < sessions.length; i++) {
    cumulativeRow.push(0); // Placeholder for formula
  }
  cumulativeRow.push(''); // Empty for total column
  ws_data.push(cumulativeRow);

  // 3. Convert to Sheet
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // 4. ADD FORMULAS
  // Helper to get Excel cell reference (e.g., "A1", "B2")
  const encode = XLSX.utils.encode_cell;
  const encodeCol = XLSX.utils.encode_col;

  // A. Participant Totals (Column K in example)
  // For each participant row (from startRow to endRow)
  for (let i = 0; i < numParticipants; i++) {
    const rowIndex = startRow + i - 1; // 0-based index for data array, but formulas use 1-based Excel rows
    const excelRow = startRow + i; // 1-based Excel row

    // Range: FirstDateCol to LastDateCol for this row
    // e.g. SUM(B2:J2)
    const startRef = encode({ r: rowIndex + 1, c: firstDateColIdx }); // +1 because encode uses 0-based row but we want to be safe? No, encode uses 0-based.
    // Wait, XLSX.utils.encode_cell({r:0, c:0}) is "A1".
    // My participant rows in `ws_data` start at index 1 (row 2).

    const rowIdx = 1 + i; // 0-based index in sheet (Header is 0)

    const startCell = encode({ r: rowIdx, c: firstDateColIdx });
    const endCell = encode({ r: rowIdx, c: lastDateColIdx });
    const totalCellRef = encode({ r: rowIdx, c: totalColIdx });

    // Set formula
    ws[totalCellRef] = { t: 'n', f: `SUM(${startCell}:${endCell})`, v: 0 };
  }

  // B. Daily Totals (Row N+2)
  const totalDayRowIdx = 1 + numParticipants; // 0-based index for "Totali Giorno" row
  // For each date column
  for (let c = firstDateColIdx; c <= lastDateColIdx; c++) {
    const startCell = encode({ r: 1, c: c }); // First participant (Row 2)
    const endCell = encode({ r: 1 + numParticipants - 1, c: c }); // Last participant
    const targetCell = encode({ r: totalDayRowIdx, c: c });

    ws[targetCell] = { t: 'n', f: `SUM(${startCell}:${endCell})`, v: 0 };
  }

  // C. Cumulative Totals (Row N+3)
  const cumulativeRowIdx = totalDayRowIdx + 1; // 0-based index for "Ore Cumulative" row

  // First date column: Cumulative = Daily Total
  const firstDayTotalCell = encode({ r: totalDayRowIdx, c: firstDateColIdx });
  const firstCumulativeCell = encode({ r: cumulativeRowIdx, c: firstDateColIdx });
  ws[firstCumulativeCell] = { t: 'n', f: firstDayTotalCell, v: 0 };

  // Subsequent columns: Cumulative = Daily Total + Previous Cumulative
  for (let c = firstDateColIdx + 1; c <= lastDateColIdx; c++) {
    const currentDayTotalCell = encode({ r: totalDayRowIdx, c: c });
    const prevCumulativeCell = encode({ r: cumulativeRowIdx, c: c - 1 });
    const targetCell = encode({ r: cumulativeRowIdx, c: c });

    ws[targetCell] = { t: 'n', f: `${currentDayTotalCell}+${prevCumulativeCell}`, v: 0 };
  }

  // 5. Styling (Column Widths)
  const wscols = [
    { wch: 30 }, // Name column width
  ];
  // Date columns width
  for (let i = 0; i < sessions.length; i++) {
    wscols.push({ wch: 12 });
  }
  wscols.push({ wch: 15 }); // Total column
  ws['!cols'] = wscols;

  // 6. Save File
  XLSX.utils.book_append_sheet(wb, ws, 'RegistroPresenze');

  // Generate filename
  const courseTitle = data.corso?.titolo?.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'Corso';
  const filename = `Registro_Presenze_${courseTitle}.xlsx`;

  // Write and save
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);
};

/**
 * Alias for backward compatibility
 * @deprecated Use generateAttendanceRegister instead
 */
export const generateAttendanceExcel = generateAttendanceRegister;

/**
 * Generates a participants list Excel file
 */
export const generateParticipantsExcel = async (data: CourseData): Promise<void> => {
  const participants = (data.partecipanti || []).sort((a, b) => a.numero - b.numero);

  if (participants.length === 0) {
    console.warn('No participants to export');
    return;
  }

  // Create worksheet data
  const ws_data: any[][] = [
    ['Numero', 'Nome', 'Cognome', 'Nome Completo', 'Codice Fiscale', 'Email', 'Telefono', 'Cellulare', 'Benefits']
  ];

  participants.forEach(p => {
    ws_data.push([
      p.numero,
      p.nome,
      p.cognome,
      p.nome_completo,
      p.codice_fiscale,
      p.email || '',
      p.telefono || '',
      p.cellulare || '',
      p.benefits || 'No'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Column widths
  ws['!cols'] = [
    { wch: 8 },  // Numero
    { wch: 15 }, // Nome
    { wch: 15 }, // Cognome
    { wch: 30 }, // Nome Completo
    { wch: 18 }, // Codice Fiscale
    { wch: 30 }, // Email
    { wch: 15 }, // Telefono
    { wch: 15 }, // Cellulare
    { wch: 10 }, // Benefits
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Partecipanti');

  const courseTitle = data.corso?.titolo?.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'Corso';
  const filename = `Partecipanti_${courseTitle}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);
};

/**
 * Generates a course report Excel file
 */
export const generateCourseReportExcel = async (data: CourseData): Promise<void> => {
  const wb = XLSX.utils.book_new();

  // Course Summary Sheet
  const courseSummary = [
    ['Campo', 'Valore'],
    ['ID Corso', data.corso?.id || 'N/A'],
    ['Titolo', data.corso?.titolo || 'N/A'],
    ['Data Inizio', data.corso?.data_inizio || 'N/A'],
    ['Data Fine', data.corso?.data_fine || 'N/A'],
    ['Ore Totali', data.corso?.ore_totali || 'N/A'],
    ['Numero Partecipanti', data.partecipanti_count?.toString() || '0'],
    ['Numero Sessioni', (data.sessioni || []).length.toString()],
    ['Sessioni Presenza', (data.sessioni_presenza || []).length.toString()],
    ['Sessioni FAD', (data.sessioni || []).filter(s => s.is_fad).length.toString()],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(courseSummary);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Riepilogo');

  // Participants Sheet
  const participantsData = (data.partecipanti || []).sort((a, b) => a.numero - b.numero).map(p => ({
    'Numero': p.numero,
    'Nome Completo': p.nome_completo,
    'Codice Fiscale': p.codice_fiscale,
    'Email': p.email || '',
    'Telefono': p.telefono || '',
  }));

  if (participantsData.length > 0) {
    const wsParticipants = XLSX.utils.json_to_sheet(participantsData);
    XLSX.utils.book_append_sheet(wb, wsParticipants, 'Partecipanti');
  }

  // Sessions Sheet
  const sessionsData = (data.sessioni || []).map(s => ({
    'Data': s.data_completa,
    'Ora Inizio': s.ora_inizio_giornata,
    'Ora Fine': s.ora_fine_giornata,
    'Sede': s.sede,
    'Modalità': s.is_fad ? 'FAD' : 'Presenza',
  }));

  if (sessionsData.length > 0) {
    const wsSessions = XLSX.utils.json_to_sheet(sessionsData);
    XLSX.utils.book_append_sheet(wb, wsSessions, 'Sessioni');
  }

  const courseTitle = data.corso?.titolo?.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'Corso';
  const filename = `Report_${courseTitle}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);
};


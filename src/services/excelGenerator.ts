/**
 * Excel Generator Service
 * Generates Excel files for participants and attendance tracking
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { CourseData } from '@/types/courseData';

/**
 * Generates a participants roster Excel file
 * Contains all participant information
 */
export function generateParticipantsExcel(data: CourseData): void {
  // Prepare data for Excel
  const participantsData = (data.partecipanti || []).map((p) => ({
    'Numero': p.numero,
    'Nome': p.nome,
    'Cognome': p.cognome,
    'Nome Completo': p.nome_completo,
    'Codice Fiscale': p.codice_fiscale,
    'Email': p.email,
    'Telefono': p.telefono,
    'Cellulare': p.cellulare || '',
    'Programma': p.programma || '',
    'Ufficio': p.ufficio || '',
    'Case Manager': p.case_manager || '',
    'Benefits': p.benefits || '',
    'CF Valido': p._validations?.cf_valid ? 'Sì' : 'No',
    'Email Valida': p._validations?.email_valid ? 'Sì' : 'No',
    'Telefono Valido': p._validations?.phone_valid ? 'Sì' : 'No',
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(participantsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Numero
    { wch: 15 }, // Nome
    { wch: 15 }, // Cognome
    { wch: 25 }, // Nome Completo
    { wch: 18 }, // Codice Fiscale
    { wch: 30 }, // Email
    { wch: 15 }, // Telefono
    { wch: 15 }, // Cellulare
    { wch: 20 }, // Programma
    { wch: 20 }, // Ufficio
    { wch: 20 }, // Case Manager
    { wch: 20 }, // Benefits
    { wch: 12 }, // CF Valido
    { wch: 12 }, // Email Valida
    { wch: 15 }, // Telefono Valido
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Partecipanti');

  // Add course info sheet
  const courseInfo = [
    { Campo: 'ID Corso', Valore: data.corso?.id || 'N/A' },
    { Campo: 'Titolo', Valore: data.corso?.titolo || 'N/A' },
    { Campo: 'Tipo', Valore: data.corso?.tipo || 'N/A' },
    { Campo: 'Data Inizio', Valore: data.corso?.data_inizio || 'N/A' },
    { Campo: 'Data Fine', Valore: data.corso?.data_fine || 'N/A' },
    { Campo: 'Ore Totali', Valore: data.corso?.ore_totali || 'N/A' },
    { Campo: 'Stato', Valore: data.corso?.stato || 'N/A' },
    { Campo: 'Capienza', Valore: data.corso?.capienza || 'N/A' },
    { Campo: 'Numero Partecipanti', Valore: data.partecipanti_count.toString() },
  ];

  const wsInfo = XLSX.utils.json_to_sheet(courseInfo);
  wsInfo['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Info Corso');

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Download
  saveAs(blob, `Partecipanti_Corso_${data.corso?.id || 'N_A'}.xlsx`);
}

/**
 * Generates an attendance tracking Excel file
 * Contains participants and sessions for attendance marking
 */
export function generateAttendanceExcel(data: CourseData): void {
  // Create header row with session dates
  const sessionDates = (data.sessioni_presenza || []).map((s) => s.data_completa);

  // Prepare attendance data
  const attendanceData = (data.partecipanti || []).map((p) => {
    const row: any = {
      'Numero': p.numero,
      'Nome Completo': p.nome_completo,
      'Codice Fiscale': p.codice_fiscale,
    };

    // Add columns for each session
    sessionDates.forEach((date) => {
      row[date] = ''; // Empty for manual attendance marking
    });

    row['Totale Presenze'] = '';
    row['Percentuale'] = '';

    return row;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(attendanceData);

  // Set column widths
  const colWidths = [
    { wch: 8 },  // Numero
    { wch: 25 }, // Nome Completo
    { wch: 18 }, // Codice Fiscale
    ...sessionDates.map(() => ({ wch: 12 })), // Session columns
    { wch: 15 }, // Totale Presenze
    { wch: 12 }, // Percentuale
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registro Presenze');

  // Add sessions info sheet
  const sessionsInfo = (data.sessioni_presenza || []).map((s) => ({
    'Numero': s.numero,
    'Data': s.data_completa,
    'Giorno': s.giorno_settimana,
    'Orario': `${s.ora_inizio_giornata} - ${s.ora_fine_giornata}`,
    'Sede': s.sede,
  }));

  const wsSessions = XLSX.utils.json_to_sheet(sessionsInfo);
  wsSessions['!cols'] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSessions, 'Sessioni');

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Download
  saveAs(blob, `Presenze_Corso_${data.corso?.id || 'N_A'}.xlsx`);
}

/**
 * Generates a detailed course report Excel file
 * Contains all course information including modules and sessions
 */
export function generateCourseReportExcel(data: CourseData): void {
  const wb = XLSX.utils.book_new();

  // 1. Course Summary Sheet
  const courseSummary = [
    { Campo: 'ID Corso', Valore: data.corso?.id || 'N/A' },
    { Campo: 'Titolo', Valore: data.corso?.titolo || 'N/A' },
    { Campo: 'Tipo', Valore: data.corso?.tipo || 'N/A' },
    { Campo: 'Data Inizio', Valore: data.corso?.data_inizio || 'N/A' },
    { Campo: 'Data Fine', Valore: data.corso?.data_fine || 'N/A' },
    { Campo: 'Anno', Valore: data.corso?.anno || 'N/A' },
    { Campo: 'Durata Totale', Valore: data.corso?.durata_totale || 'N/A' },
    { Campo: 'Ore Totali', Valore: data.corso?.ore_totali || 'N/A' },
    { Campo: 'Ore Rendicontabili', Valore: data.corso?.ore_rendicontabili || 'N/A' },
    { Campo: 'Stato', Valore: data.corso?.stato || 'N/A' },
    { Campo: 'Capienza', Valore: data.corso?.capienza || 'N/A' },
    { Campo: 'Iscritti/Totale', Valore: `${data.corso?.capienza_numero || 0}/${data.corso?.capienza_totale || 0}` },
    { Campo: 'Numero Partecipanti', Valore: data.partecipanti_count.toString() },
    { Campo: 'Numero Sessioni Totali', Valore: (data.sessioni || []).length.toString() },
    { Campo: 'Numero Sessioni Presenza', Valore: (data.sessioni_presenza || []).length.toString() },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(courseSummary);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Riepilogo Corso');

  // 2. Modules Sheet
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
    XLSX.utils.book_append_sheet(wb, wsModuli, 'Moduli');
  }

  // 3. All Sessions Sheet
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
    'FAD': s.is_fad ? 'Sì' : 'No',
  }));

  const wsSessions = XLSX.utils.json_to_sheet(allSessionsData);
  XLSX.utils.book_append_sheet(wb, wsSessions, 'Tutte le Sessioni');

  // 4. Participants Sheet
  const participantsData = (data.partecipanti || []).map((p) => ({
    'N.': p.numero,
    'Nome': p.nome,
    'Cognome': p.cognome,
    'CF': p.codice_fiscale,
    'Email': p.email,
    'Telefono': p.telefono,
    'CF Valido': p._validations?.cf_valid ? 'Sì' : 'No',
    'Email Valida': p._validations?.email_valid ? 'Sì' : 'No',
  }));

  const wsParticipants = XLSX.utils.json_to_sheet(participantsData);
  XLSX.utils.book_append_sheet(wb, wsParticipants, 'Partecipanti');

  // 5. Entity Information Sheet
  const entityInfo = [
    { Campo: 'Nome Ente', Valore: data.ente?.accreditato?.nome || data.ente?.nome || 'N/A' },
    { Campo: 'Via', Valore: data.ente?.accreditato?.via || '' },
    { Campo: 'Numero Civico', Valore: data.ente?.accreditato?.numero_civico || '' },
    { Campo: 'Comune', Valore: data.ente?.accreditato?.comune || '' },
    { Campo: 'CAP', Valore: data.ente?.accreditato?.cap || '' },
    { Campo: 'Provincia', Valore: data.ente?.accreditato?.provincia || '' },
    { Campo: 'Sede Corso - Tipo', Valore: data.sede?.tipo || '' },
    { Campo: 'Sede Corso - Nome', Valore: data.sede?.nome || '' },
    { Campo: 'Sede Corso - Indirizzo', Valore: data.sede?.indirizzo || '' },
    { Campo: 'Trainer', Valore: data.trainer?.nome_completo || 'N/A' },
  ];

  const wsEntity = XLSX.utils.json_to_sheet(entityInfo);
  wsEntity['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsEntity, 'Ente e Sede');

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Download
  saveAs(blob, `Report_Completo_Corso_${data.corso?.id || 'N_A'}.xlsx`);
}

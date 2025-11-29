/**
 * PDF Document Generator Service
 *
 * Purpose: Generates PDF versions of course documents
 * Uses jsPDF and jspdf-autotable for clean, professional PDF output
 *
 * These PDFs are generated from the same data structures as Word documents,
 * ensuring consistency across formats.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CourseData } from '@/types/courseData';

// ============================================================================
// CONSTANTS - PDF Configuration
// ============================================================================

const PDF_CONFIG = {
  MARGINS: {
    TOP: 20,
    LEFT: 15,
    RIGHT: 15,
    BOTTOM: 20,
  },
  FONT_SIZES: {
    TITLE: 18,
    HEADING: 14,
    SUBHEADING: 12,
    BODY: 10,
    SMALL: 8,
  },
  LINE_HEIGHT: {
    TITLE: 10,
    HEADING: 8,
    BODY: 6,
    SMALL: 5,
  },
  COLORS: {
    HEADER_BG: [41, 128, 185] as [number, number, number],
    HEADER_TEXT: [255, 255, 255] as [number, number, number],
    TEXT: [0, 0, 0] as [number, number, number],
    BORDER: [200, 200, 200] as [number, number, number],
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Adds a page header to PDF
 */
function addHeader(doc: jsPDF, title: string) {
  doc.setFontSize(PDF_CONFIG.FONT_SIZES.TITLE);
  doc.setFont('helvetica', 'bold');
  doc.text(title, PDF_CONFIG.MARGINS.LEFT, PDF_CONFIG.MARGINS.TOP);

  // Add line under header
  const pageWidth = doc.internal.pageSize.width;
  doc.setDrawColor(...PDF_CONFIG.COLORS.BORDER);
  doc.setLineWidth(0.5);
  doc.line(
    PDF_CONFIG.MARGINS.LEFT,
    PDF_CONFIG.MARGINS.TOP + 5,
    pageWidth - PDF_CONFIG.MARGINS.RIGHT,
    PDF_CONFIG.MARGINS.TOP + 5
  );
}

/**
 * Adds a section heading
 */
function addSectionHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(PDF_CONFIG.FONT_SIZES.HEADING);
  doc.setFont('helvetica', 'bold');
  doc.text(text, PDF_CONFIG.MARGINS.LEFT, y);
  return y + PDF_CONFIG.LINE_HEIGHT.HEADING;
}

/**
 * Adds a labeled field (e.g., "Nome: Mario Rossi")
 */
function addLabeledField(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFontSize(PDF_CONFIG.FONT_SIZES.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(label + ':', PDF_CONFIG.MARGINS.LEFT, y);

  doc.setFont('helvetica', 'normal');
  const labelWidth = doc.getTextWidth(label + ': ');
  doc.text(value || 'N/A', PDF_CONFIG.MARGINS.LEFT + labelWidth, y);

  return y + PDF_CONFIG.LINE_HEIGHT.BODY;
}

/**
 * Checks if we need a new page
 */
function checkPageBreak(doc: jsPDF, currentY: number, requiredSpace: number = 30): number {
  const pageHeight = doc.internal.pageSize.height;
  if (currentY + requiredSpace > pageHeight - PDF_CONFIG.MARGINS.BOTTOM) {
    doc.addPage();
    return PDF_CONFIG.MARGINS.TOP;
  }
  return currentY;
}

/**
 * Adds footer with page number
 */
function addFooter(doc: jsPDF) {
  const pageCount = doc.internal.pages.length - 1; // Subtract 1 because pages[0] is metadata
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.FONT_SIZES.SMALL);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_CONFIG.COLORS.TEXT);
    doc.text(
      `Pagina ${i} di ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

// ============================================================================
// PDF GENERATORS - Main public API
// ============================================================================

/**
 * Generates PDF version of Registro Didattico
 */
export async function generateRegistroDidatticoPDF(data: CourseData): Promise<Blob> {
  const doc = new jsPDF();

  // Header
  addHeader(doc, 'REGISTRO DIDATTICO E PRESENZE');

  let y = PDF_CONFIG.MARGINS.TOP + 15;

  // Course Information
  y = addSectionHeading(doc, 'INFORMAZIONI CORSO', y);
  y = addLabeledField(doc, 'Titolo', data.corso?.titolo, y);
  y = addLabeledField(doc, 'ID Corso', data.corso?.id, y);
  y = addLabeledField(doc, 'Date', `dal ${data.corso?.data_inizio || 'N/A'} al ${data.corso?.data_fine || 'N/A'}`, y);
  y = addLabeledField(doc, 'Ore Totali', data.corso?.ore_totali, y);
  y = addLabeledField(doc, 'Numero Pagine', data.registro?.numero_pagine, y);

  y += 10;
  y = checkPageBreak(doc, y, 60);

  // Participants Table
  y = addSectionHeading(doc, 'ELENCO PARTECIPANTI', y);

  const participantsData = (data.partecipanti || []).map(p => [
    p.numero.toString(),
    p.nome,
    p.cognome,
    p.codice_fiscale,
    p.email,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['N.', 'Nome', 'Cognome', 'Codice Fiscale', 'Email']],
    body: participantsData,
    theme: 'grid',
    headStyles: {
      fillColor: PDF_CONFIG.COLORS.HEADER_BG,
      textColor: PDF_CONFIG.COLORS.HEADER_TEXT,
      fontSize: PDF_CONFIG.FONT_SIZES.BODY,
    },
    bodyStyles: {
      fontSize: PDF_CONFIG.FONT_SIZES.SMALL,
    },
    margin: { left: PDF_CONFIG.MARGINS.LEFT },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  y = checkPageBreak(doc, y, 60);

  // Sessions Table
  y = addSectionHeading(doc, 'CALENDARIO SESSIONI', y);

  const sessionsData = (data.sessioni || []).map(s => [
    s.numero.toString(),
    s.data_completa,
    `${s.ora_inizio_giornata} - ${s.ora_fine_giornata}`,
    s.sede,
    s.is_fad ? 'FAD' : 'Presenza',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['N.', 'Data', 'Orario', 'Sede', 'Tipo']],
    body: sessionsData,
    theme: 'grid',
    headStyles: {
      fillColor: PDF_CONFIG.COLORS.HEADER_BG,
      textColor: PDF_CONFIG.COLORS.HEADER_TEXT,
      fontSize: PDF_CONFIG.FONT_SIZES.BODY,
    },
    bodyStyles: {
      fontSize: PDF_CONFIG.FONT_SIZES.SMALL,
    },
    margin: { left: PDF_CONFIG.MARGINS.LEFT },
  });

  // Footer
  addFooter(doc);

  return doc.output('blob');
}

/**
 * Generates PDF version of Verbale Partecipazione
 */
export async function generateVerbalePartecipazionePDF(data: CourseData): Promise<Blob> {
  const doc = new jsPDF();

  // Header
  addHeader(doc, 'VERBALE DI PARTECIPAZIONE');

  let y = PDF_CONFIG.MARGINS.TOP + 15;

  // Meeting metadata
  y = addSectionHeading(doc, 'DATI VERBALE', y);
  y = addLabeledField(doc, 'Data', data.verbale?.data || 'Da compilare', y);
  y = addLabeledField(doc, 'Luogo', data.verbale?.luogo || 'Da compilare', y);
  y = addLabeledField(doc, 'Ora', data.verbale?.ora || 'Da compilare', y);

  y += 10;
  y = checkPageBreak(doc, y);

  // Course details
  y = addSectionHeading(doc, 'DATI DEL CORSO', y);
  y = addLabeledField(doc, 'Titolo', data.corso?.titolo, y);
  y = addLabeledField(doc, 'ID Corso', data.corso?.id, y);
  y = addLabeledField(doc, 'Periodo', `dal ${data.corso?.data_inizio || 'N/A'} al ${data.corso?.data_fine || 'N/A'}`, y);

  y += 10;
  y = checkPageBreak(doc, y);

  // Entity information
  y = addSectionHeading(doc, 'ENTE EROGATORE', y);
  y = addLabeledField(doc, 'Nome', data.ente?.accreditato?.nome || data.ente?.nome, y);

  const via = data.ente?.accreditato?.via || '';
  const civico = data.ente?.accreditato?.numero_civico || '';
  const comune = data.ente?.accreditato?.comune || '';
  const provincia = data.ente?.accreditato?.provincia || '';
  const address = via && comune ? `${via} ${civico}, ${comune} (${provincia})` : 'N/A';
  y = addLabeledField(doc, 'Indirizzo', address, y);

  y += 10;
  y = checkPageBreak(doc, y, 60);

  // Participants
  y = addSectionHeading(doc, 'PARTECIPANTI', y);
  y = addLabeledField(doc, 'Numero totale partecipanti', data.partecipanti_count?.toString() || '0', y);

  y += 5;

  const participantsData = (data.partecipanti || []).map(p => [
    p.numero.toString(),
    p.nome_completo,
    p.codice_fiscale,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['N.', 'Nome Completo', 'Codice Fiscale']],
    body: participantsData,
    theme: 'grid',
    headStyles: {
      fillColor: PDF_CONFIG.COLORS.HEADER_BG,
      textColor: PDF_CONFIG.COLORS.HEADER_TEXT,
      fontSize: PDF_CONFIG.FONT_SIZES.BODY,
    },
    bodyStyles: {
      fontSize: PDF_CONFIG.FONT_SIZES.SMALL,
    },
    margin: { left: PDF_CONFIG.MARGINS.LEFT },
  });

  // Footer
  addFooter(doc);

  return doc.output('blob');
}

/**
 * Generates PDF version of Verbale Scrutinio
 */
export async function generateVerbaleScrutinioPDF(data: CourseData): Promise<Blob> {
  const doc = new jsPDF();

  // Header
  addHeader(doc, 'VERBALE DI SCRUTINIO');

  let y = PDF_CONFIG.MARGINS.TOP + 15;

  // Course identification
  y = addSectionHeading(doc, 'DATI CORSO', y);
  y = addLabeledField(doc, 'Corso', data.corso?.titolo, y);
  y = addLabeledField(doc, 'ID Corso', data.corso?.id, y);

  y += 10;
  y = checkPageBreak(doc, y);

  // Exam details
  y = addSectionHeading(doc, 'DETTAGLI PROVA', y);
  y = addLabeledField(doc, 'Descrizione', data.verbale?.prova?.descrizione || 'N/A', y);
  y = addLabeledField(doc, 'Tipo', data.verbale?.prova?.tipo || 'N/A', y);
  y = addLabeledField(doc, 'Durata', data.verbale?.prova?.durata || 'N/A', y);
  y = addLabeledField(doc, 'Modalità', data.verbale?.prova?.modalita || 'N/A', y);

  y += 10;
  y = checkPageBreak(doc, y);

  // Evaluation criteria
  y = addSectionHeading(doc, 'CRITERI DI VALUTAZIONE', y);
  y = addLabeledField(doc, 'Descrizione', data.verbale?.criteri?.descrizione || 'N/A', y);

  y += 10;
  y = checkPageBreak(doc, y);

  // Results
  y = addSectionHeading(doc, 'ESITI', y);

  doc.setFontSize(PDF_CONFIG.FONT_SIZES.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text('Partecipanti promossi:', PDF_CONFIG.MARGINS.LEFT, y);
  y += PDF_CONFIG.LINE_HEIGHT.BODY;

  doc.setFont('helvetica', 'normal');
  doc.text(data.verbale?.esiti?.positivi_testo || 'Da compilare', PDF_CONFIG.MARGINS.LEFT, y);
  y += PDF_CONFIG.LINE_HEIGHT.BODY * 2;

  doc.setFont('helvetica', 'bold');
  doc.text('Partecipanti non promossi:', PDF_CONFIG.MARGINS.LEFT, y);
  y += PDF_CONFIG.LINE_HEIGHT.BODY;

  doc.setFont('helvetica', 'normal');
  doc.text(data.verbale?.esiti?.negativi_testo || 'Nessuno', PDF_CONFIG.MARGINS.LEFT, y);

  y += 10;
  y = checkPageBreak(doc, y);

  // Protocol
  y = addLabeledField(doc, 'Protocollo SIUF', data.verbale?.protocollo_siuf || 'Da compilare', y);

  // Footer
  addFooter(doc);

  return doc.output('blob');
}

/**
 * Generates PDF version of Modello FAD
 */
export async function generateModelloFADPDF(data: CourseData): Promise<Blob> {
  const doc = new jsPDF();

  // Header
  addHeader(doc, 'MODELLO A - CALENDARIO FAD');

  let y = PDF_CONFIG.MARGINS.TOP + 15;

  // Course identification
  y = addSectionHeading(doc, 'DATI CORSO', y);
  y = addLabeledField(doc, 'Corso', data.corso?.titolo, y);
  y = addLabeledField(doc, 'ID Corso', data.corso?.id, y);

  y += 10;
  y = checkPageBreak(doc, y);

  // FAD methodology
  y = addSectionHeading(doc, 'DETTAGLI FORMAZIONE A DISTANZA', y);
  y = addLabeledField(doc, 'Modalità', data.calendario_fad?.modalita || 'Piattaforma e-learning', y);
  y = addLabeledField(doc, 'Strumenti', data.calendario_fad?.strumenti || 'N/A', y);
  y = addLabeledField(doc, 'Obiettivi', data.calendario_fad?.obiettivi || 'N/A', y);

  y += 10;
  y = checkPageBreak(doc, y, 60);

  // FAD sessions calendar
  y = addSectionHeading(doc, 'CALENDARIO SESSIONI FAD', y);

  const fadSessions = (data.sessioni || []).filter(s => s.is_fad);
  const fadSessionsData = fadSessions.map(s => [
    s.data_completa,
    `${s.ora_inizio_giornata} - ${s.ora_fine_giornata}`,
    'Formazione online',
    data.trainer?.nome_completo || 'N/A',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Orario', 'Argomento', 'Docente']],
    body: fadSessionsData,
    theme: 'grid',
    headStyles: {
      fillColor: PDF_CONFIG.COLORS.HEADER_BG,
      textColor: PDF_CONFIG.COLORS.HEADER_TEXT,
      fontSize: PDF_CONFIG.FONT_SIZES.BODY,
    },
    bodyStyles: {
      fontSize: PDF_CONFIG.FONT_SIZES.SMALL,
    },
    margin: { left: PDF_CONFIG.MARGINS.LEFT },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  y = checkPageBreak(doc, y);

  // Evaluation methodology
  y = addSectionHeading(doc, 'MODALITÀ DI VALUTAZIONE', y);
  doc.setFontSize(PDF_CONFIG.FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.calendario_fad?.valutazione || 'Test finale online', PDF_CONFIG.MARGINS.LEFT, y);

  // Footer
  addFooter(doc);

  return doc.output('blob');
}

/**
 * Exports all PDF generation functions
 */
export const PDFGenerators = {
  registroDidattico: generateRegistroDidatticoPDF,
  verbalePartecipazione: generateVerbalePartecipazionePDF,
  verbaleScrutinio: generateVerbaleScrutinioPDF,
  modelloFAD: generateModelloFADPDF,
};

/**
 * Word Document Generator Service
 * Generates Italian training course documents using docx library
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import type { CourseData } from '@/types/courseData';

/**
 * Generates the "Registro Didattico e Presenze" document
 * Educational register with attendance tracking
 */
export async function generateRegistroDidattico(data: CourseData): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: 'REGISTRO DIDATTICO E PRESENZE',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Course Information
          new Paragraph({
            text: `Corso: ${data.corso?.titolo || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `ID Corso: ${data.corso?.id || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Date: dal ${data.corso?.data_inizio || 'N/A'} al ${data.corso?.data_fine || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Ore Totali: ${data.corso?.ore_totali || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Numero Pagine: ${data.registro?.numero_pagine || 'N/A'}`,
            spacing: { after: 400 },
          }),

          // Participants Table
          new Paragraph({
            text: 'ELENCO PARTECIPANTI',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createParticipantsTable(data),

          // Sessions Table
          new Paragraph({
            text: 'CALENDARIO SESSIONI',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createSessionsTable(data),

          // Footer
          new Paragraph({
            text: `\nData vidimazione: ${data.registro?.data_vidimazione || '_____________'}`,
            spacing: { before: 600 },
          }),
          new Paragraph({
            text: `Luogo: ${data.registro?.luogo_vidimazione || '_____________'}`,
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates the "Verbale di Partecipazione" document
 * Participation report
 */
export async function generateVerbalePartecipazione(data: CourseData): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: 'VERBALE DI PARTECIPAZIONE',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Date and Location
          new Paragraph({
            text: `Data: ${data.verbale?.data || '_____________'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Luogo: ${data.verbale?.luogo || '_____________'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Ora: ${data.verbale?.ora || '_____________'}`,
            spacing: { after: 400 },
          }),

          // Course Details
          new Paragraph({
            text: 'DATI DEL CORSO',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Titolo: ${data.corso?.titolo || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `ID Corso: ${data.corso?.id || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Periodo: dal ${data.corso?.data_inizio || 'N/A'} al ${data.corso?.data_fine || 'N/A'}`,
            spacing: { after: 200 },
          }),

          // Entity Information
          new Paragraph({
            text: 'ENTE EROGATORE',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Nome: ${data.ente?.accreditato?.nome || data.ente?.nome || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Indirizzo: ${data.ente?.accreditato?.via || ''} ${data.ente?.accreditato?.numero_civico || ''}, ${data.ente?.accreditato?.comune || ''} (${data.ente?.accreditato?.provincia || ''})`,
            spacing: { after: 400 },
          }),

          // Participants
          new Paragraph({
            text: 'PARTECIPANTI',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Numero totale partecipanti: ${data.partecipanti_count || 0}`,
            spacing: { after: 200 },
          }),

          createParticipantsTable(data),

          // Signatures
          new Paragraph({
            text: '\n\nFirme:',
            spacing: { before: 600 },
          }),
          new Paragraph({
            text: '\n\nIl Direttore del Corso',
          }),
          new Paragraph({
            text: '_____________________________',
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Il Supervisore',
          }),
          new Paragraph({
            text: '_____________________________',
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates the "Verbale Scrutinio" document
 * Examination report
 */
export async function generateVerbaleScrutinio(data: CourseData): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: 'VERBALE DI SCRUTINIO',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: `Corso: ${data.corso?.titolo || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `ID Corso: ${data.corso?.id || 'N/A'}`,
            spacing: { after: 400 },
          }),

          // Exam Details
          new Paragraph({
            text: 'DETTAGLI PROVA',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Descrizione: ${data.verbale?.prova?.descrizione || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Tipo: ${data.verbale?.prova?.tipo || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Durata: ${data.verbale?.prova?.durata || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Modalità: ${data.verbale?.prova?.modalita || 'N/A'}`,
            spacing: { after: 400 },
          }),

          // Evaluation Criteria
          new Paragraph({
            text: 'CRITERI DI VALUTAZIONE',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Descrizione: ${data.verbale?.criteri?.descrizione || 'N/A'}`,
            spacing: { after: 200 },
          }),

          // Results
          new Paragraph({
            text: 'ESITI',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: 'Partecipanti promossi:',
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: data.verbale?.esiti?.positivi_testo || 'Da compilare',
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Partecipanti non promossi:',
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: data.verbale?.esiti?.negativi_testo || 'Nessuno',
            spacing: { after: 400 },
          }),

          // Signatures
          new Paragraph({
            text: '\n\nProtocollo SIUF: ' + (data.verbale?.protocollo_siuf || '_____________'),
            spacing: { before: 600 },
          }),
          new Paragraph({
            text: '\n\nFirme della Commissione:',
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: '\nPresidente: _____________________________',
          }),
          new Paragraph({
            text: '\nMembro 1: _____________________________',
          }),
          new Paragraph({
            text: '\nMembro 2: _____________________________',
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates the "Modello A FAD" document (for e-learning courses)
 * E-learning calendar
 */
export async function generateModelloFAD(data: CourseData): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: 'MODELLO A - CALENDARIO FAD',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: `Corso: ${data.corso?.titolo || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `ID Corso: ${data.corso?.id || 'N/A'}`,
            spacing: { after: 400 },
          }),

          // FAD Details
          new Paragraph({
            text: 'DETTAGLI FORMAZIONE A DISTANZA',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Modalità: ${data.calendario_fad?.modalita || 'Piattaforma e-learning'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Strumenti: ${data.calendario_fad?.strumenti || 'N/A'}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Obiettivi: ${data.calendario_fad?.obiettivi || 'N/A'}`,
            spacing: { after: 200 },
          }),

          // FAD Sessions
          new Paragraph({
            text: 'CALENDARIO SESSIONI FAD',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createFADSessionsTable(data),

          // Footer
          new Paragraph({
            text: '\n\nModalità di valutazione:',
            spacing: { before: 600 },
          }),
          new Paragraph({
            text: data.calendario_fad?.valutazione || 'Test finale online',
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Helper: Creates participants table
 */
function createParticipantsTable(data: CourseData): Table {
  const rows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'N.', alignment: AlignmentType.CENTER })],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Nome', alignment: AlignmentType.CENTER })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Cognome', alignment: AlignmentType.CENTER })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Codice Fiscale', alignment: AlignmentType.CENTER })],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Email', alignment: AlignmentType.CENTER })],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    // Data rows
    ...(data.partecipanti || []).map(
      (p) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(p.numero.toString())] }),
            new TableCell({ children: [new Paragraph(p.nome)] }),
            new TableCell({ children: [new Paragraph(p.cognome)] }),
            new TableCell({ children: [new Paragraph(p.codice_fiscale)] }),
            new TableCell({ children: [new Paragraph(p.email)] }),
          ],
        })
    ),
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Helper: Creates sessions table
 */
function createSessionsTable(data: CourseData): Table {
  const rows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: 'N.', alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: 'Data', alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: 'Orario', alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: 'Sede', alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: 'Tipo', alignment: AlignmentType.CENTER })] }),
      ],
    }),
    // Data rows
    ...(data.sessioni || []).map(
      (s) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(s.numero.toString())] }),
            new TableCell({ children: [new Paragraph(s.data_completa)] }),
            new TableCell({ children: [new Paragraph(`${s.ora_inizio_giornata} - ${s.ora_fine_giornata}`)] }),
            new TableCell({ children: [new Paragraph(s.sede)] }),
            new TableCell({ children: [new Paragraph(s.is_fad ? 'FAD' : 'Presenza')] }),
          ],
        })
    ),
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Helper: Creates FAD sessions table
 */
function createFADSessionsTable(data: CourseData): Table {
  const fadSessions = (data.sessioni || []).filter((s) => s.is_fad);

  const rows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: 'Data', alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: 'Orario', alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: 'Argomento', alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: 'Docente', alignment: AlignmentType.CENTER })] }),
      ],
    }),
    // Data rows
    ...fadSessions.map(
      (s) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(s.data_completa)] }),
            new TableCell({ children: [new Paragraph(`${s.ora_inizio_giornata} - ${s.ora_fine_giornata}`)] }),
            new TableCell({ children: [new Paragraph('Formazione online')] }),
            new TableCell({ children: [new Paragraph(data.trainer?.nome_completo || 'N/A')] }),
          ],
        })
    ),
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Downloads a Word document
 */
export async function downloadWordDocument(blob: Blob, filename: string): Promise<void> {
  saveAs(blob, filename);
}

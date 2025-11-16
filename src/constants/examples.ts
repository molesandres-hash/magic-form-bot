/**
 * Example data for the wizard steps
 * Used for demonstration and testing purposes
 */

export const EXAMPLE_COURSE_DATA = `ID Corso: 21342
Titolo: Corso di Formazione Professionale Avanzato
Date corso: dal 19/08/2025 al 23/08/2025
Ore totali: 40
Sede: Aula Formativa - Via Roma 123, Milano
Stato: Confermato`;

export const EXAMPLE_MODULES_DATA = `Sezione: 13993
Modulo: Modulo Base Operativo
Orari: 09:00-13:00 / 14:00-18:00
Trainer: Dott. Giovanni Verdi
Provider: Ente Formazione Professionale`;

export const EXAMPLE_PARTICIPANTS_DATA = `PARTECIPANTI:
1. Mario Rossi - CF: RSSMRA80A01H501Z - Email: mario.rossi@example.com - Tel: 3331234567
2. Laura Bianchi - CF: BNCLRA85B42H501W - Email: laura.bianchi@example.com - Tel: 3339876543`;

/**
 * All example data organized by step number
 */
export const WIZARD_EXAMPLES = {
  1: EXAMPLE_COURSE_DATA,
  2: EXAMPLE_MODULES_DATA,
  3: EXAMPLE_PARTICIPANTS_DATA,
} as const;

/**
 * Placeholder Service
 *
 * Purpose: Generates placeholder-to-value mappings automatically from CourseData
 * Follows the convention defined in config/placeholders/placeholder-convention.json
 *
 * This service makes the system scalable:
 * - Companies can add new Word templates without touching code
 * - Just use the standard placeholder convention in the .docx file
 * - This service will auto-generate all values
 *
 * Usage:
 * ```typescript
 * import { generatePlaceholderMap } from '@/services/placeholderService';
 * const placeholders = generatePlaceholderMap(courseData);
 * // Use with docxtemplater
 * ```
 */

import type { CourseData } from '@/types/courseData';

// ============================================================================
// PLACEHOLDER GENERATION
// ============================================================================

/**
 * Generates a complete placeholder map from course data
 *
 * This function creates ALL placeholders following the convention:
 * - {{CORSO_*}} - Course-level data
 * - {{MOD1_*}}, {{MOD2_*}}, ... - Module-specific data (dynamic, one per module)
 * - {{LEZ1_*}}, {{LEZ2_*}}, ... - Lesson data (dynamic, one per session)
 * - {{PART1_*}}, {{PART2_*}}, ... - Participant data (dynamic, one per participant)
 * - {{ENTE_*}} - Entity data
 * - {{SEDE_*}} - Location data
 * - {{DOCENTE_*}} - Trainer data
 * - {{FAD_*}} - Distance learning data
 *
 * @param courseData - Complete course data from extraction
 * @param options - Generation options (e.g., module index for module-specific docs)
 * @returns Object with all placeholders mapped to their values
 */
export function generatePlaceholderMap(
  courseData: CourseData,
  options?: {
    moduleIndex?: number;  // For module-specific documents (0-based)
    participantIndex?: number;  // For participant-specific documents (0-based)
  }
): Record<string, any> {
  const placeholders: Record<string, any> = {};

  // ============================================================================
  // CORSO (Course-level placeholders)
  // ============================================================================
  placeholders.CORSO_ID = courseData.corso?.id || '';
  placeholders.CORSO_TITOLO = courseData.corso?.titolo || '';
  placeholders.CORSO_TIPO = courseData.corso?.tipo || '';
  placeholders.CORSO_DATA_INIZIO = courseData.corso?.data_inizio || '';
  placeholders.CORSO_DATA_FINE = courseData.corso?.data_fine || '';
  placeholders.CORSO_ANNO = courseData.corso?.anno || '';
  placeholders.CORSO_ORE_TOTALI = courseData.corso?.ore_totali || '';
  placeholders.CORSO_DURATA_TOTALE = courseData.corso?.durata_totale || '';
  placeholders.CORSO_ORE_RENDICONTABILI = courseData.corso?.ore_rendicontabili || '';
  placeholders.CORSO_STATO = courseData.corso?.stato || '';
  placeholders.CORSO_CAPIENZA = courseData.corso?.capienza || '';
  placeholders.CORSO_CAPIENZA_NUMERO = courseData.corso?.capienza_numero || 0;
  placeholders.CORSO_CAPIENZA_TOTALE = courseData.corso?.capienza_totale || 0;
  placeholders.CORSO_PROGRAMMA = courseData.corso?.programma || '';

  // ============================================================================
  // MODULI (Module placeholders - dynamic based on number of modules)
  // ============================================================================
  const moduli = courseData.moduli || [];
  moduli.forEach((modulo, index) => {
    const n = index + 1; // 1-based for placeholders (MOD1_, MOD2_, etc.)

    placeholders[`MOD${n}_ID`] = modulo.id || '';
    placeholders[`MOD${n}_TITOLO`] = modulo.titolo || '';
    placeholders[`MOD${n}_ID_CORSO`] = modulo.id_corso || '';
    placeholders[`MOD${n}_ID_SEZIONE`] = modulo.id_sezione || '';
    placeholders[`MOD${n}_DATA_INIZIO`] = modulo.data_inizio || '';
    placeholders[`MOD${n}_DATA_FINE`] = modulo.data_fine || '';
    placeholders[`MOD${n}_ORE_TOTALI`] = modulo.ore_totali || '';
    placeholders[`MOD${n}_DURATA`] = modulo.durata || '';
    placeholders[`MOD${n}_ORE_RENDICONTABILI`] = modulo.ore_rendicontabili || '';
    placeholders[`MOD${n}_CAPIENZA`] = modulo.capienza || '';
    placeholders[`MOD${n}_STATO`] = modulo.stato || '';
    placeholders[`MOD${n}_TIPO_SEDE`] = modulo.tipo_sede || '';
    placeholders[`MOD${n}_PROVIDER`] = modulo.provider || '';
    placeholders[`MOD${n}_ARGOMENTI`] = (modulo.argomenti || []).join(', ');
    placeholders[`MOD${n}_NUM_SESSIONI`] = modulo.numero_sessioni || 0;
    placeholders[`MOD${n}_NUM_LEZIONI_ONLINE`] = (modulo.lezioni_online || []).length;
    placeholders[`MOD${n}_NUM_LEZIONI_PRESENZA`] = (modulo.sessioni_presenza || []).length;

    // Module-specific sessions (for advanced templates)
    placeholders[`MOD${n}_SESSIONI`] = modulo.sessioni || [];
    placeholders[`MOD${n}_SESSIONI_PRESENZA`] = modulo.sessioni_presenza || [];
    placeholders[`MOD${n}_LEZIONI_ONLINE`] = modulo.lezioni_online || [];
  });

  // If generating for a specific module, add MODULO_CORRENTE placeholders
  if (options?.moduleIndex !== undefined && moduli[options.moduleIndex]) {
    const currentModule = moduli[options.moduleIndex];
    placeholders.MODULO_ID = currentModule.id || '';
    placeholders.MODULO_TITOLO = currentModule.titolo || '';
    placeholders.MODULO_ID_SEZIONE = currentModule.id_sezione || '';
    placeholders.MODULO_ID_CORSO = currentModule.id_corso || '';
    placeholders.MODULO_DATA_INIZIO = currentModule.data_inizio || '';
    placeholders.MODULO_DATA_FINE = currentModule.data_fine || '';
    placeholders.MODULO_ORE_TOTALI = currentModule.ore_totali || '';
    placeholders.MODULO_NUMERO = options.moduleIndex + 1;
  }

  // ============================================================================
  // LEZIONI (Lesson placeholders - all sessions aggregated)
  // ============================================================================
  const sessioni = courseData.sessioni || [];
  sessioni.forEach((sessione, index) => {
    const n = index + 1;

    placeholders[`LEZ${n}_NUMERO`] = sessione.numero;
    placeholders[`LEZ${n}_DATA`] = sessione.data_completa || '';
    placeholders[`LEZ${n}_GIORNO`] = sessione.giorno || '';
    placeholders[`LEZ${n}_MESE`] = sessione.mese || '';
    placeholders[`LEZ${n}_MESE_NUMERO`] = sessione.mese_numero || '';
    placeholders[`LEZ${n}_ANNO`] = sessione.anno || '';
    placeholders[`LEZ${n}_GIORNO_SETTIMANA`] = sessione.giorno_settimana || '';
    placeholders[`LEZ${n}_ORA_INIZIO`] = sessione.ora_inizio_giornata || '';
    placeholders[`LEZ${n}_ORA_FINE`] = sessione.ora_fine_giornata || '';
    placeholders[`LEZ${n}_SEDE`] = sessione.sede || '';
    placeholders[`LEZ${n}_TIPO`] = sessione.tipo_sede || '';
    placeholders[`LEZ${n}_IS_FAD`] = sessione.is_fad ? 'Sì' : 'No';
    placeholders[`LEZ${n}_MODALITA`] = sessione.is_fad ? 'FAD' : 'Presenza';
  });

  // ============================================================================
  // PARTECIPANTI (Participant placeholders - dynamic)
  // ============================================================================
  const partecipanti = courseData.partecipanti || [];
  partecipanti.forEach((partecipante, index) => {
    const n = index + 1;

    placeholders[`PART${n}_NUMERO`] = partecipante.numero;
    placeholders[`PART${n}_ID`] = partecipante.id || '';
    placeholders[`PART${n}_NOME`] = partecipante.nome || '';
    placeholders[`PART${n}_COGNOME`] = partecipante.cognome || '';
    placeholders[`PART${n}_NOME_COMPLETO`] = partecipante.nome_completo || '';
    placeholders[`PART${n}_CF`] = partecipante.codice_fiscale || '';
    placeholders[`PART${n}_CODICE_FISCALE`] = partecipante.codice_fiscale || '';
    placeholders[`PART${n}_EMAIL`] = partecipante.email || '';
    placeholders[`PART${n}_TELEFONO`] = partecipante.telefono || '';
    placeholders[`PART${n}_CELLULARE`] = partecipante.cellulare || '';
    placeholders[`PART${n}_PROGRAMMA`] = partecipante.programma || '';
    placeholders[`PART${n}_UFFICIO`] = partecipante.ufficio || '';
    placeholders[`PART${n}_CASE_MANAGER`] = partecipante.case_manager || '';
    placeholders[`PART${n}_BENEFITS`] = partecipante.benefits || 'No';
    placeholders[`PART${n}_FREQUENZA`] = partecipante.frequenza || '';
  });

  // If generating for a specific participant, add PARTECIPANTE_CORRENTE placeholders
  if (options?.participantIndex !== undefined && partecipanti[options.participantIndex]) {
    const currentParticipant = partecipanti[options.participantIndex];
    placeholders.PARTECIPANTE_NOME = currentParticipant.nome || '';
    placeholders.PARTECIPANTE_COGNOME = currentParticipant.cognome || '';
    placeholders.PARTECIPANTE_NOME_COMPLETO = currentParticipant.nome_completo || '';
    placeholders.PARTECIPANTE_CF = currentParticipant.codice_fiscale || '';
    placeholders.PARTECIPANTE_EMAIL = currentParticipant.email || '';
  }

  // ============================================================================
  // ENTE (Entity placeholders)
  // ============================================================================
  placeholders.ENTE_NOME = courseData.ente?.nome || '';
  placeholders.ENTE_ID = courseData.ente?.id || '';
  placeholders.ENTE_INDIRIZZO = courseData.ente?.indirizzo || '';
  placeholders.ENTE_ACCRED_NOME = courseData.ente?.accreditato?.nome || '';
  placeholders.ENTE_ACCRED_VIA = courseData.ente?.accreditato?.via || '';
  placeholders.ENTE_ACCRED_NUMERO_CIVICO = courseData.ente?.accreditato?.numero_civico || '';
  placeholders.ENTE_ACCRED_COMUNE = courseData.ente?.accreditato?.comune || '';
  placeholders.ENTE_ACCRED_CAP = courseData.ente?.accreditato?.cap || '';
  placeholders.ENTE_ACCRED_PROVINCIA = courseData.ente?.accreditato?.provincia || '';

  // Combined address
  const via = courseData.ente?.accreditato?.via || '';
  const civico = courseData.ente?.accreditato?.numero_civico || '';
  const comune = courseData.ente?.accreditato?.comune || '';
  const provincia = courseData.ente?.accreditato?.provincia || '';
  placeholders.ENTE_ACCRED_INDIRIZZO_COMPLETO = via && comune
    ? `${via} ${civico}, ${comune} (${provincia})`
    : '';

  // ============================================================================
  // SEDE (Location placeholders)
  // ============================================================================
  placeholders.SEDE_TIPO = courseData.sede?.tipo || '';
  placeholders.SEDE_NOME = courseData.sede?.nome || '';
  placeholders.SEDE_MODALITA = courseData.sede?.modalita || '';
  placeholders.SEDE_INDIRIZZO = courseData.sede?.indirizzo || '';

  // ============================================================================
  // DOCENTE/TRAINER (Trainer placeholders)
  // ============================================================================
  placeholders.DOCENTE_NOME_COMPLETO = courseData.trainer?.nome_completo || '';
  placeholders.DOCENTE_NOME = courseData.trainer?.nome || '';
  placeholders.DOCENTE_COGNOME = courseData.trainer?.cognome || '';
  placeholders.DOCENTE_CF = courseData.trainer?.codice_fiscale || '';
  placeholders.DOCENTE_CODICE_FISCALE = courseData.trainer?.codice_fiscale || '';
  placeholders.DOCENTE_EMAIL = courseData.trainer?.email || '';
  placeholders.DOCENTE_TELEFONO = courseData.trainer?.telefono || '';

  // ============================================================================
  // FAD (Distance learning placeholders)
  // ============================================================================
  placeholders.FAD_MODALITA = courseData.calendario_fad?.modalita || '';
  placeholders.FAD_PIATTAFORMA = courseData.calendario_fad?.strumenti || courseData.calendario_fad?.piattaforma || '';
  placeholders.FAD_STRUMENTI = courseData.calendario_fad?.strumenti || '';
  placeholders.FAD_OBIETTIVI = courseData.calendario_fad?.obiettivi || '';
  placeholders.FAD_VALUTAZIONE = courseData.calendario_fad?.valutazione || '';
  placeholders.FAD_ID_RIUNIONE = courseData.calendario_fad?.id_riunione || '';
  placeholders.FAD_PASSCODE = courseData.calendario_fad?.passcode || '';

  // Calculate FAD hours
  const fadSessions = sessioni.filter(s => s.is_fad);
  const fadHours = calculateTotalHours(fadSessions);
  placeholders.FAD_ORE_TOTALI = fadHours.toFixed(1).replace('.0', '');

  // ============================================================================
  // LISTE per docxtemplater (arrays for loops)
  // ============================================================================
  placeholders.MODULI = moduli.map(m => ({
    id: m.id,
    titolo: m.titolo,
    id_corso: m.id_corso,
    id_sezione: m.id_sezione,
    data_inizio: m.data_inizio,
    data_fine: m.data_fine,
    ore_totali: m.ore_totali,
    argomenti: (m.argomenti || []).join(', '),
  }));

  placeholders.SESSIONI = sessioni.map(s => ({
    numero: s.numero,
    data: s.data_completa,
    ora_inizio: s.ora_inizio_giornata,
    ora_fine: s.ora_fine_giornata,
    sede: s.sede,
    tipo: s.tipo_sede,
    modalita: s.is_fad ? 'FAD' : 'Presenza',
  }));

  placeholders.SESSIONI_FAD = fadSessions.map(s => ({
    numero: s.numero,
    data: s.data_completa,
    giorno: s.giorno,
    mese: s.mese,
    anno: s.anno,
    ora_inizio: s.ora_inizio_giornata,
    ora_fine: s.ora_fine_giornata,
    sede: s.sede,
    durata: calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata),
  }));

  placeholders.SESSIONI_PRESENZA = (courseData.sessioni_presenza || []).map(s => ({
    numero: s.numero,
    data: s.data_completa,
    ora_inizio: s.ora_inizio_giornata,
    ora_fine: s.ora_fine_giornata,
    sede: s.sede,
  }));

  placeholders.PARTECIPANTI = partecipanti.map(p => ({
    numero: p.numero,
    nome: p.nome,
    cognome: p.cognome,
    nome_completo: p.nome_completo,
    codice_fiscale: p.codice_fiscale,
    email: p.email,
    telefono: p.telefono,
    benefits: p.benefits,
  }));

  // ============================================================================
  // METADATA & COUNTS
  // ============================================================================
  placeholders.NUM_MODULI = moduli.length;
  placeholders.NUM_SESSIONI = sessioni.length;
  placeholders.NUM_SESSIONI_FAD = fadSessions.length;
  placeholders.NUM_SESSIONI_PRESENZA = (courseData.sessioni_presenza || []).length;
  placeholders.NUM_PARTECIPANTI = partecipanti.length;

  placeholders.DATA_ESTRAZIONE = courseData.metadata?.data_estrazione || new Date().toISOString();
  placeholders.VERSIONE_SISTEMA = courseData.metadata?.versione_sistema || '2.0.0';

  return placeholders;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates duration in hours between start and end time
 */
function calculateDuration(start: string, end: string): string {
  try {
    const [h1, m1] = (start || '0:0').split(':').map(Number);
    const [h2, m2] = (end || '0:0').split(':').map(Number);
    const hours = (h2 + m2 / 60) - (h1 + m1 / 60);
    return hours.toFixed(1).replace('.0', '');
  } catch {
    return '0';
  }
}

/**
 * Calculates total hours from array of sessions
 */
function calculateTotalHours(sessions: any[]): number {
  return sessions.reduce((total, session) => {
    const duration = parseFloat(calculateDuration(
      session.ora_inizio_giornata,
      session.ora_fine_giornata
    ));
    return total + duration;
  }, 0);
}

/**
 * Generates placeholders for a specific module
 * Useful for module-specific documents (e.g., Modello A FAD per module)
 */
export function generateModulePlaceholders(
  courseData: CourseData,
  moduleIndex: number
): Record<string, any> {
  return generatePlaceholderMap(courseData, { moduleIndex });
}

/**
 * Generates placeholders for a specific participant
 * Useful for participant-specific documents (e.g., certificates)
 */
export function generateParticipantPlaceholders(
  courseData: CourseData,
  participantIndex: number
): Record<string, any> {
  return generatePlaceholderMap(courseData, { participantIndex });
}

/**
 * Gets online lessons grouped by module
 * Returns a structure easy to iterate in document generation
 */
export function getOnlineLessonsByModule(
  courseData: CourseData
): Array<{ module: any; lessons: any[] }> {
  const result: Array<{ module: any; lessons: any[] }> = [];

  (courseData.moduli || []).forEach((modulo) => {
    if (modulo.lezioni_online && modulo.lezioni_online.length > 0) {
      result.push({
        module: {
          id: modulo.id,
          titolo: modulo.titolo,
          id_sezione: modulo.id_sezione,
          id_corso: modulo.id_corso,
        },
        lessons: modulo.lezioni_online,
      });
    }
  });

  return result;
}

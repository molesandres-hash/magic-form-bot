/**
 * Google Gemini API Service
 *
 * Purpose: Handles AI-powered extraction of course data from unstructured text
 * Uses Google Gemini 2.5 Flash API for intelligent data parsing
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Each function has one clear purpose
 * - Named Constants: All magic numbers and strings extracted
 * - DRY: Common validation and processing logic extracted to helpers
 * - Error Handling: Comprehensive error handling with meaningful messages
 * - Type Safety: Full TypeScript typing throughout
 *
 * Why Gemini API: Handles messy real-world input where regex/parsers would fail
 */

import { GoogleGenAI } from '@google/genai';
import type { CourseData } from '@/types/courseData';
import { SYSTEM_INSTRUCTION, EXTRACTION_SCHEMA } from './extractionConfig';

// ============================================================================
// CONSTANTS - Configuration and thresholds
// ============================================================================

/**
 * API Configuration
 * Why: Centralized configuration makes version upgrades easier
 */
const API_CONFIG = {
  MODEL: 'gemini-2.5-flash',          // Model optimized for speed and accuracy
  RESPONSE_FORMAT: 'application/json', // Structured JSON output
  MAX_RETRIES: 3,                      // Number of retry attempts on failure
} as const;

/**
 * Double-check comparison thresholds
 * Why: These values determine when extractions are considered reliable
 * - 95%: Excellent match, very minor differences acceptable
 * - 80%: Good match, some differences but still usable
 * < 80%: Poor match, manual verification required
 */
const COMPARISON_THRESHOLDS = {
  EXCELLENT: 95,  // ≥95%: Excellent match
  RELIABLE: 80,   // ≥80%: Reliable match
  POOR: 80,       // <80%: Poor match, needs review
} as const;

/**
 * Default values for missing data
 * Why: Prevents undefined/null errors in document generation
 */
const DEFAULTS = {
  TIME_START: '09:00',       // Default session start time
  TIME_END: '18:00',         // Default session end time
  CAPACITY: '0/0',           // Default capacity when missing
  TOTAL_FIELDS: 50,          // Total fields used for completion percentage
  CRITICAL_FIELDS: 20,       // Fields compared in double-check
  PAGES_PER_SESSION: 2,      // Pages per attendance session
  BASE_PAGES: 1,             // Base pages in registro
} as const;

// Re-use the extraction types from the Edge Function
interface RawModulo {
  id: string;
  id_corso: string;
  id_sezione: string;
  titolo: string;
  data_inizio: string;
  data_fine: string;
  ore_totali: string;
  durata: string;
  ore_rendicontabili: string;
  capienza: string;
  stato: string;
  tipo_sede: string;
  provider: string;
  argomenti?: string[];
  sessioni_raw: RawSessione[];
}

interface RawSessione {
  data: string;
  ora_inizio: string;
  ora_fine: string;
  sede: string;
  tipo_sede: string;
}

interface AIExtractedData {
  corso: any;
  moduli?: RawModulo[];
  modulo?: RawModulo;
  sede: any;
  ente: any;
  trainer: any;
  partecipanti: any[];
  sessioni_raw?: RawSessione[];
  responsabili?: any;
  verbale?: any;
  fad_info?: any;
}

/**
 * Extracts course data using Google Gemini API
 *
 * @param apiKey - Google Gemini API key
 * @param courseData - Raw course data text
 * @param modulesData - Raw modules data text
 * @param participantsData - Raw participants data text
 * @returns Extracted and processed course data
 * @throws Error if extraction fails
 */
export async function extractCourseDataWithGemini(
  apiKey: string,
  courseData: string,
  modulesData: string,
  participantsData: string
): Promise<any> {
  try {
    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey });

    console.log('Starting extraction with Google Gemini API...');

    // Call Gemini API with structured output
    const response = await ai.models.generateContent({
      model: API_CONFIG.MODEL,
      contents: `Estrai i dati da questi 3 blocchi:

=== DATI CORSO PRINCIPALE ===
${courseData}

=== DATI MODULI ===
${modulesData}

=== ELENCO PARTECIPANTI ===
${participantsData}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: EXTRACTION_SCHEMA,
      },
    });

    console.log('Gemini API response received');

    // Parse JSON response
    const extractedData: AIExtractedData = JSON.parse(response.text);
    console.log('Extracted data:', extractedData);

    // Post-process the data
    const processedData = await processExtractedData(extractedData);

    return processedData;
  } catch (error: any) {
    console.error('Error extracting course data with Gemini:', error);
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Post-processes extracted data from Gemini
 * Converts raw AI output to structured CourseData format
 */
async function processExtractedData(extractedData: AIExtractedData): Promise<any> {
  // Import processing utilities dynamically to avoid issues
  const { validateCodiceFiscale, validateEmail, validatePhone } = await import('@/utils/validators');
  const { parseDate, MESI_ITALIANI, GIORNI_ITALIANI, extractYear } = await import('@/utils/dateUtils');
  const { parseCapienza, splitFullName } = await import('@/utils/stringUtils');

  // Helper functions
  const isFAD = (tipo_sede: string, sede: string): boolean => {
    const tipo = (tipo_sede || '').toLowerCase();
    const sedeLower = (sede || '').toLowerCase();
    return tipo.includes('online') || tipo.includes('fad') ||
      sedeLower.includes('online') || sedeLower.includes('fad');
  };

  /**
   * Generates processed session objects from raw session data
   */
  const generateSessioni = (sessioni_raw: RawSessione[]) => {
    return sessioni_raw.map((sess, idx) => {
      const date = parseDate(sess.data);
      return {
        numero: idx + 1,
        data_completa: sess.data,
        giorno: date.getDate().toString(),
        mese: MESI_ITALIANI[date.getMonth()],
        mese_numero: (date.getMonth() + 1).toString().padStart(2, '0'),
        anno: date.getFullYear().toString(),
        giorno_settimana: GIORNI_ITALIANI[date.getDay()],
        ora_inizio_giornata: sess.ora_inizio || DEFAULTS.TIME_START,
        ora_fine_giornata: sess.ora_fine || DEFAULTS.TIME_END,
        sede: sess.sede || '',
        tipo_sede: sess.tipo_sede || '',
        is_fad: isFAD(sess.tipo_sede || '', sess.sede || ''),
      };
    });
  };

  // Handle backward compatibility: convert single modulo to array
  let moduliRaw: RawModulo[] = extractedData.moduli || [];
  if (extractedData.modulo && !extractedData.moduli) {
    moduliRaw = [extractedData.modulo];
  }
  if (!Array.isArray(moduliRaw)) {
    moduliRaw = [moduliRaw];
  }

  // Process corso data
  const capienzaCorso = parseCapienza(extractedData.corso?.capienza || DEFAULTS.CAPACITY);
  const corso = {
    ...extractedData.corso,
    anno: extractedData.corso?.data_inizio ? extractYear(extractedData.corso.data_inizio) : '',
    capienza_numero: capienzaCorso.current,
    capienza_totale: capienzaCorso.total,
  };

  // Process trainer
  const trainerName = splitFullName(extractedData.trainer?.nome_completo || '');
  const trainer = {
    nome_completo: extractedData.trainer?.nome_completo || '',
    nome: trainerName.nome,
    cognome: trainerName.cognome,
    codice_fiscale: extractedData.trainer?.codice_fiscale || '',
  };

  // Process partecipanti
  const partecipanti = (extractedData.partecipanti || []).map((p: any, index: number) => {
    // Normalize benefits to "Sì" or "No"
    let benefits = 'No';
    if (p.benefits) {
      const b = p.benefits.toString().toLowerCase();
      if (b.includes('s') || b.includes('y') || b === 'true') {
        benefits = 'Sì';
      }
    }

    return {
      ...p,
      numero: index + 1,
      nome_completo: `${p.nome} ${p.cognome}`,
      benefits,
      _validations: {
        cf_valid: validateCodiceFiscale(p.codice_fiscale),
        email_valid: validateEmail(p.email),
        phone_valid: validatePhone(p.telefono),
      },
    };
  });

  // Process moduli
  const moduli_processati = moduliRaw.map((mod: RawModulo) => {
    const sessioni_modulo_raw = mod.sessioni_raw || [];
    const sessioni_modulo = generateSessioni(sessioni_modulo_raw);
    const sessioni_presenza_modulo_raw = sessioni_modulo_raw.filter(
      sess => !isFAD(sess.tipo_sede || '', sess.sede || '')
    );
    const sessioni_presenza_modulo = generateSessioni(sessioni_presenza_modulo_raw);
    const capienzaMod = parseCapienza(mod.capienza || '0/0');

    return {
      id: mod.id || '',
      titolo: mod.titolo || '',
      id_corso: mod.id_corso || '',
      id_sezione: mod.id_sezione || '',
      data_inizio: mod.data_inizio || '',
      data_fine: mod.data_fine || '',
      ore_totali: mod.ore_totali || '',
      durata: mod.durata || '',
      ore_rendicontabili: mod.ore_rendicontabili || '',
      capienza: mod.capienza || '0/0',
      capienza_numero: capienzaMod.current,
      capienza_totale: capienzaMod.total,
      stato: mod.stato || '',
      tipo_sede: mod.tipo_sede || '',
      provider: mod.provider || '',
      argomenti: mod.argomenti || [], // Map argomenti
      numero_sessioni: sessioni_modulo.length,
      sessioni: sessioni_modulo,
      sessioni_presenza: sessioni_presenza_modulo,
    };
  });

  // Aggregate sessions
  const sessioni_totali = moduli_processati.flatMap((m: any) => m.sessioni);
  const sessioni_presenza_totali = moduli_processati.flatMap((m: any) => m.sessioni_presenza);

  // Calculate registro pages
  const numero_pagine = (sessioni_presenza_totali.length * DEFAULTS.PAGES_PER_SESSION) + DEFAULTS.BASE_PAGES;

  // Generate metadata and validation warnings
  const campi_mancanti: string[] = [];
  const warnings: string[] = [];

  // Validate critical course fields
  if (!corso?.id) campi_mancanti.push('corso.id');
  if (!corso?.titolo) campi_mancanti.push('corso.titolo');
  if (!partecipanti || partecipanti.length === 0) campi_mancanti.push('partecipanti');

  // Validate participant data quality
  partecipanti.forEach((p: any, idx: number) => {
    if (!p._validations.cf_valid) {
      warnings.push(`Partecipante ${idx + 1}: Codice Fiscale non valido (${p.codice_fiscale})`);
    }
    if (!p._validations.email_valid) {
      warnings.push(`Partecipante ${idx + 1}: Email non valida (${p.email})`);
    }
  });

  // Calculate data completeness percentage
  const filled_fields = (corso?.id ? 1 : 0) + (corso?.titolo ? 1 : 0) +
    moduli_processati.length + partecipanti.length + sessioni_totali.length;
  const completamento_percentuale = Math.round((filled_fields / DEFAULTS.TOTAL_FIELDS) * 100);

  // Build complete response
  return {
    corso,
    moduli: moduli_processati,
    sede: extractedData.sede || { tipo: '', nome: '', modalita: '', indirizzo: '' },
    ente: extractedData.ente || { nome: '', id: '', indirizzo: '' },
    trainer,
    partecipanti,
    partecipanti_count: partecipanti.length,
    sessioni: sessioni_totali,
    sessioni_presenza: sessioni_presenza_totali,

    // New Fields Processing
    responsabili: extractedData.responsabili || {},
    verbale: extractedData.verbale || {
      data: '',
      ora: '',
      luogo: '',
      data_completa: '',
      prova: { descrizione: '', tipo: '', durata: '', modalita: '' },
      criteri: { descrizione: '', indicatori: '', peso: '' },
      esiti: { positivi: [], negativi: [], positivi_testo: '', negativi_testo: '' },
      protocollo_siuf: '',
      timbro: ''
    },
    registro: {
      numero_pagine: numero_pagine.toString(),
      data_vidimazione: corso.data_fine || '',
      luogo_vidimazione: ''
    },
    calendario_fad: {
      modalita: extractedData.fad_info?.modalita_gestione || '',
      strumenti: extractedData.fad_info?.piattaforma || '',
      obiettivi: '',
      valutazione: extractedData.fad_info?.modalita_valutazione || '',
      eventi: []
    },
    metadata: {
      data_estrazione: new Date().toISOString(),
      versione_sistema: '2.2.0', // Updated version
      utente: '',
      completamento_percentuale,
      campi_mancanti,
      warnings,
    },
  };
}

/**
 * Extracts course data with double-check verification
 * Makes two separate API calls and compares results for accuracy
 *
 * @param apiKey - Google Gemini API key
 * @param courseData - Raw course data text
 * @param modulesData - Raw modules data text
 * @param participantsData - Raw participants data text
 * @param onProgress - Optional callback for progress updates
 * @returns Extracted data with comparison metadata
 */
export async function extractCourseDataWithDoubleCheck(
  apiKey: string,
  courseData: string,
  modulesData: string,
  participantsData: string,
  onProgress?: (message: string, percent: number) => void
): Promise<any> {
  try {
    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey });

    console.log('Starting double-check extraction with Google Gemini API...');
    onProgress?.('Prima estrazione in corso...', 10);

    const userPrompt = `Estrai i dati da questi 3 blocchi:

=== DATI CORSO PRINCIPALE ===
${courseData}

=== DATI MODULI ===
${modulesData}

=== ELENCO PARTECIPANTI ===
${participantsData}`;

    // FIRST EXTRACTION
    console.log('First extraction...');
    const response1 = await ai.models.generateContent({
      model: API_CONFIG.MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: EXTRACTION_SCHEMA,
      },
    });

    const extractedData1: AIExtractedData = JSON.parse(response1.text);
    console.log('First extraction completed');
    onProgress?.('Seconda estrazione in corso...', 50);

    // SECOND EXTRACTION (independent call)
    console.log('Second extraction...');
    const response2 = await ai.models.generateContent({
      model: API_CONFIG.MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: EXTRACTION_SCHEMA,
      },
    });

    const extractedData2: AIExtractedData = JSON.parse(response2.text);
    console.log('Second extraction completed');
    onProgress?.('Confronto dei risultati...', 75);

    // COMPARE THE TWO EXTRACTIONS
    const comparison = compareExtractions(extractedData1, extractedData2);
    console.log('Comparison result:', comparison);

    // Process the data (use first extraction as base, but add comparison metadata)
    onProgress?.('Elaborazione dati...', 90);
    const processedData = await processExtractedData(extractedData1);

    // Add comparison metadata
    processedData.metadata.double_check = {
      performed: true,
      match_percentage: comparison.matchPercentage,
      differences_count: comparison.differences.length,
      differences: comparison.differences,
      is_reliable: comparison.matchPercentage >= COMPARISON_THRESHOLDS.RELIABLE,
    };

    // Add warnings based on match quality
    if (comparison.matchPercentage < COMPARISON_THRESHOLDS.POOR) {
      processedData.metadata.warnings.unshift(
        `⚠️ ATTENZIONE: Le due estrazioni differiscono significativamente (${comparison.matchPercentage}% di corrispondenza). Verifica manualmente i dati.`
      );
    } else if (comparison.matchPercentage < COMPARISON_THRESHOLDS.EXCELLENT) {
      processedData.metadata.warnings.unshift(
        `⚠️ Alcune piccole differenze rilevate tra le due estrazioni (${comparison.matchPercentage}% di corrispondenza).`
      );
    } else {
      processedData.metadata.warnings.unshift(
        `✓ Doppia verifica completata: ${comparison.matchPercentage}% di corrispondenza tra le estrazioni.`
      );
    }

    onProgress?.('Completato!', 100);
    return processedData;
  } catch (error: any) {
    console.error('Error in double-check extraction:', error);
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Compares two extraction results and returns match percentage
 */
function compareExtractions(data1: AIExtractedData, data2: AIExtractedData): {
  matchPercentage: number;
  differences: string[];
} {
  const differences: string[] = [];

  // Compare corso fields
  if (data1.corso?.id !== data2.corso?.id) {
    differences.push(`ID Corso: "${data1.corso?.id}" vs "${data2.corso?.id}"`);
  }
  if (data1.corso?.titolo !== data2.corso?.titolo) {
    differences.push(`Titolo: "${data1.corso?.titolo}" vs "${data2.corso?.titolo}"`);
  }
  if (data1.corso?.data_inizio !== data2.corso?.data_inizio) {
    differences.push(`Data Inizio: "${data1.corso?.data_inizio}" vs "${data2.corso?.data_inizio}"`);
  }
  if (data1.corso?.data_fine !== data2.corso?.data_fine) {
    differences.push(`Data Fine: "${data1.corso?.data_fine}" vs "${data2.corso?.data_fine}"`);
  }

  // Compare partecipanti count
  const count1 = data1.partecipanti?.length || 0;
  const count2 = data2.partecipanti?.length || 0;
  if (count1 !== count2) {
    differences.push(`Numero Partecipanti: ${count1} vs ${count2}`);
  }

  // Compare participant names (first 3)
  const participants1 = data1.partecipanti || [];
  const participants2 = data2.partecipanti || [];
  for (let i = 0; i < Math.min(3, count1, count2); i++) {
    const p1 = participants1[i];
    const p2 = participants2[i];
    if (p1?.nome !== p2?.nome || p1?.cognome !== p2?.cognome) {
      differences.push(`Partecipante ${i + 1}: "${p1?.nome} ${p1?.cognome}" vs "${p2?.nome} ${p2?.cognome}"`);
    }
  }

  // Compare moduli count
  const moduli1 = Array.isArray(data1.moduli) ? data1.moduli : (data1.modulo ? [data1.modulo] : []);
  const moduli2 = Array.isArray(data2.moduli) ? data2.moduli : (data2.modulo ? [data2.modulo] : []);
  if (moduli1.length !== moduli2.length) {
    differences.push(`Numero Moduli: ${moduli1.length} vs ${moduli2.length}`);
  }

  // Compare moduli IDs
  for (let i = 0; i < Math.min(moduli1.length, moduli2.length); i++) {
    if (moduli1[i]?.id !== moduli2[i]?.id) {
      differences.push(`Modulo ${i + 1} ID: "${moduli1[i]?.id}" vs "${moduli2[i]?.id}"`);
    }
  }

  // Compare ente
  if (data1.ente?.nome !== data2.ente?.nome) {
    differences.push(`Ente: "${data1.ente?.nome}" vs "${data2.ente?.nome}"`);
  }

  // Calculate match percentage
  const matchedFields = DEFAULTS.CRITICAL_FIELDS - Math.min(differences.length, DEFAULTS.CRITICAL_FIELDS);
  const matchPercentage = Math.round((matchedFields / DEFAULTS.CRITICAL_FIELDS) * 100);

  return {
    matchPercentage,
    differences,
  };
}

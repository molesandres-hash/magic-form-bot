/**
 * Three-Step Extraction Service
 *
 * Purpose: Implements 3 separate Gemini API calls for course data extraction
 * Benefits:
 * - Better focus: Each extraction targets specific data
 * - Improved accuracy: Avoids confusion between similar fields
 * - Clear separation: IDs extracted separately from calendar data
 */

import { GoogleGenAI } from '@google/genai';
import {
  STEP1_SYSTEM_INSTRUCTION,
  STEP1_EXTRACTION_SCHEMA,
  STEP2_SYSTEM_INSTRUCTION,
  STEP2_EXTRACTION_SCHEMA,
  STEP3_SYSTEM_INSTRUCTION,
  STEP3_EXTRACTION_SCHEMA,
} from './extractionStepsConfig';

// ============================================================================
// CONSTANTS
// ============================================================================

const API_CONFIG = {
  MODEL: 'gemini-2.5-flash',
  RESPONSE_FORMAT: 'application/json',
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Cleans the AI response to ensure valid JSON
 * Removes markdown code blocks and extra text
 */
const cleanJson = (text: string): string => {
  let cleaned = text.trim();
  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find the first '{' and last '}' to handle extra text
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');

  if (firstOpen !== -1 && lastClose !== -1) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }

  return cleaned;
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Step1Result {
  corso: {
    titolo: string;
    data_inizio: string;
    data_fine: string;
    ore_totali: string;
    durata_totale: string;
    tipo: string;
    programma: string;
  };
  moduli: Array<{
    titolo: string;
    data_inizio: string;
    data_fine: string;
    ore_totali: string;
    durata: string;
    tipo_sede: string;
    provider: string;
    argomenti: string[];
    sessioni: Array<{
      data: string;
      ora_inizio: string;
      ora_fine: string;
      sede: string;
      tipo_sede: string;
    }>;
  }>;
  numero_moduli: number;
  calendario: {
    prima_sessione_data: string;
    ultima_sessione_data: string;
    numero_sessioni_totali: number;
    numero_sessioni_presenza: number;
    numero_sessioni_online: number;
  };
}

interface Step2Result {
  corso: {
    id: string;
    stato: string;
    capienza: string;
    ore_rendicontabili: string;
    offerta_formativa?: {
      codice: string;
      nome: string;
    };
  };
  moduli: Array<{
    id: string;
    id_corso: string;
    id_sezione: string;
    capienza: string;
    stato: string;
    ore_rendicontabili: string;
  }>;
  sede: {
    tipo: string;
    nome: string;
    modalita: string;
    indirizzo: string;
  };
  ente: {
    nome: string;
    id: string;
    indirizzo: string;
  };
  trainer: {
    nome_completo: string;
    codice_fiscale: string;
    email?: string;
    telefono?: string;
  };
  responsabili: any;
  verbale: any;
  fad_info: any;
}

interface Step3Result {
  partecipanti: Array<{
    id: string;
    nome: string;
    cognome: string;
    codice_fiscale: string;
    email: string;
    telefono: string;
    cellulare: string;
    programma: string;
    ufficio: string;
    case_manager: string;
    benefits: string;
    frequenza: string;
  }>;
  riepilogo: {
    totale_partecipanti: number;
    partecipanti_con_benefits: number;
    programmi_presenti: string[];
  };
}

interface ProgressCallback {
  (message: string, percent: number): void;
}

// ============================================================================
// STEP 1: CALENDAR & MODULE STRUCTURE
// ============================================================================

/**
 * Step 1: Extract calendar, sessions, and module structure
 * Does NOT extract IDs - those come in Step 2
 *
 * @param apiKey - Google Gemini API key
 * @param courseData - Raw course data text from first paste
 * @param onProgress - Optional progress callback
 * @returns Calendar and module structure data
 */
export async function extractStep1_CalendarAndModules(
  apiKey: string,
  courseData: string,
  onProgress?: ProgressCallback
): Promise<Step1Result> {
  try {
    const ai = new GoogleGenAI({ apiKey });

    console.log('[STEP 1] Starting calendar & module structure extraction...');
    onProgress?.('Estrazione calendario e moduli (Step 1/3)...', 10);

    const response = await ai.models.generateContentStream({
      model: API_CONFIG.MODEL,
      config: {
        systemInstruction: [{ text: STEP1_SYSTEM_INSTRUCTION }],
        responseMimeType: API_CONFIG.RESPONSE_FORMAT,
        responseSchema: STEP1_EXTRACTION_SCHEMA,
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Estrai calendario, orari e struttura moduli da questo testo:\n\n${courseData}`,
            },
          ],
        },
      ],
    });

    // Collect streamed response
    let fullText = '';
    for await (const chunk of response) {
      fullText += chunk.text;
    }

    const result: Step1Result = JSON.parse(cleanJson(fullText));
    console.log('[STEP 1] Extraction completed:', result);
    onProgress?.('Step 1 completato', 33);

    return result;
  } catch (error: any) {
    console.error('[STEP 1] Extraction error:', error);
    throw new Error(`Step 1 extraction failed: ${error.message || 'Unknown error'}`);
  }
}

// ============================================================================
// STEP 2: IDS & ADDITIONAL INFO
// ============================================================================

/**
 * Step 2: Extract course IDs, section IDs, and additional information
 * This is the CRITICAL step for getting accurate ID Corso and ID Sezione
 *
 * @param apiKey - Google Gemini API key
 * @param modulesData - Raw modules data text from second paste (contains the IDs table)
 * @param onProgress - Optional progress callback
 * @returns IDs and additional course information
 */
export async function extractStep2_IDsAndInfo(
  apiKey: string,
  modulesData: string,
  onProgress?: ProgressCallback
): Promise<Step2Result> {
  try {
    const ai = new GoogleGenAI({ apiKey });

    console.log('[STEP 2] Starting IDs and additional info extraction...');
    onProgress?.('Estrazione ID corso e sezione (Step 2/3)...', 40);

    const response = await ai.models.generateContentStream({
      model: API_CONFIG.MODEL,
      config: {
        systemInstruction: [{ text: STEP2_SYSTEM_INSTRUCTION }],
        responseMimeType: API_CONFIG.RESPONSE_FORMAT,
        responseSchema: STEP2_EXTRACTION_SCHEMA,
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Estrai ID Corso, ID Sezione e informazioni aggiuntive da questo testo (cerca la tabella Moduli/Ricerca):\n\n${modulesData}`,
            },
          ],
        },
      ],
    });

    // Collect streamed response
    let fullText = '';
    for await (const chunk of response) {
      fullText += chunk.text;
    }

    const result: Step2Result = JSON.parse(cleanJson(fullText));
    console.log('[STEP 2] Extraction completed:', result);
    onProgress?.('Step 2 completato', 66);

    return result;
  } catch (error: any) {
    console.error('[STEP 2] Extraction error:', error);
    throw new Error(`Step 2 extraction failed: ${error.message || 'Unknown error'}`);
  }
}

// ============================================================================
// STEP 3: PARTICIPANTS
// ============================================================================

/**
 * Step 3: Extract participants information
 *
 * @param apiKey - Google Gemini API key
 * @param participantsData - Raw participants data text from third paste
 * @param onProgress - Optional progress callback
 * @returns Participants list and summary
 */
export async function extractStep3_Participants(
  apiKey: string,
  participantsData: string,
  onProgress?: ProgressCallback
): Promise<Step3Result> {
  try {
    const ai = new GoogleGenAI({ apiKey });

    console.log('[STEP 3] Starting participants extraction...');
    onProgress?.('Estrazione partecipanti (Step 3/3)...', 70);

    const response = await ai.models.generateContentStream({
      model: API_CONFIG.MODEL,
      config: {
        systemInstruction: [{ text: STEP3_SYSTEM_INSTRUCTION }],
        responseMimeType: API_CONFIG.RESPONSE_FORMAT,
        responseSchema: STEP3_EXTRACTION_SCHEMA,
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Estrai TUTTI i partecipanti da questo elenco:\n\n${participantsData}`,
            },
          ],
        },
      ],
    });

    // Collect streamed response
    let fullText = '';
    for await (const chunk of response) {
      fullText += chunk.text;
    }

    const result: Step3Result = JSON.parse(cleanJson(fullText));
    console.log('[STEP 3] Extraction completed:', result);
    onProgress?.('Step 3 completato', 90);

    return result;
  } catch (error: any) {
    console.error('[STEP 3] Extraction error:', error);
    throw new Error(`Step 3 extraction failed: ${error.message || 'Unknown error'}`);
  }
}

// ============================================================================
// COMBINED EXTRACTION WITH ALL 3 STEPS
// ============================================================================

/**
 * Executes all 3 extraction steps and merges the results
 *
 * @param apiKey - Google Gemini API key
 * @param courseData - Raw course data (Step 1)
 * @param modulesData - Raw modules data with IDs table (Step 2)
 * @param participantsData - Raw participants list (Step 3)
 * @param onProgress - Optional progress callback
 * @returns Complete merged course data
 */
export async function extractCourseDataThreeSteps(
  apiKey: string,
  courseData: string,
  modulesData: string,
  participantsData: string,
  onProgress?: ProgressCallback
): Promise<any> {
  try {
    console.log('=== Starting Three-Step Extraction ===');
    onProgress?.('Avvio estrazione in 3 fasi...', 5);

    // STEP 1: Calendar & Modules
    const step1 = await extractStep1_CalendarAndModules(apiKey, courseData, onProgress);

    // STEP 2: IDs & Additional Info
    const step2 = await extractStep2_IDsAndInfo(apiKey, modulesData, onProgress);

    // STEP 3: Participants
    const step3 = await extractStep3_Participants(apiKey, participantsData, onProgress);

    console.log('=== All 3 steps completed, merging data ===');
    onProgress?.('Combinazione dati...', 95);

    // MERGE THE 3 RESULTS
    const mergedData = mergeThreeStepResults(step1, step2, step3);

    // POST-PROCESS (same as before)
    const processedData = await processThreeStepData(mergedData);

    onProgress?.('Estrazione completata!', 100);
    console.log('=== Three-Step Extraction Complete ===');

    return processedData;
  } catch (error: any) {
    console.error('Three-step extraction error:', error);
    throw new Error(`Three-step extraction failed: ${error.message || 'Unknown error'}`);
  }
}

// ============================================================================
// MERGE HELPERS
// ============================================================================

/**
 * Merges the results from all 3 extraction steps
 */
function mergeThreeStepResults(
  step1: Step1Result,
  step2: Step2Result,
  step3: Step3Result
): any {
  // Merge corso data
  const corso = {
    ...step1.corso,
    ...step2.corso,
  };

  // Merge moduli data (match by index or title)
  const moduli = step1.moduli.map((mod1, index) => {
    const mod2 = step2.moduli[index] || {};
    return {
      ...mod1,
      ...mod2,
      // Keep sessioni from step1
      sessioni_raw: mod1.sessioni,
    };
  });

  return {
    corso,
    moduli,
    sede: step2.sede,
    ente: step2.ente,
    trainer: step2.trainer,
    partecipanti: step3.partecipanti,
    responsabili: step2.responsabili,
    verbale: step2.verbale,
    fad_info: step2.fad_info,
    // Metadata from Step 1
    numero_moduli: step1.numero_moduli,
    calendario: step1.calendario,
    // Metadata from Step 3
    riepilogo_partecipanti: step3.riepilogo,
  };
}

/**
 * Post-processes the merged data (same logic as original processExtractedData)
 */
async function processThreeStepData(mergedData: any): Promise<any> {
  // Import utilities
  const { validateCodiceFiscale, validateEmail, validatePhone } = await import('@/utils/validators');
  const { parseDate, MESI_ITALIANI, GIORNI_ITALIANI, extractYear } = await import('@/utils/dateUtils');
  const { parseCapienza, splitFullName } = await import('@/utils/stringUtils');

  const DEFAULTS = {
    TIME_START: '09:00',
    TIME_END: '18:00',
    CAPACITY: '0/0',
    PAGES_PER_SESSION: 2,
    BASE_PAGES: 1,
    TOTAL_FIELDS: 50,
  };

  // Helper functions
  const isFAD = (tipo_sede: string, sede: string): boolean => {
    const tipo = (tipo_sede || '').toLowerCase();
    const sedeLower = (sede || '').toLowerCase();
    return tipo.includes('online') || tipo.includes('fad') ||
      sedeLower.includes('online') || sedeLower.includes('fad');
  };

  const generateSessioni = (sessioni_raw: any[]) => {
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

  // Process corso
  const capienzaCorso = parseCapienza(mergedData.corso?.capienza || DEFAULTS.CAPACITY);
  const corso = {
    ...mergedData.corso,
    anno: mergedData.corso?.data_inizio ? extractYear(mergedData.corso.data_inizio) : '',
    capienza_numero: capienzaCorso.current,
    capienza_totale: capienzaCorso.total,
    offerta_formativa: mergedData.corso?.offerta_formativa,
  };

  // Process trainer
  const trainerName = splitFullName(mergedData.trainer?.nome_completo || '');
  const trainer = {
    nome_completo: mergedData.trainer?.nome_completo || '',
    nome: trainerName.nome,
    cognome: trainerName.cognome,
    codice_fiscale: mergedData.trainer?.codice_fiscale || '',
    email: mergedData.trainer?.email || '',
    telefono: mergedData.trainer?.telefono || '',
  };

  // Process partecipanti
  const partecipanti = (mergedData.partecipanti || []).map((p: any, index: number) => {
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
  const moduli_processati = (mergedData.moduli || []).map((mod: any) => {
    const sessioni_modulo_raw = mod.sessioni_raw || [];
    const sessioni_modulo = generateSessioni(sessioni_modulo_raw);
    const sessioni_presenza_modulo_raw = sessioni_modulo_raw.filter(
      (sess: any) => !isFAD(sess.tipo_sede || '', sess.sede || '')
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
      argomenti: mod.argomenti || [],
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

  // Generate metadata
  const campi_mancanti: string[] = [];
  const warnings: string[] = [];

  if (!corso?.id) campi_mancanti.push('corso.id');
  if (!corso?.titolo) campi_mancanti.push('corso.titolo');
  if (!partecipanti || partecipanti.length === 0) campi_mancanti.push('partecipanti');

  partecipanti.forEach((p: any, idx: number) => {
    if (!p._validations.cf_valid) {
      warnings.push(`Partecipante ${idx + 1}: Codice Fiscale non valido (${p.codice_fiscale})`);
    }
    if (!p._validations.email_valid) {
      warnings.push(`Partecipante ${idx + 1}: Email non valida (${p.email})`);
    }
  });

  const filled_fields = (corso?.id ? 1 : 0) + (corso?.titolo ? 1 : 0) +
    moduli_processati.length + partecipanti.length + sessioni_totali.length;
  const completamento_percentuale = Math.round((filled_fields / DEFAULTS.TOTAL_FIELDS) * 100);

  return {
    corso,
    moduli: moduli_processati,
    sede: mergedData.sede || { tipo: '', nome: '', modalita: '', indirizzo: '' },
    ente: mergedData.ente || { nome: '', id: '', indirizzo: '' },
    trainer,
    partecipanti,
    partecipanti_count: partecipanti.length,
    sessioni: sessioni_totali,
    sessioni_presenza: sessioni_presenza_totali,
    responsabili: mergedData.responsabili || {},
    verbale: mergedData.verbale || {
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
      modalita: mergedData.fad_info?.modalita_gestione || '',
      strumenti: mergedData.fad_info?.piattaforma || '',
      id_riunione: mergedData.fad_info?.id_riunione || '',
      passcode: mergedData.fad_info?.passcode || '',
      obiettivi: '',
      valutazione: mergedData.fad_info?.modalita_valutazione || '',
      eventi: []
    },
    metadata: {
      data_estrazione: new Date().toISOString(),
      versione_sistema: '2.3.0', // Updated version for three-step extraction
      extraction_method: 'three-step',
      utente: '',
      completamento_percentuale,
      campi_mancanti,
      warnings,
      step_info: {
        numero_moduli_rilevati: mergedData.numero_moduli,
        calendario_summary: mergedData.calendario,
        partecipanti_summary: mergedData.riepilogo_partecipanti,
      }
    },
  };
}

/**
 * Google Gemini API Service
 * Handles direct calls to Google Gemini API for course data extraction
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { CourseData } from '@/types/courseData';

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
}

/**
 * System prompt for AI extraction
 */
const SYSTEM_INSTRUCTION = `Sei un esperto di estrazione dati da gestionali formativi italiani.
Analizza i dati forniti e estrai tutte le informazioni relative a:
- Corso (ID, titolo, tipo, date, durata, capienza, stato, programma)
- Moduli/Sezioni (ARRAY - uno o più moduli, ciascuno con: ID, ID Corso, ID Sezione, titolo, date inizio/fine, ore totali, durata, capienza, stato, tipo sede, provider)
- Sede (tipo, nome, modalità, indirizzo)
- Ente erogatore (nome, ID, indirizzo)
- Docenti/trainer (nome completo)
- Partecipanti (array con ID, nome, cognome, CF, email, telefono, programma, ufficio, case manager, benefits)

IMPORTANTE PER MODULI:
- Se ci sono MULTIPLI MODULI (2-6), estrai TUTTI i moduli nell'array "moduli"
- Ogni modulo DEVE avere: id, id_corso, id_sezione, titolo, data_inizio, data_fine, ore_totali, provider
- Ogni modulo ha le SUE sessioni specifiche nell'array "sessioni_raw" del modulo
- I partecipanti sono CONDIVISI tra tutti i moduli (un unico array)
- Se c'è UN SOLO modulo, crea comunque un array con 1 elemento

IMPORTANTE GENERALE:
- Se un dato non è presente, usa "" (stringa vuota)
- Per le date usa formato DD/MM/YYYY
- Per gli orari usa formato HH:MM
- Estrai TUTTI i partecipanti dall'elenco
- Per tipo_sede distingui tra "Presenza", "Online", "FAD" quando applicabile`;

/**
 * Response schema for structured extraction
 */
const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    corso: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        titolo: { type: Type.STRING },
        tipo: { type: Type.STRING },
        data_inizio: { type: Type.STRING },
        data_fine: { type: Type.STRING },
        durata_totale: { type: Type.STRING },
        ore_totali: { type: Type.STRING },
        ore_rendicontabili: { type: Type.STRING },
        stato: { type: Type.STRING },
        capienza: { type: Type.STRING },
        programma: { type: Type.STRING }
      },
      required: ['id', 'titolo']
    },
    moduli: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          id_corso: { type: Type.STRING },
          id_sezione: { type: Type.STRING },
          titolo: { type: Type.STRING },
          data_inizio: { type: Type.STRING },
          data_fine: { type: Type.STRING },
          ore_totali: { type: Type.STRING },
          durata: { type: Type.STRING },
          ore_rendicontabili: { type: Type.STRING },
          capienza: { type: Type.STRING },
          stato: { type: Type.STRING },
          tipo_sede: { type: Type.STRING },
          provider: { type: Type.STRING },
          sessioni_raw: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                data: { type: Type.STRING },
                ora_inizio: { type: Type.STRING },
                ora_fine: { type: Type.STRING },
                sede: { type: Type.STRING },
                tipo_sede: { type: Type.STRING }
              }
            }
          }
        },
        required: ['id', 'id_corso', 'id_sezione', 'titolo']
      }
    },
    sede: {
      type: Type.OBJECT,
      properties: {
        tipo: { type: Type.STRING },
        nome: { type: Type.STRING },
        modalita: { type: Type.STRING },
        indirizzo: { type: Type.STRING }
      }
    },
    ente: {
      type: Type.OBJECT,
      properties: {
        nome: { type: Type.STRING },
        id: { type: Type.STRING },
        indirizzo: { type: Type.STRING }
      }
    },
    trainer: {
      type: Type.OBJECT,
      properties: {
        nome_completo: { type: Type.STRING }
      }
    },
    partecipanti: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          nome: { type: Type.STRING },
          cognome: { type: Type.STRING },
          codice_fiscale: { type: Type.STRING },
          telefono: { type: Type.STRING },
          cellulare: { type: Type.STRING },
          email: { type: Type.STRING },
          programma: { type: Type.STRING },
          ufficio: { type: Type.STRING },
          case_manager: { type: Type.STRING },
          benefits: { type: Type.STRING },
          frequenza: { type: Type.STRING }
        },
        required: ['id', 'nome', 'cognome']
      }
    },
    sessioni_raw: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          data: { type: Type.STRING },
          ora_inizio: { type: Type.STRING },
          ora_fine: { type: Type.STRING },
          sede: { type: Type.STRING },
          tipo_sede: { type: Type.STRING }
        }
      }
    }
  },
  required: ['corso', 'moduli', 'partecipanti']
};

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
      model: 'gemini-2.5-flash',
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

    // Post-process the data (same as Edge Function)
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

  // Helper functions (same as Edge Function)
  const isFAD = (tipo_sede: string, sede: string): boolean => {
    const tipo = (tipo_sede || '').toLowerCase();
    const sedeLower = (sede || '').toLowerCase();
    return tipo.includes('online') || tipo.includes('fad') ||
           sedeLower.includes('online') || sedeLower.includes('fad');
  };

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
        ora_inizio_giornata: sess.ora_inizio || '09:00',
        ora_fine_giornata: sess.ora_fine || '18:00',
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

  // Process corso
  const capienzaCorso = parseCapienza(extractedData.corso?.capienza || '0/0');
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
  };

  // Process partecipanti
  const partecipanti = (extractedData.partecipanti || []).map((p: any, index: number) => ({
    ...p,
    numero: index + 1,
    nome_completo: `${p.nome} ${p.cognome}`,
    _validations: {
      cf_valid: validateCodiceFiscale(p.codice_fiscale),
      email_valid: validateEmail(p.email),
      phone_valid: validatePhone(p.telefono),
    },
  }));

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
      numero_sessioni: sessioni_modulo.length,
      sessioni: sessioni_modulo,
      sessioni_presenza: sessioni_presenza_modulo,
    };
  });

  // Aggregate sessions
  const sessioni_totali = moduli_processati.flatMap((m: any) => m.sessioni);
  const sessioni_presenza_totali = moduli_processati.flatMap((m: any) => m.sessioni_presenza);

  // Calculate pages
  const numero_pagine = (sessioni_presenza_totali.length * 2) + 1;

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
  const completamento_percentuale = Math.round((filled_fields / 50) * 100);

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
    verbale: {
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
      modalita: '',
      strumenti: '',
      obiettivi: '',
      valutazione: '',
      eventi: []
    },
    metadata: {
      data_estrazione: new Date().toISOString(),
      versione_sistema: '2.1.0', // Updated version
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
      is_reliable: comparison.matchPercentage >= 80, // 80% or higher is considered reliable
    };

    // Add warnings if there are significant differences
    if (comparison.matchPercentage < 80) {
      processedData.metadata.warnings.unshift(
        `⚠️ ATTENZIONE: Le due estrazioni differiscono significativamente (${comparison.matchPercentage}% di corrispondenza). Verifica manualmente i dati.`
      );
    } else if (comparison.matchPercentage < 95) {
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
  // Key fields to check (total: 20)
  const totalFields = 20;
  const matchedFields = totalFields - Math.min(differences.length, totalFields);
  const matchPercentage = Math.round((matchedFields / totalFields) * 100);

  return {
    matchPercentage,
    differences,
  };
}

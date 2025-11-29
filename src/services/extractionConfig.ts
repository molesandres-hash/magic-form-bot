import { Type } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Extraction Configuration Loader
 *
 * IMPORTANTE: Il prompt di estrazione è ora configurabile esternamente.
 * Percorso: config/prompts/extraction-prompt.json
 *
 * Per modificare il prompt o lo schema di estrazione:
 * 1. Modifica il file config/prompts/extraction-prompt.json
 * 2. Riavvia l'applicazione
 *
 * Vantaggi:
 * - Prompt facilmente modificabile senza toccare il codice
 * - Versionamento del prompt separato dal codice
 * - Possibilità di testare diversi prompt senza rebuild
 */

interface ExtractionConfig {
  version: string;
  name: string;
  description: string;
  system_instruction: string;
  extraction_schema: any;
  notes?: any;
}

/**
 * Loads extraction configuration from external JSON file
 * Falls back to hardcoded config if file not found (for backwards compatibility)
 */
function loadExtractionConfig(): ExtractionConfig {
  try {
    // Try to load from config file
    const configPath = join(process.cwd(), 'config/prompts/extraction-prompt.json');
    const configData = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    console.log(`✓ Loaded extraction config v${config.version} from: ${configPath}`);
    return config;
  } catch (error) {
    console.warn('⚠️  Could not load extraction config from file, using fallback config');
    // Fallback to original hardcoded config
    return {
      version: '1.0.0',
      name: 'Legacy Extraction',
      description: 'Fallback configuration',
      system_instruction: `Sei un esperto di estrazione dati da gestionali formativi italiani.
Analizza i dati forniti e estrai tutte le informazioni relative a:
- Corso (ID, titolo, tipo, date, durata, capienza, stato, programma)
- Moduli/Sezioni (ARRAY - uno o più moduli, ciascuno con: ID, ID Corso, ID Sezione, titolo, date inizio/fine, ore totali, durata, capienza, stato, tipo sede, provider)
- Sede (tipo, nome, modalità, indirizzo)
- Ente erogatore (nome, ID, indirizzo)
- Docenti/trainer (nome completo, codice fiscale se presente)
- Partecipanti (array con ID, nome, cognome, CF, email, telefono, programma, ufficio, case manager, benefits - indicare "Sì" o "No")
- Responsabili (se presenti: responsabile certificazione, direttore, supervisore)
- Dati Verbale (se presenti: data, ora, luogo, tipo prova)
- Info FAD (se presenti: piattaforma, modalità)

IMPORTANTE PER ID CORSO E SEZIONE:
- Cerca la tabella "Moduli" o "Ricerca".
- Dai PRIORITÀ ASSOLUTA alle colonne "ID Corso" e "ID Sezione" presenti nella tabella dei moduli.
- IGNORA l'ID presente nella sezione "Dettagli di base" se differisce da quello nella tabella Moduli (spesso è solo un ID prenotazione interno).
- Esempio: Se "Dettagli di base" dice ID 20641 ma la tabella Moduli dice ID Corso 47816, USA 47816.

IMPORTANTE PER MODULI MULTIPLI:
- Se la tabella moduli contiene PIÙ RIGHE, significa che ci sono PIÙ MODULI/SEZIONI.
- Estrai OGNI riga come un oggetto modulo separato nell'array "moduli".
- Ogni modulo DEVE avere il suo "id_sezione" specifico (spesso diverso per ogni riga).
- NON confondere "Sezioni" (unità didattiche) con "Sessioni" (lezioni/date).

IMPORTANTE PER SESSIONI:
- Ogni modulo ha le SUE date/orari specifici.
- Se le date sono elencate sotto ogni modulo, associale al modulo corretto.
- Se le date sono in un blocco unico ma riferite a moduli diversi, cerca di attribuirle correttamente.

IMPORTANTE GENERALE:
- Se un dato non è presente, usa "" (stringa vuota)
- Per le date usa formato DD/MM/YYYY
- Per gli orari usa formato HH:MM
- Estrai TUTTI i partecipanti dall'elenco
- Per tipo_sede distingui tra "Presenza", "Online", "FAD" quando applicabile
- Se trovi durate in inglese (es. "20 hours"), TRADUCILE in italiano (es. "20 ore")`,
      extraction_schema: {} // Will be populated below
    };
  }
}

// Load configuration at module initialization
const EXTRACTION_CONFIG = loadExtractionConfig();

/**
 * System prompt for AI extraction
 * Loaded from external configuration file
 *
 * @deprecated Use getSystemInstruction() instead to ensure latest config is loaded
 */
export const SYSTEM_INSTRUCTION = EXTRACTION_CONFIG.system_instruction;

/**
 * Gets the current system instruction
 * @returns System instruction string
 */
export function getSystemInstruction(): string {
  return EXTRACTION_CONFIG.system_instruction;
}

/**
 * Converts JSON schema from config file to Gemini Type schema
 * This allows us to define the schema in a readable JSON format
 * and convert it to the format required by the Gemini API
 */
function convertJsonSchemaToGeminiSchema(jsonSchema: any): any {
  if (!jsonSchema || !jsonSchema.type) {
    return { type: Type.STRING };
  }

  const typeMap: Record<string, any> = {
    'string': Type.STRING,
    'number': Type.NUMBER,
    'integer': Type.INTEGER,
    'boolean': Type.BOOLEAN,
    'object': Type.OBJECT,
    'array': Type.ARRAY,
  };

  const result: any = {
    type: typeMap[jsonSchema.type] || Type.STRING,
  };

  // Handle object properties
  if (jsonSchema.type === 'object' && jsonSchema.properties) {
    result.properties = {};
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      result.properties[key] = convertJsonSchemaToGeminiSchema(value);
    }
    if (jsonSchema.required) {
      result.required = jsonSchema.required;
    }
  }

  // Handle array items
  if (jsonSchema.type === 'array' && jsonSchema.items) {
    result.items = convertJsonSchemaToGeminiSchema(jsonSchema.items);
  }

  // Copy description if present
  if (jsonSchema.description) {
    result.description = jsonSchema.description;
  }

  return result;
}

/**
 * Gets the extraction schema converted to Gemini format
 * @returns Gemini-compatible schema object
 */
export function getExtractionSchema(): any {
  return convertJsonSchemaToGeminiSchema(EXTRACTION_CONFIG.extraction_schema);
}

/**
 * Response schema for structured extraction
 * Defines the exact JSON structure expected from the API
 *
 * @deprecated Use getExtractionSchema() instead to ensure latest config is loaded
 */
export const EXTRACTION_SCHEMA = {
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
                    argomenti: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
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
                nome_completo: { type: Type.STRING },
                codice_fiscale: { type: Type.STRING }
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
        // NEW FIELDS FOR ENHANCED EXTRACTION
        responsabili: {
            type: Type.OBJECT,
            properties: {
                responsabile_certificazione: {
                    type: Type.OBJECT,
                    properties: {
                        nome: { type: Type.STRING },
                        cognome: { type: Type.STRING }
                    }
                },
                direttore: {
                    type: Type.OBJECT,
                    properties: {
                        nome: { type: Type.STRING },
                        cognome: { type: Type.STRING }
                    }
                },
                supervisore: {
                    type: Type.OBJECT,
                    properties: {
                        nome: { type: Type.STRING },
                        cognome: { type: Type.STRING }
                    }
                }
            }
        },
        verbale: {
            type: Type.OBJECT,
            properties: {
                data: { type: Type.STRING },
                ora: { type: Type.STRING },
                luogo: { type: Type.STRING },
                tipo_prova: { type: Type.STRING },
                descrizione_prova: { type: Type.STRING }
            }
        },
        fad_info: {
            type: Type.OBJECT,
            properties: {
                piattaforma: { type: Type.STRING },
                modalita_gestione: { type: Type.STRING },
                modalita_valutazione: { type: Type.STRING }
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

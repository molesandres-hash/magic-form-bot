/**
 * Edge Function: extract-course-data
 *
 * Extracts structured course data from unformatted text using AI
 * Uses Lovable AI Gateway with Google Gemini 2.5 Flash model
 *
 * @endpoint POST /extract-course-data
 * @param {ExtractionRequest} body - Course, modules, and participants data as text
 * @returns {ExtractionResponse} Structured course data with validations
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type {
  ExtractionRequest,
  ExtractionResponse,
  AIExtractedData,
  RawModulo,
} from './types.ts';
import {
  processCorso,
  processTrainer,
  processPartecipanti,
  processModulo,
  generateMetadata,
} from './utils.ts';

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// AI TOOL DEFINITION
// ============================================================================

/**
 * Tool definition for AI function calling
 * Defines the schema for extracting course data
 */
const EXTRACTION_TOOL = {
  type: "function",
  function: {
    name: "extract_course_data",
    description: "Estrae tutti i dati del corso, modulo, partecipanti e sessioni",
    parameters: {
      type: "object",
      properties: {
        corso: {
          type: "object",
          properties: {
            id: { type: "string" },
            titolo: { type: "string" },
            tipo: { type: "string" },
            data_inizio: { type: "string" },
            data_fine: { type: "string" },
            durata_totale: { type: "string" },
            ore_totali: { type: "string" },
            ore_rendicontabili: { type: "string" },
            stato: { type: "string" },
            capienza: { type: "string" },
            programma: { type: "string" }
          },
          required: ["id", "titolo"]
        },
        moduli: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              id_corso: { type: "string" },
              id_sezione: { type: "string" },
              titolo: { type: "string" },
              data_inizio: { type: "string" },
              data_fine: { type: "string" },
              ore_totali: { type: "string" },
              durata: { type: "string" },
              ore_rendicontabili: { type: "string" },
              capienza: { type: "string" },
              stato: { type: "string" },
              tipo_sede: { type: "string" },
              provider: { type: "string" },
              sessioni_raw: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    data: { type: "string" },
                    ora_inizio: { type: "string" },
                    ora_fine: { type: "string" },
                    sede: { type: "string" },
                    tipo_sede: { type: "string" }
                  }
                }
              }
            },
            required: ["id", "id_corso", "id_sezione", "titolo"]
          }
        },
        sede: {
          type: "object",
          properties: {
            tipo: { type: "string" },
            nome: { type: "string" },
            modalita: { type: "string" },
            indirizzo: { type: "string" }
          }
        },
        ente: {
          type: "object",
          properties: {
            nome: { type: "string" },
            id: { type: "string" },
            indirizzo: { type: "string" }
          }
        },
        trainer: {
          type: "object",
          properties: {
            nome_completo: { type: "string" }
          }
        },
        partecipanti: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              cognome: { type: "string" },
              codice_fiscale: { type: "string" },
              telefono: { type: "string" },
              cellulare: { type: "string" },
              email: { type: "string" },
              programma: { type: "string" },
              ufficio: { type: "string" },
              case_manager: { type: "string" },
              benefits: { type: "string" },
              frequenza: { type: "string" }
            },
            required: ["id", "nome", "cognome"]
          }
        },
        sessioni_raw: {
          type: "array",
          items: {
            type: "object",
            properties: {
              data: { type: "string" },
              ora_inizio: { type: "string" },
              ora_fine: { type: "string" },
              sede: { type: "string" },
              tipo_sede: { type: "string" }
            }
          }
        }
      },
      required: ["corso", "moduli", "partecipanti"]
    }
  }
};

/**
 * System prompt for AI extraction
 */
const SYSTEM_PROMPT = `Sei un esperto di estrazione dati da gestionali formativi italiani.
Analizza i dati forniti e estrai tutte le informazioni relative a:
- Corso (ID, titolo, tipo, date, durata, capienza, stato, programma)
- Moduli/Sezioni (ARRAY - uno o più moduli, ciascuno con: ID, ID Corso, ID Sezione, titolo, date inizio/fine, ore totali, durata, capienza, stato, tipo sede, provider)
- Sede (tipo, nome, modalità, indirizzo)
- Ente erogatore (nome, ID, indirizzo)
- Docenti/trainer (nome completo)
- Partecipanti (array con ID, nome, cognome, CF, email, telefono, programma, ufficio, case manager, benefits)

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
- Per tipo_sede distingui tra "Presenza", "Online", "FAD" quando applicabile`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { courseData, modulesData, participantsData }: ExtractionRequest = await req.json();

    console.log("Starting extraction with Lovable AI...");

    // Validate API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurata");
    }

    // Call Lovable AI Gateway with Gemini 2.5 Flash
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: `Estrai i dati da questi 3 blocchi:

=== DATI CORSO PRINCIPALE ===
${courseData}

=== DATI MODULI ===
${modulesData}

=== ELENCO PARTECIPANTI ===
${participantsData}`
          }
        ],
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: "function", function: { name: "extract_course_data" } }
      }),
    });

    // Handle API errors
    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Riprova tra qualche secondo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti Lovable AI esauriti. Contatta l'amministratore." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("Errore chiamata AI gateway");
    }

    // Parse AI response
    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));

    // Extract tool call result
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("Nessun tool call nella risposta AI");
    }

    const extractedData: AIExtractedData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted raw data:", JSON.stringify(extractedData, null, 2));

    // ========================================================================
    // POST-PROCESSING
    // ========================================================================

    // Handle backward compatibility: convert single modulo to array
    let moduliRaw: RawModulo[] = extractedData.moduli || [];
    if (extractedData.modulo && !extractedData.moduli) {
      moduliRaw = [extractedData.modulo];
    }
    if (!Array.isArray(moduliRaw)) {
      moduliRaw = [moduliRaw];
    }

    // Process all data
    const corso = processCorso(extractedData.corso || {} as any);
    const trainer = processTrainer(extractedData.trainer || { nome_completo: "" });
    const partecipanti = processPartecipanti(extractedData.partecipanti || []);

    // Process each modulo with its sessions
    const moduli_processati = moduliRaw.map(processModulo);

    // Aggregate sessions across all modules
    const sessioni_totali = moduli_processati.flatMap(m => m.sessioni);
    const sessioni_presenza_totali = moduli_processati.flatMap(m => m.sessioni_presenza);

    // Calculate number of pages: (numero_sessioni_presenza_totali * 2) + 1
    const numero_pagine = (sessioni_presenza_totali.length * 2) + 1;

    // Build complete response structure
    const completeData: ExtractionResponse = {
      corso,
      moduli: moduli_processati,
      sede: extractedData.sede || { tipo: "", nome: "", modalita: "", indirizzo: "" },
      ente: extractedData.ente || { nome: "", id: "", indirizzo: "" },
      trainer,
      partecipanti,
      partecipanti_count: partecipanti.length,
      sessioni: sessioni_totali,
      sessioni_presenza: sessioni_presenza_totali,
      verbale: {
        data: "",
        ora: "",
        luogo: "",
        data_completa: "",
        prova: {
          descrizione: "",
          tipo: "",
          durata: "",
          modalita: ""
        },
        criteri: {
          descrizione: "",
          indicatori: "",
          peso: ""
        },
        esiti: {
          positivi: [],
          negativi: [],
          positivi_testo: "",
          negativi_testo: ""
        },
        protocollo_siuf: "",
        timbro: ""
      },
      registro: {
        numero_pagine: numero_pagine.toString(),
        data_vidimazione: corso.data_fine || "",
        luogo_vidimazione: ""
      },
      calendario_fad: {
        modalita: "",
        strumenti: "",
        obiettivi: "",
        valutazione: "",
        eventi: []
      },
      metadata: generateMetadata({
        corso,
        moduli: moduli_processati,
        partecipanti,
        sessioni: sessioni_totali
      })
    };

    console.log("Complete data:", JSON.stringify(completeData, null, 2));

    return new Response(JSON.stringify(completeData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Errore interno";
    console.error("Error in extract-course-data:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

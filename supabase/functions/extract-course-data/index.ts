import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MESI_ITALIANI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const GIORNI_ITALIANI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

// ============================================
// VALIDATORS
// ============================================
function validateCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false;
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  return regex.test(cf.toUpperCase());
}

function validateEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-]/g, '');
  return /^0?\d{9,10}$/.test(cleaned);
}

// ============================================
// PROCESSORS
// ============================================
function parseCapienza(capienza: string): { current: number; total: number } {
  const match = capienza.match(/(\d+)\/(\d+)/);
  if (match) {
    return { current: parseInt(match[1]), total: parseInt(match[2]) };
  }
  return { current: 0, total: 0 };
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date();
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':');
  return parts.length > 0 ? parseInt(parts[0]) : 0;
}

function processCorso(corso: any): any {
  return {
    ...corso,
    anno: corso.data_inizio ? corso.data_inizio.split('/')[2] : "",
    capienza_numero: parseCapienza(corso.capienza || "0/0").current,
    capienza_totale: parseCapienza(corso.capienza || "0/0").total
  };
}

function processModulo(modulo: any, sessioni: any[]): any {
  return {
    ...modulo,
    numero_sessioni: sessioni.length
  };
}

function processTrainer(trainer: any): any {
  const parts = (trainer.nome_completo || "").split(' ');
  return {
    ...trainer,
    nome: parts[0] || "",
    cognome: parts.slice(1).join(' ') || ""
  };
}

function processPartecipanti(partecipanti: any[]): any[] {
  return partecipanti.map((p, index) => ({
    numero: index + 1,
    ...p,
    nome_completo: `${p.nome} ${p.cognome}`,
    _validations: {
      cf_valid: validateCodiceFiscale(p.codice_fiscale),
      email_valid: validateEmail(p.email),
      phone_valid: validatePhone(p.telefono)
    }
  }));
}

function generateLezioni(oraInizio: string, oraFine: string, docente: string): any[] {
  const start = parseTime(oraInizio);
  const end = parseTime(oraFine);
  
  const lezioni = [];
  let lezione_num = 1;
  
  for (let hour = start; hour < end; hour++) {
    // Salta pausa pranzo 13:00-14:00
    if (hour === 13) continue;
    
    const tipo = hour < 13 ? "Teoria" : "Pratica";
    
    lezioni.push({
      numero: lezione_num++,
      ora_inizio: `${hour.toString().padStart(2, '0')}:00`,
      ora_fine: `${(hour + 1).toString().padStart(2, '0')}:00`,
      tipo,
      argomento: "",
      docente,
      codocente: "",
      tutor: "",
      firma_docente: "",
      firma_codocente: "",
      firma_tutor: ""
    });
  }
  
  return lezioni;
}

function generateSessioni(sessioni_raw: any[], partecipanti: any[], trainer: any): any[] {
  return sessioni_raw.map((sess, idx) => {
    const date = parseDate(sess.data);
    
    const lezioni = generateLezioni(
      sess.ora_inizio || "09:00",
      sess.ora_fine || "18:00",
      trainer.nome_completo
    );
    
    const presenze = partecipanti.map(p => ({
      partecipante_id: p.id,
      partecipante_numero: p.numero,
      nome_completo: p.nome_completo,
      mattino: { presente: false, assente: true, firma: "" },
      pomeriggio: { presente: false, assente: true, firma: "" },
      note: "",
      giustificato: false
    }));
    
    return {
      numero: idx + 1,
      data_completa: sess.data,
      giorno: date.getDate().toString(),
      mese: MESI_ITALIANI[date.getMonth()],
      mese_numero: (date.getMonth() + 1).toString().padStart(2, '0'),
      anno: date.getFullYear().toString(),
      giorno_settimana: GIORNI_ITALIANI[date.getDay()],
      ora_inizio_giornata: sess.ora_inizio || "09:00",
      ora_fine_giornata: sess.ora_fine || "18:00",
      sede: sess.sede || "",
      tipo_sede: sess.tipo_sede || "",
      lezioni,
      presenze,
      ore_allievo_giorno: "",
      ore_allievo_progressivo: "",
      firma_direttore: ""
    };
  });
}

function countFilledFields(data: any): number {
  let count = 0;
  
  if (data.corso?.id) count++;
  if (data.corso?.titolo) count++;
  if (data.modulo?.id) count++;
  if (data.partecipanti?.length > 0) count += data.partecipanti.length;
  if (data.sessioni?.length > 0) count += data.sessioni.length;
  
  return count;
}

function generateMetadata(data: any): any {
  const campi_mancanti: string[] = [];
  const warnings: string[] = [];
  
  if (!data.corso?.id) campi_mancanti.push("corso.id");
  if (!data.corso?.titolo) campi_mancanti.push("corso.titolo");
  if (!data.partecipanti || data.partecipanti.length === 0) campi_mancanti.push("partecipanti");
  
  data.partecipanti?.forEach((p: any, idx: number) => {
    if (!p._validations.cf_valid) {
      warnings.push(`Partecipante ${idx + 1}: Codice Fiscale non valido (${p.codice_fiscale})`);
    }
    if (!p._validations.email_valid) {
      warnings.push(`Partecipante ${idx + 1}: Email non valida (${p.email})`);
    }
  });
  
  const total_fields = 50;
  const filled_fields = countFilledFields(data);
  const completamento_percentuale = Math.round((filled_fields / total_fields) * 100);
  
  return {
    data_estrazione: new Date().toISOString(),
    versione_sistema: "1.0.0",
    utente: "",
    completamento_percentuale,
    campi_mancanti,
    warnings
  };
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseData, modulesData, participantsData } = await req.json();
    
    console.log("Starting extraction with Lovable AI...");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurata");
    }

    // Call Lovable AI with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Sei un esperto di estrazione dati da gestionali formativi italiani.
Analizza i dati forniti e estrai tutte le informazioni relative a:
- Corso (ID, titolo, tipo, date, durata, capienza, stato, programma)
- Modulo/Sezione (ID, titolo)
- Sede (tipo, nome, modalità, indirizzo)
- Ente erogatore (nome, ID, indirizzo)
- Docenti/trainer (nome completo)
- Partecipanti (array con ID, nome, cognome, CF, email, telefono, programma, ufficio, case manager, benefits)
- Sessioni (date, orari giornalieri)

IMPORTANTE:
- Se un dato non è presente, usa "" (stringa vuota)
- Per le date usa formato DD/MM/YYYY
- Per gli orari usa formato HH:MM
- Estrai TUTTI i partecipanti dall'elenco
- Identifica gli slot orari dalle sessioni`
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
        tools: [
          {
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
                  modulo: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      titolo: { type: "string" }
                    },
                    required: ["id", "titolo"]
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
                required: ["corso", "modulo", "partecipanti", "sessioni_raw"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_course_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Riprova tra qualche secondo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti Lovable AI esauriti. Contatta l'amministratore." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Errore chiamata AI gateway");
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));
    
    // Extract tool call result
    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("Nessun tool call nella risposta AI");
    }
    
    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted raw data:", JSON.stringify(extractedData, null, 2));

    // Post-processing
    const corso = processCorso(extractedData.corso || {});
    const trainer = processTrainer(extractedData.trainer || { nome_completo: "" });
    const partecipanti = processPartecipanti(extractedData.partecipanti || []);
    const sessioni = generateSessioni(extractedData.sessioni_raw || [], partecipanti, trainer);
    const modulo = processModulo(extractedData.modulo || {}, sessioni);

    // Build complete data structure
    const completeData = {
      corso,
      modulo,
      sede: extractedData.sede || { tipo: "", nome: "", modalita: "", indirizzo: "" },
      ente: {
        ...(extractedData.ente || {}),
        accreditato: {
          nome: "",
          via: "",
          numero_civico: "",
          comune: "",
          cap: "",
          provincia: ""
        }
      },
      trainer,
      direttore: {
        nome_completo: "",
        nome: "",
        cognome: "",
        firma: ""
      },
      supervisore: {
        nome_completo: "",
        nome: "",
        cognome: "",
        qualifica: "Supervisore"
      },
      responsabile_cert: {
        nome: "",
        cognome: "",
        nome_completo: "",
        data_nascita: "",
        citta_nascita: "",
        provincia_nascita: "",
        citta_residenza: "",
        via_residenza: "",
        numero_civico: "",
        indirizzo_completo: "",
        documento_identita: "",
        firma: ""
      },
      partecipanti,
      partecipanti_count: partecipanti.length,
      sessioni,
      verbale: {
        data: "",
        ora: "",
        luogo: "Milano",
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
          negativi_testo: "nessuno"
        },
        protocollo_siuf: "",
        timbro: ""
      },
      registro: {
        numero_pagine: "",
        data_vidimazione: "",
        luogo_vidimazione: "Milano"
      },
      calendario_fad: {
        modalita: "",
        strumenti: "",
        obiettivi: "",
        valutazione: "",
        eventi: sessioni.map(s => ({
          data: s.data_completa,
          ora_inizio: s.ora_inizio_giornata,
          ora_fine: s.ora_fine_giornata,
          materia: "",
          docente: trainer.nome_completo,
          note: s.sede
        }))
      },
      metadata: generateMetadata({ corso, modulo, partecipanti, sessioni })
    };

    console.log("Extraction complete. Warnings:", completeData.metadata.warnings.length);

    return new Response(
      JSON.stringify(completeData),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in extract-course-data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: "Errore estrazione AI",
        details: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

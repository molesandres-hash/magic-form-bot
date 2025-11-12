import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MESI_ITALIANI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const GIORNI_ITALIANI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

// VALIDATORS
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

// PROCESSORS
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

// Helper per determinare se una sessione è FAD
function isFAD(tipo_sede: string, sede: string): boolean {
  const tipo = (tipo_sede || "").toLowerCase();
  const sedeLower = (sede || "").toLowerCase();
  return tipo.includes("online") || tipo.includes("fad") || 
         sedeLower.includes("online") || sedeLower.includes("fad");
}

// Filtra solo sessioni in presenza
function filterSessioniPresenza(sessioni_raw: any[]): any[] {
  return sessioni_raw.filter(sess => !isFAD(sess.tipo_sede || "", sess.sede || ""));
}

// Genera sessioni semplificate (no lezioni, no presenze)
function generateSessioni(sessioni_raw: any[]): any[] {
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
      ora_inizio_giornata: sess.ora_inizio || "09:00",
      ora_fine_giornata: sess.ora_fine || "18:00",
      sede: sess.sede || "",
      tipo_sede: sess.tipo_sede || "",
      is_fad: isFAD(sess.tipo_sede || "", sess.sede || "")
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
    versione_sistema: "2.0.0",
    utente: "",
    completamento_percentuale,
    campi_mancanti,
    warnings
  };
}

// MAIN HANDLER
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
- Sessioni (date, orari giornalieri, tipo sede)

IMPORTANTE:
- Se un dato non è presente, usa "" (stringa vuota)
- Per le date usa formato DD/MM/YYYY
- Per gli orari usa formato HH:MM
- Estrai TUTTI i partecipanti dall'elenco
- Per tipo_sede distingui tra "Presenza", "Online", "FAD" quando applicabile`
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

    // Post-processing dei dati estratti
    const sessioni_raw = extractedData.sessioni_raw || [];
    const sessioni_presenza = filterSessioniPresenza(sessioni_raw);
    
    const corso = processCorso(extractedData.corso || {});
    const trainer = processTrainer(extractedData.trainer || { nome_completo: "" });
    const partecipanti = processPartecipanti(extractedData.partecipanti || []);
    const sessioni = generateSessioni(sessioni_raw);
    const sessioni_presenza_processed = generateSessioni(sessioni_presenza);
    const modulo = processModulo(extractedData.modulo || {}, sessioni);
    
    // Calcola numero pagine: (numero_sessioni_presenza * 2) + 1
    const numero_pagine = (sessioni_presenza_processed.length * 2) + 1;

    // Build complete data structure
    const completeData = {
      corso,
      modulo,
      sede: extractedData.sede || { tipo: "", nome: "", modalita: "", indirizzo: "" },
      ente: extractedData.ente || { nome: "", id: "", indirizzo: "" },
      trainer,
      partecipanti,
      partecipanti_count: partecipanti.length,
      sessioni,
      sessioni_presenza: sessioni_presenza_processed,
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
      metadata: generateMetadata({ corso, modulo, partecipanti, sessioni })
    };

    console.log("Complete data:", JSON.stringify(completeData, null, 2));

    return new Response(JSON.stringify(completeData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in extract-course-data:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Errore interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
/**
 * Three-Step Extraction Configuration for Google Gemini
 *
 * Purpose: Separates data extraction into 3 distinct API calls
 * 1. Calendar & Module Structure (no IDs)
 * 2. Course & Section IDs + Additional Info
 * 3. Participants Information
 */

import { Type } from '@google/genai';

// ============================================================================
// STEP 1: CALENDAR & MODULE STRUCTURE EXTRACTION
// ============================================================================

export const STEP1_SYSTEM_INSTRUCTION = `Sei un esperto di estrazione dati da gestionali formativi italiani.

OBIETTIVO: Estrai SOLO informazioni di calendario, orari, sessioni e struttura dei moduli.

ESTRAI:
- Titolo del corso
- Date delle sessioni (tutte le date in cui si svolge il corso)
- Orari delle sessioni (ora inizio e fine per ogni sessione)
- Numero totale di ore del corso
- Numero di moduli/sezioni presenti (conta quanti moduli ci sono)
- Per ogni modulo:
  * Titolo del modulo
  * Date inizio e fine
  * Ore totali
  * Tipo sede (Presenza/Online/FAD)
  * Provider/piattaforma se presente

IMPORTANTE - NON ESTRARRE:
- ID Corso (lo estrarremo nel prossimo step)
- ID Sezione (lo estrarremo nel prossimo step)
- Partecipanti (li estrarremo in un altro step)

REGOLE:
- Per le date usa formato DD/MM/YYYY
- Per gli orari usa formato HH:MM (24 ore)
- Se un dato non è presente, usa "" (stringa vuota)
- Conta accuratamente quanti moduli/sezioni ci sono nella tabella
- IMPORTANTE: Se estrai argomenti per i moduli, genera ESATTAMENTE un numero di argomenti pari al numero di giorni di lezione del modulo. Né più, né meno.
`;

export const STEP1_EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    corso: {
      type: Type.OBJECT,
      properties: {
        titolo: { type: Type.STRING },
        data_inizio: { type: Type.STRING },
        data_fine: { type: Type.STRING },
        ore_totali: { type: Type.STRING },
        durata_totale: { type: Type.STRING },
        tipo: { type: Type.STRING },
        programma: { type: Type.STRING },
      },
      required: ['titolo']
    },
    moduli: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          titolo: { type: Type.STRING },
          data_inizio: { type: Type.STRING },
          data_fine: { type: Type.STRING },
          ore_totali: { type: Type.STRING },
          durata: { type: Type.STRING },
          tipo_sede: { type: Type.STRING },
          provider: { type: Type.STRING },
          argomenti: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          sessioni: {
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
        required: ['titolo']
      }
    },
    numero_moduli: { type: Type.NUMBER },
    calendario: {
      type: Type.OBJECT,
      properties: {
        prima_sessione_data: { type: Type.STRING },
        ultima_sessione_data: { type: Type.STRING },
        numero_sessioni_totali: { type: Type.NUMBER },
        numero_sessioni_presenza: { type: Type.NUMBER },
        numero_sessioni_online: { type: Type.NUMBER }
      }
    }
  },
  required: ['corso', 'moduli', 'numero_moduli']
};

// ============================================================================
// STEP 2: IDS & ADDITIONAL COURSE INFO EXTRACTION
// ============================================================================

export const STEP2_SYSTEM_INSTRUCTION = `Sei un esperto di estrazione dati da gestionali formativi italiani.

OBIETTIVO: Estrai SOLO gli ID univoci e le informazioni aggiuntive del corso.

IMPORTANTE PER ID CORSO E SEZIONE:
- Cerca la tabella "Moduli" o "Ricerca"
- Dai PRIORITÀ ASSOLUTA alle colonne "ID Corso" e "ID Sezione" presenti nella tabella dei moduli
- IGNORA l'ID presente nella sezione "Dettagli di base" se differisce da quello nella tabella Moduli
- Esempio: Se "Dettagli di base" dice ID 20641 ma la tabella Moduli dice ID Corso 47816, USA 47816
- Ogni riga della tabella moduli ha il suo "ID Sezione" specifico

ESTRAI:
- ID del corso (dalla tabella Moduli/Ricerca)
- Per ogni modulo nella tabella:
  * ID Modulo
  * ID Corso
  * ID Sezione (specifico per ogni modulo)
  * Capienza
  * Stato
- Sede (tipo, nome, indirizzo, modalità)
- Ente erogatore (nome, ID, indirizzo)
- Docente/Trainer (nome completo, codice fiscale)
- Responsabili (se presenti: certificazione, direttore, supervisore)
- Info FAD (piattaforma, modalità gestione, modalità valutazione, ID riunione, passcode, link)
- Dati Verbale (data, ora, luogo, tipo prova)
- Offerta Formativa (codice, nome)

NON ESTRARRE:
- Partecipanti (li estrarremo nel prossimo step)
- Calendario e orari (già estratti nello step precedente)

REGOLE:
- Se un dato non è presente, usa "" (stringa vuota)
- Per le date usa formato DD/MM/YYYY
- Per gli orari usa formato HH:MM
- Gli ID devono essere estratti ESATTAMENTE come appaiono nella tabella
`;

export const STEP2_EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    corso: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        stato: { type: Type.STRING },
        capienza: { type: Type.STRING },
        ore_rendicontabili: { type: Type.STRING }
      },
      required: ['id']
    },
    offerta_formativa: {
      type: Type.OBJECT,
      properties: {
        codice: { type: Type.STRING },
        nome: { type: Type.STRING }
      }
    },
    moduli: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          id_corso: { type: Type.STRING },
          id_sezione: { type: Type.STRING },
          capienza: { type: Type.STRING },
          stato: { type: Type.STRING },
          ore_rendicontabili: { type: Type.STRING }
        },
        required: ['id', 'id_corso', 'id_sezione']
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
        codice_fiscale: { type: Type.STRING },
        email: { type: Type.STRING },
        telefono: { type: Type.STRING }
      }
    },
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
        modalita_valutazione: { type: Type.STRING },
        id_riunione: { type: Type.STRING },
        passcode: { type: Type.STRING },
        link: { type: Type.STRING }
      }
    }
  },
  required: ['corso', 'moduli']
};

// ============================================================================
// STEP 3: PARTICIPANTS EXTRACTION
// ============================================================================

export const STEP3_SYSTEM_INSTRUCTION = `Sei un esperto di estrazione dati da gestionali formativi italiani.

OBIETTIVO: Estrai SOLO le informazioni dei partecipanti al corso.

ESTRAI TUTTI I PARTECIPANTI CON:
- ID (numero identificativo)
- Nome
- Cognome
- Codice Fiscale
- Email
- Telefono/Cellulare
- Programma (es. GOL, PNRR, ecc.)
- Ufficio/Sede di appartenenza
- Case Manager (se presente)
- Benefits (indica "Sì" o "No")
- Frequenza/Presenza (se presente)

REGOLE:
- Estrai TUTTI i partecipanti dall'elenco, uno per uno
- Se un campo non è presente per un partecipante, usa "" (stringa vuota)
- Per i Benefits, se vedi "Sì", "Yes", "Y", "S", o valori simili, usa "Sì", altrimenti "No"
- Mantieni l'ordine in cui appaiono nell'elenco
- Se il codice fiscale è parzialmente oscurato (es. "***"), riportalo comunque come appare
`;

export const STEP3_EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    partecipanti: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          nome: { type: Type.STRING },
          cognome: { type: Type.STRING },
          codice_fiscale: { type: Type.STRING },
          email: { type: Type.STRING },
          telefono: { type: Type.STRING },
          cellulare: { type: Type.STRING },
          programma: { type: Type.STRING },
          ufficio: { type: Type.STRING },
          case_manager: { type: Type.STRING },
          benefits: { type: Type.STRING },
          frequenza: { type: Type.STRING }
        },
        required: ['nome', 'cognome']
      }
    },
    riepilogo: {
      type: Type.OBJECT,
      properties: {
        totale_partecipanti: { type: Type.NUMBER },
        partecipanti_con_benefits: { type: Type.NUMBER },
        programmi_presenti: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    }
  },
  required: ['partecipanti']
};

export interface CourseData {
  corso: Corso;
  moduli: Modulo[];
  sede: Sede;
  ente: Ente;
  trainer: Trainer;
  // Riferimenti a DB per enti e responsabili
  ente_accreditato_id?: string;
  direttore_id?: string;
  supervisore_id?: string;
  responsabile_cert_id?: string;
  partecipanti: Partecipante[];
  partecipanti_count: number;

  // ============================================================================
  // SESSIONI AGGREGATE (tutte le sessioni di tutti i moduli)
  // ============================================================================
  sessioni: Sessione[];          // Tutte le sessioni (presenza + online)
  sessioni_presenza: Sessione[]; // Solo sessioni in presenza aggregate

  // ============================================================================
  // NUOVO: LEZIONI ONLINE PER DOCUMENTI
  // ============================================================================
  // Struttura per accedere facilmente alle lezioni online modulo per modulo
  // Utile per generare documenti FAD specifici per ogni modulo
  lezioni_online_per_documenti?: {
    [modulo_id: string]: {
      modulo_titolo: string;
      modulo_id_sezione: string;
      modulo_id_corso: string;
      lezioni: Sessione[];
    };
  };

  verbale?: Verbale;
  registro: Registro;
  calendario_fad?: CalendarioFAD;
  metadata: Metadata;
}

export interface Corso {
  id: string;
  titolo: string;
  tipo: string;
  data_inizio: string;
  data_fine: string;
  anno: string;
  durata_totale: string;
  ore_totali: string;
  ore_rendicontabili: string;
  stato: string;
  capienza: string;
  capienza_numero: number;
  capienza_totale: number;
  programma: string;
}

export interface Modulo {
  id: string;
  titolo: string;
  numero_sessioni: number;
  // Dati specifici per gestire multipli moduli
  id_corso: string;              // Es: "50039"
  id_sezione: string;            // Es: "144176"
  data_inizio: string;           // Es: "22/09/2025"
  data_fine: string;             // Es: "26/09/2025"
  ore_totali: string;            // Es: "20 hours"
  durata: string;                // Es: "20 hours"
  ore_rendicontabili: string;    // Es: "20 hours"
  capienza: string;              // Es: "4/5"
  capienza_numero: number;       // Es: 4
  capienza_totale: number;       // Es: 5
  stato: string;                 // Es: "Aperto"
  tipo_sede: string;             // Es: "Ufficio", "Online"
  provider: string;              // Es: "Andres Moles"

  // ============================================================================
  // SESSIONI/LEZIONI DEL MODULO
  // ============================================================================
  // Tutte le sessioni del modulo (presenza + online)
  sessioni: Sessione[];

  // Solo sessioni in presenza di QUESTO modulo
  sessioni_presenza: Sessione[];

  // Solo lezioni ONLINE di QUESTO modulo
  // Questa lista è cruciale per generare documenti FAD specifici per modulo
  lezioni_online: Sessione[];

  // Argomenti trattati nel modulo
  argomenti?: string[];
}

// ... (Sede, Ente, Trainer, EnteAccreditato, ResponsabileCorso interfaces remain unchanged)



export interface Sede {
  tipo: string;
  nome: string;
  modalita: string;
  indirizzo: string;
}

export interface Ente {
  nome: string;
  id: string;
  indirizzo: string;
  accreditato: {
    nome: string;
    via: string;
    numero_civico: string;
    comune: string;
    cap: string;
    provincia: string;
  };
}

export interface Trainer {
  nome_completo: string;
  nome: string;
  cognome: string;
  codice_fiscale?: string;
  email?: string;
  telefono?: string;
}

// Interfacce per DB
export interface EnteAccreditato {
  id: string;
  nome: string;
  via: string;
  numero_civico: string;
  comune: string;
  cap: string;
  provincia: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResponsabileCorso {
  id: string;
  tipo: 'direttore' | 'supervisore' | 'responsabile_cert';
  nome: string;
  cognome: string;
  qualifica?: string;
  data_nascita?: string;
  citta_nascita?: string;
  provincia_nascita?: string;
  citta_residenza?: string;
  via_residenza?: string;
  numero_civico_residenza?: string;
  documento_identita?: string;
  firma?: string;
}

export interface Partecipante {
  numero: number;
  id: string;
  nome: string;
  cognome: string;
  nome_completo: string;
  codice_fiscale: string;
  telefono: string;
  cellulare: string;
  email: string;
  programma: string;
  ufficio: string;
  case_manager: string;
  benefits: string;
  frequenza: string;
  _validations?: {
    cf_valid: boolean;
    email_valid: boolean;
    phone_valid: boolean;
  };
}

export interface Sessione {
  numero: number;
  data_completa: string;
  giorno: string;
  mese: string;
  mese_numero: string;
  anno: string;
  giorno_settimana: string;
  ora_inizio_giornata: string;
  ora_fine_giornata: string;
  sede: string;
  tipo_sede: string;
  is_fad: boolean;

  // ============================================================================
  // NUOVO: Flag per lezioni online registrate
  // ============================================================================
  // Indica se la lezione online è stata registrata (utile per compliance)
  registrata?: boolean;

  // ID del modulo a cui appartiene questa sessione (opzionale, per tracking)
  modulo_id?: string;
}


export interface Verbale {
  data: string;
  ora: string;
  luogo: string;
  data_completa: string;
  prova: {
    descrizione: string;
    tipo: string;
    durata: string;
    modalita: string;
  };
  criteri: {
    descrizione: string;
    indicatori: string;
    peso: string;
  };
  esiti: {
    positivi: string[];
    negativi: string[];
    positivi_testo: string;
    negativi_testo: string;
  };
  protocollo_siuf: string;
  timbro?: string;
}

export interface Registro {
  numero_pagine: string;
  data_vidimazione: string;
  luogo_vidimazione: string;
}

export interface CalendarioFAD {
  modalita: string;
  piattaforma?: string;
  strumenti: string;
  id_riunione?: string;
  passcode?: string;
  obiettivi: string;
  valutazione: string;
  eventi: EventoFAD[];
}

export interface EventoFAD {
  data: string;
  ora_inizio: string;
  ora_fine: string;
  materia: string;
  docente: string;
  note: string;
}

export interface Metadata {
  data_estrazione: string;
  versione_sistema: string;
  utente: string;
  completamento_percentuale: number;
  campi_mancanti: string[];
  warnings: string[];
  modulo_corrente?: {
    id: string;
    id_sezione: string;
    id_corso: string;
    titolo: string;
    index: number;
  };
}

/**
 * Type definitions for the extract-course-data Edge Function
 */

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface ExtractionRequest {
  courseData: string;
  modulesData: string;
  participantsData: string;
}

export interface ExtractionResponse {
  corso: ProcessedCorso;
  moduli: ProcessedModulo[];
  sede: Sede;
  ente: Ente;
  trainer: ProcessedTrainer;
  partecipanti: ProcessedPartecipante[];
  partecipanti_count: number;
  sessioni: ProcessedSessione[];
  sessioni_presenza: ProcessedSessione[];
  verbale: Verbale;
  registro: Registro;
  calendario_fad: CalendarioFAD;
  metadata: Metadata;
}

// ============================================================================
// RAW AI EXTRACTED DATA (from Gemini)
// ============================================================================

export interface RawCorso {
  id: string;
  titolo: string;
  tipo: string;
  data_inizio: string;
  data_fine: string;
  durata_totale: string;
  ore_totali: string;
  ore_rendicontabili: string;
  stato: string;
  capienza: string;
  programma: string;
}

export interface RawModulo {
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

export interface RawSessione {
  data: string;
  ora_inizio: string;
  ora_fine: string;
  sede: string;
  tipo_sede: string;
}

export interface RawPartecipante {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string;
  telefono: string;
  cellulare: string;
  email: string;
  programma: string;
  ufficio: string;
  case_manager: string;
  benefits: string;
  frequenza: string;
}

export interface RawTrainer {
  nome_completo: string;
}

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
}

export interface AIExtractedData {
  corso: RawCorso;
  moduli?: RawModulo[];
  modulo?: RawModulo; // Legacy support for single module
  sede: Sede;
  ente: Ente;
  trainer: RawTrainer;
  partecipanti: RawPartecipante[];
  sessioni_raw?: RawSessione[];
}

// ============================================================================
// PROCESSED DATA (after transformation)
// ============================================================================

export interface ProcessedCorso extends RawCorso {
  anno: string;
  capienza_numero: number;
  capienza_totale: number;
}

export interface ProcessedModulo {
  id: string;
  titolo: string;
  id_corso: string;
  id_sezione: string;
  data_inizio: string;
  data_fine: string;
  ore_totali: string;
  durata: string;
  ore_rendicontabili: string;
  capienza: string;
  capienza_numero: number;
  capienza_totale: number;
  stato: string;
  tipo_sede: string;
  provider: string;
  numero_sessioni: number;
  sessioni: ProcessedSessione[];
  sessioni_presenza: ProcessedSessione[];
}

export interface ProcessedSessione {
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
}

export interface ProcessedPartecipante extends RawPartecipante {
  numero: number;
  nome_completo: string;
  _validations: {
    cf_valid: boolean;
    email_valid: boolean;
    phone_valid: boolean;
  };
}

export interface ProcessedTrainer {
  nome_completo: string;
  nome: string;
  cognome: string;
}

// ============================================================================
// DOCUMENT DATA STRUCTURES
// ============================================================================

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
  timbro: string;
}

export interface Registro {
  numero_pagine: string;
  data_vidimazione: string;
  luogo_vidimazione: string;
}

export interface CalendarioFAD {
  modalita: string;
  strumenti: string;
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
}

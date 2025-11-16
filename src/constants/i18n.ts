/**
 * Internationalization (i18n) Constants
 *
 * Purpose: Centralizes all user-facing Italian strings for easy translation
 * Prepares the application for multi-language support
 *
 * Clean Code Principles Applied:
 * - Single Source of Truth: All UI text in one place
 * - Organized by Feature: Easy to find and update strings
 * - Future-Proof: Ready for i18n library integration
 * - Consistent Naming: Clear structure for all translations
 *
 * Why: Makes adding new languages simple - just duplicate this structure
 * Next Step: Use a library like react-i18next to load these dynamically
 *
 * Structure:
 * - COMMON: Shared strings across the app
 * - WIZARD: Input step wizard strings
 * - ERRORS: Error messages (also in errorHandling.ts)
 * - DOCUMENTS: Document generation related strings
 * - VALIDATION: Validation messages
 * - UI: General UI elements
 */

// ============================================================================
// LANGUAGE: ITALIAN (it-IT)
// ============================================================================

/**
 * Common strings used across multiple components
 */
export const COMMON_IT = {
  // Actions
  SAVE: 'Salva',
  CANCEL: 'Annulla',
  CLOSE: 'Chiudi',
  CONFIRM: 'Conferma',
  DELETE: 'Elimina',
  EDIT: 'Modifica',
  ADD: 'Aggiungi',
  REMOVE: 'Rimuovi',
  NEXT: 'Avanti',
  BACK: 'Indietro',
  CONTINUE: 'Continua',
  FINISH: 'Termina',
  RETRY: 'Riprova',
  DOWNLOAD: 'Scarica',
  UPLOAD: 'Carica',
  EXPORT: 'Esporta',
  IMPORT: 'Importa',

  // Status
  LOADING: 'Caricamento...',
  PROCESSING: 'Elaborazione...',
  SUCCESS: 'Successo',
  ERROR: 'Errore',
  WARNING: 'Attenzione',
  INFO: 'Informazione',
  COMPLETED: 'Completato',
  PENDING: 'In attesa',
  FAILED: 'Fallito',

  // Time
  TODAY: 'Oggi',
  YESTERDAY: 'Ieri',
  TOMORROW: 'Domani',
  NOW: 'Ora',

  // Placeholders
  NOT_AVAILABLE: 'N/A',
  TO_BE_FILLED: 'Da compilare',
  OPTIONAL: 'Opzionale',
  REQUIRED: 'Obbligatorio',
} as const;

/**
 * Input Step Wizard strings
 */
export const WIZARD_IT = {
  // Step Labels
  STEP_COURSE: 'Dati Corso',
  STEP_MODULES: 'Moduli',
  STEP_PARTICIPANTS: 'Partecipanti',

  // Step Titles
  STEP_1_TITLE: 'Step 1: Dati Corso Principale',
  STEP_2_TITLE: 'Step 2: Dati Moduli',
  STEP_3_TITLE: 'Step 3: Dati Partecipanti',

  // Step Descriptions
  STEP_1_DESC: 'Apri la schermata principale del corso nel gestionale e copia tutti i dati visibili',
  STEP_2_DESC: 'Clicca sulla sezione "Moduli" nel gestionale e copia tutti i dati dei moduli',
  STEP_3_DESC: 'Seleziona un modulo, poi copia l\'elenco completo dei partecipanti',

  // Actions
  LOAD_EXAMPLE: 'Carica Esempio',
  EXTRACT_AI: 'Estrai con AI',
  EXTRACT_DOUBLE_CHECK: 'Estrai con Doppia Verifica',
  EXTRACTING: 'Estrazione in corso...',

  // Double-Check Feature
  DOUBLE_CHECK_TITLE: 'Doppia Verifica (Consigliato)',
  DOUBLE_CHECK_DESC: 'Effettua 2 estrazioni indipendenti e confronta i risultati per massima accuratezza',
  DOUBLE_CHECK_ENABLED: 'Doppia verifica abilitata',
  DOUBLE_CHECK_ENABLED_DESC: 'Verranno effettuate 2 estrazioni per garantire massima accuratezza',

  // Feature Highlights
  FEATURE_GUIDED: 'Processo Guidato',
  FEATURE_GUIDED_DESC: '3 step semplici e chiari',
  FEATURE_ACCURACY: 'Doppia Verifica',
  FEATURE_ACCURACY_DESC: 'Accuratezza garantita al 99%',
  FEATURE_TIME_SAVING: 'Risparmio Tempo',
  FEATURE_TIME_SAVING_DESC: 'Da 60 min a 5 min',

  // Success Messages
  STEP_COMPLETED: (stepNumber: number) => `Step ${stepNumber} completato!`,
  EXAMPLE_LOADED: 'Esempio caricato!',
  EXTRACTION_COMPLETE: (percentage: number) => `Dati estratti! Completamento: ${percentage}%`,
  DOUBLE_CHECK_SUCCESS: (percentage: number) => `Doppia verifica completata: ${percentage}% di corrispondenza`,
  IDENTICAL_EXTRACTIONS: 'Le due estrazioni sono identiche!',
  SMALL_DIFFERENCES: (count: number) => `${count} piccole differenze rilevate`,

  // Warnings
  LOW_MATCH: (percentage: number) => `Attenzione: ${percentage}% di corrispondenza`,
  VERIFY_MANUALLY: 'Verifica manualmente i dati estratti',
  WARNINGS_DETECTED: (count: number) => `Attenzione: ${count} avvisi rilevati`,

  // Placeholders
  PLACEHOLDER_COURSE: `Incolla qui i dati del corso...

Esempio:
ID Corso: 21342
Titolo: Corso di Formazione...
Date: dal 19/08/2025 al 23/08/2025...`,
  PLACEHOLDER_MODULES: `Incolla qui i dati dei moduli...

Esempio:
Sezione: 13993
Modulo: Modulo Base
Orari: 09:00-13:00 / 14:00-18:00...`,
  PLACEHOLDER_PARTICIPANTS: `Incolla qui l'elenco partecipanti...

Esempio:
1. Mario Rossi - CF: RSSMRA80A01H501Z
   Email: mario.rossi@example.com
   Tel: 3331234567...`,
} as const;

/**
 * Validation error messages
 */
export const VALIDATION_IT = {
  // Field Validation
  REQUIRED_FIELD: 'Campo obbligatorio',
  INVALID_EMAIL: 'Email non valida',
  INVALID_PHONE: 'Numero di telefono non valido',
  INVALID_FISCAL_CODE: 'Codice fiscale non valido',
  INVALID_DATE: 'Data non valida',
  INVALID_NUMBER: 'Numero non valido',
  INVALID_FORMAT: 'Formato non valido',

  // Step Validation
  COURSE_EMPTY: 'Inserisci i dati del corso prima di procedere',
  MODULES_EMPTY: 'Inserisci i dati dei moduli prima di procedere',
  PARTICIPANTS_EMPTY: 'Inserisci i dati dei partecipanti prima di procedere',
  ALL_STEPS_REQUIRED: 'Completa tutti e 3 gli step prima di estrarre i dati',

  // Data Validation
  INVALID_COURSE_DATA: 'Dati del corso non validi o mancanti',
  NO_PARTICIPANTS: 'Nessun partecipante trovato',
  NO_SESSIONS: 'Nessuna sessione trovata',
  INCOMPLETE_DATA: 'Dati incompleti',
} as const;

/**
 * API and Error messages
 */
export const API_IT = {
  // API Key
  API_KEY_MISSING: 'Configurare prima la chiave API Google Gemini',
  API_KEY_MISSING_DESC: 'Clicca sul pulsante \'API Key\' in alto per configurarla',
  API_KEY_INVALID: 'Chiave API non valida',
  API_KEY_INVALID_DESC: 'Verifica che la chiave API sia corretta',
  API_KEY_CONFIGURE: 'Configura',

  // API Errors
  API_QUOTA_EXCEEDED: 'Quota API esaurita',
  API_QUOTA_DESC: 'Hai raggiunto il limite di richieste giornaliere',
  API_TIMEOUT: 'Timeout della richiesta API',
  API_RATE_LIMIT: 'Troppe richieste, riprova tra qualche secondo',
  API_GENERIC_ERROR: 'Errore di comunicazione con il servizio AI',

  // Network
  NETWORK_OFFLINE: 'Connessione internet non disponibile',
  NETWORK_TIMEOUT: 'Timeout di rete, verifica la connessione',
  NETWORK_ERROR: 'Errore di rete durante l\'operazione',
} as const;

/**
 * Document generation strings
 */
export const DOCUMENTS_IT = {
  // Document Types
  REGISTRO_DIDATTICO: 'Registro Didattico',
  VERBALE_PARTECIPAZIONE: 'Verbale di Partecipazione',
  VERBALE_SCRUTINIO: 'Verbale di Scrutinio',
  MODELLO_FAD: 'Modello A - FAD',
  PARTECIPANTI_EXCEL: 'Elenco Partecipanti',
  REGISTRO_PRESENZE: 'Registro Presenze',
  REPORT_COMPLETO: 'Report Completo',

  // Actions
  GENERATE: 'Genera',
  GENERATING: 'Generazione in corso...',
  GENERATED: 'Documento generato',
  DOWNLOAD_WORD: 'Scarica Word',
  DOWNLOAD_EXCEL: 'Scarica Excel',
  DOWNLOAD_ZIP: 'Scarica Pacchetto ZIP',

  // Errors
  GENERATION_ERROR: 'Errore durante la generazione del documento',
  GENERATION_WORD_ERROR: 'Errore durante la generazione del documento Word',
  GENERATION_EXCEL_ERROR: 'Errore durante la generazione del file Excel',
  GENERATION_ZIP_ERROR: 'Errore durante la creazione del pacchetto ZIP',

  // Success
  GENERATION_SUCCESS: 'Documento generato con successo',
  DOWNLOAD_STARTED: 'Download avviato',

  // Sections
  COURSE_INFO: 'Informazioni Corso',
  PARTICIPANTS_LIST: 'Elenco Partecipanti',
  SESSIONS_LIST: 'Elenco Sessioni',
  ATTENDANCE: 'Presenze',
  EVALUATION: 'Valutazione',
  SIGNATURES: 'Firme',
} as const;

/**
 * UI Component strings
 */
export const UI_IT = {
  // Headers
  APP_TITLE: 'Compilatore Documenti Corso',
  APP_SUBTITLE: 'Generazione automatica documenti formativi',

  // Navigation
  HOME: 'Home',
  SETTINGS: 'Impostazioni',
  HELP: 'Aiuto',
  ABOUT: 'Info',

  // Settings
  API_KEY_SETTINGS: 'Impostazioni API Key',
  LANGUAGE: 'Lingua',
  THEME: 'Tema',
  DARK_MODE: 'Modalità Scura',
  LIGHT_MODE: 'Modalità Chiara',

  // Confirmation
  CONFIRM_DELETE: 'Sei sicuro di voler eliminare?',
  CONFIRM_CANCEL: 'Sei sicuro di voler annullare?',
  UNSAVED_CHANGES: 'Ci sono modifiche non salvate',

  // Empty States
  NO_DATA: 'Nessun dato disponibile',
  NO_RESULTS: 'Nessun risultato trovato',
  EMPTY_LIST: 'Lista vuota',

  // Loading States
  LOADING_DATA: 'Caricamento dati...',
  PROCESSING_DATA: 'Elaborazione dati...',
  PLEASE_WAIT: 'Attendere prego...',
} as const;

/**
 * Date and Time strings
 */
export const DATETIME_IT = {
  // Date Formats
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',

  // Relative Time
  JUST_NOW: 'Adesso',
  MINUTES_AGO: (n: number) => `${n} minuti fa`,
  HOURS_AGO: (n: number) => `${n} ore fa`,
  DAYS_AGO: (n: number) => `${n} giorni fa`,

  // Days of Week
  MONDAY: 'Lunedì',
  TUESDAY: 'Martedì',
  WEDNESDAY: 'Mercoledì',
  THURSDAY: 'Giovedì',
  FRIDAY: 'Venerdì',
  SATURDAY: 'Sabato',
  SUNDAY: 'Domenica',

  // Months
  JANUARY: 'Gennaio',
  FEBRUARY: 'Febbraio',
  MARCH: 'Marzo',
  APRIL: 'Aprile',
  MAY: 'Maggio',
  JUNE: 'Giugno',
  JULY: 'Luglio',
  AUGUST: 'Agosto',
  SEPTEMBER: 'Settembre',
  OCTOBER: 'Ottobre',
  NOVEMBER: 'Novembre',
  DECEMBER: 'Dicembre',
} as const;

/**
 * Course-specific terminology
 */
export const COURSE_IT = {
  // Course Fields
  COURSE_ID: 'ID Corso',
  COURSE_TITLE: 'Titolo Corso',
  START_DATE: 'Data Inizio',
  END_DATE: 'Data Fine',
  TOTAL_HOURS: 'Ore Totali',
  BILLABLE_HOURS: 'Ore Rendicontabili',
  STATUS: 'Stato',
  CAPACITY: 'Capienza',
  PROGRAM: 'Programma',

  // Module Fields
  MODULE: 'Modulo',
  MODULE_TITLE: 'Titolo Modulo',
  SESSION: 'Sessione',
  SESSIONS: 'Sessioni',

  // Participant Fields
  PARTICIPANT: 'Partecipante',
  PARTICIPANTS: 'Partecipanti',
  FIRST_NAME: 'Nome',
  LAST_NAME: 'Cognome',
  FULL_NAME: 'Nome Completo',
  FISCAL_CODE: 'Codice Fiscale',
  EMAIL: 'Email',
  PHONE: 'Telefono',
  MOBILE: 'Cellulare',

  // Entity Fields
  ENTITY: 'Ente',
  ADDRESS: 'Indirizzo',
  CITY: 'Comune',
  PROVINCE: 'Provincia',
  ZIP_CODE: 'CAP',
  VENUE: 'Sede',

  // Status Values
  STATUS_OPEN: 'Aperto',
  STATUS_CLOSED: 'Chiuso',
  STATUS_IN_PROGRESS: 'In Corso',
  STATUS_COMPLETED: 'Completato',
  STATUS_CANCELLED: 'Annullato',

  // Session Types
  IN_PERSON: 'In Presenza',
  ONLINE: 'Online',
  HYBRID: 'Ibrido',
  FAD: 'FAD',
  FAD_FULL: 'Formazione a Distanza',
} as const;

// ============================================================================
// EXPORT ALL TRANSLATIONS
// ============================================================================

/**
 * Complete Italian translation object
 * Why: Single import for all Italian strings
 */
export const IT = {
  COMMON: COMMON_IT,
  WIZARD: WIZARD_IT,
  VALIDATION: VALIDATION_IT,
  API: API_IT,
  DOCUMENTS: DOCUMENTS_IT,
  UI: UI_IT,
  DATETIME: DATETIME_IT,
  COURSE: COURSE_IT,
} as const;

/**
 * Default export for convenience
 */
export default IT;

// ============================================================================
// FUTURE: Add more languages here
// ============================================================================

/**
 * Template for adding new languages:
 *
 * export const COMMON_EN = {
 *   SAVE: 'Save',
 *   CANCEL: 'Cancel',
 *   // ... etc
 * } as const;
 *
 * export const EN = {
 *   COMMON: COMMON_EN,
 *   WIZARD: WIZARD_EN,
 *   // ... etc
 * } as const;
 */

/**
 * Wizard Configuration and Constants
 *
 * Purpose: Centralizes all configuration, text, and validation messages for the Input Wizard
 * Clean Code Principle: Separation of concerns - keeps UI components clean of static data
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const WIZARD_CONFIG = {
    TOTAL_STEPS: 3,           // Number of wizard steps
    FIRST_STEP: 1,            // First step index
    LAST_STEP: 3,             // Last step index
    TEXTAREA_MIN_HEIGHT: 300, // Minimum textarea height in pixels
} as const;

// ============================================================================
// UI TEXT & LABELS
// ============================================================================

export const STEP_LABELS = {
    COURSE: 'Dati Corso',
    MODULES: 'Moduli',
    PARTICIPANTS: 'Partecipanti',
} as const;

export const STEP_TITLES = {
    COURSE: 'Step 1: Dati Corso Principale',
    MODULES: 'Step 2: Dati Moduli',
    PARTICIPANTS: 'Step 3: Dati Partecipanti',
} as const;

export const STEP_DESCRIPTIONS = {
    COURSE: 'Apri la schermata principale del corso nel gestionale e copia tutti i dati visibili',
    MODULES: 'Clicca sulla sezione "Moduli" nel gestionale e copia tutti i dati dei moduli',
    PARTICIPANTS: 'Seleziona un modulo, poi copia l\'elenco completo dei partecipanti',
} as const;

export const BUTTON_LABELS = {
    NEXT: 'Avanti',
    BACK: 'Indietro',
    LOAD_EXAMPLE: 'Carica Esempio',
    EXTRACT_DOUBLE_CHECK: 'Estrai con Doppia Verifica',
    EXTRACT_AI: 'Estrai con AI',
    EXTRACTING: 'Estrazione in corso...',
} as const;

export const PLACEHOLDER_TEXT = {
    COURSE: `Incolla qui i dati del corso...

Esempio:
ID Corso: 21342
Titolo: Corso di Formazione...
Date: dal 19/08/2025 al 23/08/2025...`,
    MODULES: `Incolla qui i dati dei moduli...

Esempio:
Sezione: 13993
Modulo: Modulo Base
Orari: 09:00-13:00 / 14:00-18:00...`,
    PARTICIPANTS: `Incolla qui l'elenco partecipanti...

Esempio:
1. Mario Rossi - CF: RSSMRA80A01H501Z
   Email: mario.rossi@example.com
   Tel: 3331234567...`,
} as const;

export const DOUBLE_CHECK_TEXT = {
    TITLE: 'Doppia Verifica (Consigliato)',
    DESCRIPTION: 'Effettua 2 estrazioni indipendenti e confronta i risultati per massima accuratezza',
} as const;

export const FEATURE_HIGHLIGHTS = {
    GUIDED: {
        title: 'Processo Guidato',
        description: '3 step semplici e chiari',
    },
    ACCURACY: {
        title: 'Doppia Verifica',
        description: 'Accuratezza garantita al 99%',
    },
    TIME_SAVING: {
        title: 'Risparmio Tempo',
        description: 'Da 60 min a 5 min',
    },
} as const;

// ============================================================================
// MESSAGES
// ============================================================================

export const VALIDATION_MESSAGES = {
    COURSE_EMPTY: 'Inserisci i dati del corso prima di procedere',
    MODULES_EMPTY: 'Inserisci i dati dei moduli prima di procedere',
    PARTICIPANTS_EMPTY: 'Inserisci i dati dei partecipanti prima di procedere',
    ALL_STEPS_REQUIRED: 'Completa tutti e 3 gli step prima di estrarre i dati',
} as const;

export const API_KEY_MESSAGES = {
    MISSING: 'Configurare prima la chiave API Google Gemini',
    MISSING_DESCRIPTION: 'Clicca sul pulsante \'API Key\' in alto per configurarla',
    INVALID: 'Chiave API non valida',
    INVALID_DESCRIPTION: 'Verifica che la chiave API sia corretta',
    QUOTA_EXCEEDED: 'Quota API esaurita',
    QUOTA_DESCRIPTION: 'Hai raggiunto il limite di richieste giornaliere',
    CONFIGURE_BUTTON: 'Configura',
} as const;

export const EXTRACTION_MESSAGES = {
    GENERIC_ERROR: 'Errore durante l\'estrazione dei dati',
    RETRY_DESCRIPTION: 'Riprova tra qualche secondo',
} as const;

export const SUCCESS_MESSAGES = {
    STEP_COMPLETED: (stepNumber: number) => `Step ${stepNumber} completato!`,
    EXAMPLE_LOADED: 'Esempio caricato!',
    EXTRACTION_COMPLETE: (percentage: number) => `Dati estratti! Completamento: ${percentage}%`,
    DOUBLE_CHECK_SUCCESS: (percentage: number, diffCount: number) => ({
        title: `Doppia verifica completata: ${percentage}% di corrispondenza`,
        description: diffCount === 0
            ? 'Le due estrazioni sono identiche!'
            : `${diffCount} piccole differenze rilevate`,
    }),
} as const;

export const INFO_MESSAGES = {
    DOUBLE_CHECK_ENABLED: 'Doppia verifica abilitata',
    DOUBLE_CHECK_DESCRIPTION: 'Verranno effettuate 2 estrazioni per garantire massima accuratezza',
} as const;

export const WARNING_MESSAGES = {
    LOW_MATCH: (percentage: number) => `Attenzione: ${percentage}% di corrispondenza`,
    VERIFY_MANUALLY: 'Verifica manualmente i dati estratti',
    WARNINGS_DETECTED: (count: number) => `Attenzione: ${count} avvisi rilevati`,
} as const;

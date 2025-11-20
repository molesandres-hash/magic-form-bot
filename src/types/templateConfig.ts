/**
 * Template Configuration Types
 *
 * Purpose: Defines the structure for template configurations
 * Allows templates to specify which variables should be extracted by AI
 * and how they should be used in document generation
 */

export interface TemplateVariable {
  /** Unique name of the variable (used as placeholder key) */
  name: string;

  /** Display label for UI */
  label: string;

  /** Description of what this variable represents */
  description: string;

  /** Data type of the variable */
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';

  /** Whether this variable is required */
  required: boolean;

  /** Default value if not extracted */
  defaultValue?: string;

  /** AI extraction hint (helps AI understand what to look for) */
  extractionHint?: string;

  /** Validation regex pattern (optional) */
  validationPattern?: string;

  /** For array types: structure of array items */
  arrayItemStructure?: Record<string, TemplateVariable>;
}

export interface TemplateConfig {
  /** Unique template ID */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Template type (matches document_templates.template_type) */
  templateType: 'registro_didattico' | 'modulo_a_fad' | 'modulo_b_calendario' | 'verbale_partecipazione' | 'verbale_scrutinio' | 'attestato' | 'altro';

  /** File format */
  format: 'docx' | 'xlsx';

  /** Variables to extract from AI */
  variables: TemplateVariable[];

  /** Custom AI prompt additions (optional) */
  customPromptInstructions?: string;

  /** Post-processing rules (optional) */
  postProcessing?: {
    /** For Excel: should skip lunch break (13:00-14:00) */
    skipLunchBreak?: boolean;

    /** For Excel: should split into hourly blocks */
    splitIntoHourlyBlocks?: boolean;

    /** For Excel: column definitions */
    excelColumns?: ExcelColumnDefinition[];

    /** For Word: should apply specific formatting */
    wordFormatting?: WordFormattingRules;
  };

  /** Metadata */
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExcelColumnDefinition {
  /** Column header name */
  header: string;

  /** Variable name to use for this column */
  variableName: string;

  /** Column width in characters */
  width: number;

  /** Column format ('text' | 'number' | 'date') */
  format: 'text' | 'number' | 'date';

  /** Formula to calculate value (optional) */
  formula?: string;
}

export interface WordFormattingRules {
  /** Font name */
  fontName?: string;

  /** Font size */
  fontSize?: number;

  /** Line spacing */
  lineSpacing?: number;

  /** Margins (in points) */
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Predefined template configurations
 * These can be extended by users
 */
export const PREDEFINED_TEMPLATES: Record<string, Partial<TemplateConfig>> = {
  REGISTRO_ORE: {
    name: 'Registro Ore Lezione',
    description: 'Registro con dettaglio orario delle lezioni (con pausa pranzo)',
    templateType: 'registro_didattico',
    format: 'xlsx',
    variables: [
      {
        name: 'ID_SEZIONE',
        label: 'ID Sezione',
        description: 'Identificativo della sezione del corso',
        type: 'string',
        required: true,
        extractionHint: 'Cerca "ID Sezione", "Sezione:", "ID:" nei dati dei moduli',
      },
      {
        name: 'CODICE_FISCALE_DOCENTE',
        label: 'Codice Fiscale Docente',
        description: 'Codice fiscale del docente/trainer',
        type: 'string',
        required: true,
        validationPattern: '^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$',
        extractionHint: 'Codice fiscale del trainer/docente che tiene il corso',
      },
      {
        name: 'MATERIA',
        label: 'Materia',
        description: 'Nome della materia/corso',
        type: 'string',
        required: true,
        extractionHint: 'Titolo o nome del corso/materia',
      },
      {
        name: 'SESSIONI',
        label: 'Sessioni',
        description: 'Array di sessioni con data, orari e luogo',
        type: 'array',
        required: true,
        extractionHint: 'Estrai TUTTE le sessioni con: data (DD/MM/YYYY), ora_inizio (HH:MM), ora_fine (HH:MM), luogo/sede',
        arrayItemStructure: {
          data: {
            name: 'data',
            label: 'Data',
            description: 'Data della sessione',
            type: 'date',
            required: true,
          },
          ora_inizio: {
            name: 'ora_inizio',
            label: 'Ora Inizio',
            description: 'Ora di inizio (HH:MM)',
            type: 'string',
            required: true,
          },
          ora_fine: {
            name: 'ora_fine',
            label: 'Ora Fine',
            description: 'Ora di fine (HH:MM)',
            type: 'string',
            required: true,
          },
          luogo: {
            name: 'luogo',
            label: 'Luogo',
            description: 'Sede o luogo della lezione',
            type: 'string',
            required: true,
          },
        },
      },
    ],
    postProcessing: {
      skipLunchBreak: true,
      splitIntoHourlyBlocks: true,
      excelColumns: [
        { header: 'ID_SEZIONE', variableName: 'ID_SEZIONE', width: 15, format: 'text' },
        { header: 'DATA LEZIONE', variableName: 'DATA', width: 12, format: 'text' },
        { header: 'TOTALE_ORE', variableName: 'DURATA', width: 10, format: 'text' },
        { header: 'ORA_INIZIO', variableName: 'ORA_INIZIO', width: 10, format: 'text' },
        { header: 'ORA_FINE', variableName: 'ORA_FINE', width: 10, format: 'text' },
        { header: 'TIPOLOGIA', variableName: 'TIPOLOGIA', width: 10, format: 'text' },
        { header: 'CODICE FISCALE DOCENTE', variableName: 'CODICE_FISCALE_DOCENTE', width: 20, format: 'text' },
        { header: 'MATERIA', variableName: 'MATERIA', width: 30, format: 'text' },
        { header: 'CONTENUTI MATERIA', variableName: 'MATERIA', width: 30, format: 'text' },
        { header: 'SVOLGIMENTO SEDE LEZIONE', variableName: 'SVOLGIMENTO', width: 25, format: 'text' },
      ],
    },
  },
};

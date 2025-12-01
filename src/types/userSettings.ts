/**
 * User Settings Types
 *
 * Purpose: Defines user-configurable settings for the application
 * Allows customization of ZIP structure, file naming, and output preferences
 */

export interface FolderStructureSettings {
  /** Root folder name (default: corso ID) */
  rootFolderName?: string;

  /** Folders to create in ZIP */
  folders: FolderDefinition[];

  /** Whether to include timestamp in ZIP filename */
  includeTimestamp: boolean;

  /** Whether to include course ID in filenames */
  includeCourseIdInFilenames: boolean;

  /** Whether to generate README file */
  generateReadme: boolean;

  /** Whether to generate metadata.json */
  generateMetadata: boolean;
}

export interface FolderDefinition {
  /** Unique folder ID */
  id: string;

  /** Display name of the folder */
  name: string;

  /** Order in ZIP structure (lower = first) */
  order: number;

  /** Whether this folder is enabled */
  enabled: boolean;

  /** Types of files to include in this folder */
  fileTypes: string[];

  /** Templates assigned to this folder */
  assignedTemplates?: string[];

  /** Icon for UI (optional) */
  icon?: string;
}

/**
 * Predefined Data Structures
 * 
 * Purpose: Manages reusable data entries for common fields that cannot be
 * automatically extracted from pasted content (e.g., locations, trainers, supervisors)
 */

export interface PredefinedLocation {
  /** Unique ID */
  id: string;
  /** Location name */
  name: string;
  /** Full address */
  address: string;
  /** City */
  citta?: string;
  /** ZIP Code */
  cap?: string;
  /** Province */
  provincia?: string;
  /** Whether this location is enabled */
  enabled: boolean;
}

export interface PredefinedSede {
  /** Unique ID */
  id: string;
  /** Sede name */
  nome: string;
  /** Full address */
  indirizzo: string;
  /** City */
  citta: string;
  /** ZIP Code */
  cap: string;
  /** Province */
  provincia: string;
  /** Whether this sede is enabled */
  enabled: boolean;
}

export interface PredefinedEntity {
  /** Unique ID */
  id: string;
  /** Entity name */
  name: string;
  /** Full address (Main HQ) */
  address: string;
  /** Sedi associated with this entity */
  sedi: PredefinedSede[];
  /** Whether this entity is enabled */
  enabled: boolean;
}

export interface PredefinedResponsabile {
  /** Unique ID */
  id: string;
  /** First name */
  nome: string;
  /** Last name */
  cognome: string;
  /** Birth date (format: DD/MM/YYYY) */
  dataNascita: string;
  /** Birth city */
  cittaNascita: string;
  /** Birth province */
  provinciaNascita: string;
  /** Residence city */
  cittaResidenza: string;
  /** Residence street */
  viaResidenza: string;
  /** Civic number */
  numeroCivico: string;
  /** ID document */
  documento: string;
  /** Whether this responsabile is enabled */
  enabled: boolean;
}

export interface PredefinedSupervisor {
  /** Unique ID */
  id: string;
  /** Full name */
  nomeCompleto: string;
  /** Job title/role */
  qualifica: string;
  /** Whether this supervisor is enabled */
  enabled: boolean;
}

export interface PredefinedTrainer {
  /** Unique ID */
  id: string;
  /** First name */
  nome: string;
  /** Last name */
  cognome: string;
  /** Full name (optional helper) */
  nomeCompleto?: string;
  /** Tax ID (Codice Fiscale) */
  codiceFiscale?: string;
  /** Phone number */
  telefono?: string;
  /** Email address */
  email?: string;
  /** Whether this trainer is enabled */
  enabled: boolean;
}

export interface PredefinedOffer {
  /** Unique ID */
  id: string;
  /** Offer code (e.g. 1020) */
  codice: string;
  /** Offer name */
  nome: string;
  /** Whether this offer is enabled */
  enabled: boolean;
}

export interface PredefinedPlatform {
  /** Unique ID */
  id: string;
  /** Platform name (e.g., Zoom, Meet) */
  name: string;
  /** Optional link (e.g., meeting URL) */
  link?: string;
  /** Whether this platform is enabled */
  enabled: boolean;
}

export interface PredefinedArgumentList {
  /** Unique ID */
  id: string;
  /** Name of the list (e.g., "Logistica Base") */
  name: string;
  /** List of arguments */
  arguments: string[];
  /** Whether this list is enabled */
  enabled: boolean;
}

export interface PredefinedDataSettings {
  locations: PredefinedLocation[];
  entities: PredefinedEntity[];
  responsabili: PredefinedResponsabile[];
  supervisors: PredefinedSupervisor[];
  trainers: PredefinedTrainer[];
  platforms: PredefinedPlatform[];
  argumentLists: PredefinedArgumentList[];
  offers: PredefinedOffer[];
}

/**
 * Default values for predefined data
 * Used when no data is found in localStorage
 */
export const DEFAULT_PREDEFINED_DATA: PredefinedDataSettings = {
  locations: [
    { id: 'loc_1', name: 'Varese', address: 'Via Walter Marcobi 4', citta: 'Varese', cap: '21100', provincia: 'VA', enabled: true },
    { id: 'loc_2', name: 'Milano Porta Romana', address: 'Corso di Porta Romana 122', citta: 'Milano', cap: '20122', provincia: 'MI', enabled: true },
    { id: 'loc_3', name: 'Milano Stazione Centrale', address: 'Via Recanate 2', citta: 'Milano', cap: '20124', provincia: 'MI', enabled: true },
    { id: 'loc_4', name: 'Milano Porta Venezia', address: 'Viale Vittorio Veneto 20', citta: 'Milano', cap: '20124', provincia: 'MI', enabled: true },
    { id: 'loc_6', name: 'Milano Decembrio', address: 'Via Pier Candido Decembrio 28', citta: 'Milano', cap: '20137', provincia: 'MI', enabled: true },
    { id: 'loc_5', name: 'External Training', address: 'Presso Cliente', citta: '', cap: '', provincia: '', enabled: true },
  ],
  entities: [
    {
      id: 'ent_1',
      name: 'AK Group S.r.l',
      address: 'Corso di Porta Romana 122, 20122 Milano (MI)',
      enabled: true,
      sedi: [
        {
          id: 'sede_ak_1',
          nome: 'Sede Legale',
          indirizzo: 'Corso di Porta Romana 122',
          citta: 'Milano',
          cap: '20122',
          provincia: 'MI',
          enabled: true
        },
        {
          id: 'sede_ak_2',
          nome: 'Varese',
          indirizzo: 'Via Walter Marcobi 4',
          citta: 'Varese',
          cap: '21100',
          provincia: 'VA',
          enabled: true
        },
        {
          id: 'sede_ak_3',
          nome: 'Milano Stazione Centrale',
          indirizzo: 'Via Recanate 2',
          citta: 'Milano',
          cap: '20124',
          provincia: 'MI',
          enabled: true
        },
        {
          id: 'sede_ak_4',
          nome: 'Milano Porta Venezia',
          indirizzo: 'Viale Vittorio Veneto 20',
          citta: 'Milano',
          cap: '20124',
          provincia: 'MI',
          enabled: true
        },
        {
          id: 'sede_ak_5',
          nome: 'Milano Decembrio',
          indirizzo: 'Via Pier Candido Decembrio 28',
          citta: 'Milano',
          cap: '20137',
          provincia: 'MI',
          enabled: true
        }
      ]
    }
  ],
  responsabili: [
    {
      id: 'resp_1',
      nome: 'Gianfranco',
      cognome: 'Torre',
      dataNascita: '12/03/1976',
      cittaNascita: 'Milano',
      provinciaNascita: 'MI',
      cittaResidenza: 'Milano',
      viaResidenza: 'Via Example',
      numeroCivico: '1',
      documento: 'CA12345AA',
      enabled: true
    }
  ],
  supervisors: [
    { id: 'sup_1', nomeCompleto: 'Hubbard Andrea', qualifica: 'Supervisore', enabled: true }
  ],
  trainers: [
    {
      id: 'tr_1',
      nome: 'Andres',
      cognome: 'Moles',
      nomeCompleto: 'Andres Moles',
      codiceFiscale: 'MLSNRS97S25F205C',
      telefono: '',
      enabled: true
    }
  ],
  platforms: [
    { id: 'zoom', name: 'Zoom', enabled: true },
    { id: 'teams', name: 'Microsoft Teams', enabled: true },
    { id: 'meet', name: 'Google Meet', enabled: true },
  ],
  argumentLists: [],
  offers: [
    { id: 'gol_1020', codice: '1020', nome: 'GOL - Offerta per Formazione mirata all\'inserimento lavorativo', enabled: true },
    { id: 'gol_1540', codice: '1540', nome: 'GOL - FAD 100% - Offerta per Formazione mirata all\'inserimento lavorativo', enabled: true },
  ],
};

export interface UserSettings {
  /** Folder structure configuration */
  folderStructure: FolderStructureSettings;

  /** API keys and credentials */
  apiKeys: {
    geminiApiKey?: string;
  };

  /** UI preferences */
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: 'it' | 'en';
  };

  /** Template preferences */
  templates: {
    /** Preferred template IDs for each document type */
    preferredTemplates: Record<string, string>;

    /** Whether to use double-check extraction by default */
    useDoubleCheckByDefault: boolean;
  };

  /** Predefined data for dropdowns in wizard */
  predefinedData: PredefinedDataSettings;
}

/**
 * Default folder structure
 */
export const DEFAULT_FOLDER_STRUCTURE: FolderStructureSettings = {
  folders: [
    {
      id: 'documenti',
      name: 'Documenti',
      order: 1,
      enabled: true,
      fileTypes: ['docx'],
      assignedTemplates: [
        'local-Verbale - Corso di formazione ID XXXXX.docx',
        'local-Verbale_con_placeholder.docx'
      ],
      icon: '📄',
    },
    {
      id: 'excel',
      name: 'Excel',
      order: 2,
      enabled: true,
      fileTypes: ['xlsx'],
      icon: '📊',
    },
    {
      id: 'pdf',
      name: 'PDF',
      order: 3,
      enabled: false,
      fileTypes: ['pdf'],
      icon: '📕',
    },
  ],
  includeTimestamp: true,
  includeCourseIdInFilenames: true,
  generateReadme: true,
  generateMetadata: true,
};

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  folderStructure: DEFAULT_FOLDER_STRUCTURE,
  apiKeys: {},
  ui: {
    theme: 'system',
    language: 'it',
  },
  templates: {
    preferredTemplates: {},
    useDoubleCheckByDefault: true,
  },
  predefinedData: DEFAULT_PREDEFINED_DATA,
};

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

  /** Icon for UI (optional) */
  icon?: string;
}

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
};

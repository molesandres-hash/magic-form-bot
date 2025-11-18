/**
 * Word Template Processor
 *
 * Purpose: Processes Word templates by replacing placeholders with actual data
 * Supports {{VARIABLE_NAME}} placeholder syntax
 * Can handle nested data structures and arrays
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// ============================================================================
// TYPES
// ============================================================================

interface WordTemplateOptions {
  /** Template file (as ArrayBuffer or Blob) */
  template: ArrayBuffer | Blob;

  /** Data to fill into placeholders */
  data: Record<string, any>;

  /** Output filename */
  filename: string;

  /** Optional: Custom delimiter (default: {{ }}) */
  delimiters?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// WORD TEMPLATE PROCESSING
// ============================================================================

/**
 * Processes a Word template with variable substitution
 *
 * Placeholder syntax: {{VARIABLE_NAME}}
 * Example:
 * - Template contains: "Corso: {{NOME_CORSO}}"
 * - Data: { NOME_CORSO: "Intelligenza Artificiale" }
 * - Result: "Corso: Intelligenza Artificiale"
 *
 * Supports:
 * - Simple variables: {{NAME}}
 * - Nested objects: {{user.name}}
 * - Arrays/loops: {#items}{{name}}{/items}
 *
 * @param options - Template processing options
 * @returns Processed document as Blob
 */
export async function processWordTemplate(
  options: WordTemplateOptions
): Promise<Blob> {
  try {
    // Convert Blob to ArrayBuffer if needed
    let templateBuffer: ArrayBuffer;
    if (options.template instanceof Blob) {
      templateBuffer = await options.template.arrayBuffer();
    } else {
      templateBuffer = options.template;
    }

    // Load template into PizZip
    const zip = new PizZip(templateBuffer);

    // Create Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: options.delimiters || {
        start: '{{',
        end: '}}',
      },
    });

    // Render document with data
    doc.render(options.data);

    // Generate output
    const output = doc.getZip().generate({
      type: 'blob',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
    });

    return output;
  } catch (error: any) {
    console.error('Error processing Word template:', error);

    // Provide detailed error information
    if (error.properties && error.properties.errors) {
      const errorMessages = error.properties.errors
        .map((err: any) => {
          return `- ${err.message} (near: "${err.name}")`;
        })
        .join('\n');
      throw new Error(
        `Errore nel template Word:\n${errorMessages}\n\nVerifica che tutti i placeholder nel template siano corretti.`
      );
    }

    throw new Error(`Errore durante l'elaborazione del template Word: ${error.message}`);
  }
}

/**
 * Processes Word template and triggers download
 *
 * @param options - Template processing options
 */
export async function processAndDownloadWordTemplate(
  options: WordTemplateOptions
): Promise<void> {
  try {
    const blob = await processWordTemplate(options);
    saveAs(blob, options.filename);
    console.log(`Word template processed and downloaded: ${options.filename}`);
  } catch (error) {
    console.error('Error processing and downloading Word template:', error);
    throw error;
  }
}

/**
 * Loads a Word template from Supabase storage
 *
 * @param filePath - Path to template file in Supabase storage
 * @param supabase - Supabase client
 * @returns Template as ArrayBuffer
 */
export async function loadTemplateFromStorage(
  filePath: string,
  supabase: any
): Promise<ArrayBuffer> {
  try {
    const { data, error } = await supabase.storage
      .from('document-templates')
      .download(filePath);

    if (error) throw error;

    return await data.arrayBuffer();
  } catch (error: any) {
    console.error('Error loading template from storage:', error);
    throw new Error(`Impossibile caricare il template: ${error.message}`);
  }
}

// ============================================================================
// DATA PREPARATION HELPERS
// ============================================================================

/**
 * Prepares extracted data for Word template rendering
 * Flattens nested structures and formats values for display
 *
 * @param extractedData - Raw data from AI extraction
 * @returns Formatted data ready for template rendering
 */
export function prepareDataForWordTemplate(
  extractedData: Record<string, any>
): Record<string, any> {
  const prepared: Record<string, any> = {};

  Object.entries(extractedData).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      // Replace null/undefined with empty string
      prepared[key] = '';
    } else if (Array.isArray(value)) {
      // Keep arrays as-is for loop rendering
      prepared[key] = value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return prepareDataForWordTemplate(item);
        }
        return item;
      });
    } else if (typeof value === 'object') {
      // Flatten nested objects with dot notation
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        prepared[`${key}.${nestedKey}`] = nestedValue ?? '';
      });
      // Also keep original object for potential nested access
      prepared[key] = value;
    } else {
      // Primitive values
      prepared[key] = value;
    }
  });

  return prepared;
}

/**
 * Validates that all required placeholders in template have corresponding data
 *
 * @param templatePlaceholders - Array of placeholder names found in template
 * @param data - Data object
 * @returns Validation result with missing placeholders
 */
export function validateTemplateData(
  templatePlaceholders: string[],
  data: Record<string, any>
): {
  isValid: boolean;
  missingPlaceholders: string[];
} {
  const missing: string[] = [];

  templatePlaceholders.forEach((placeholder) => {
    // Check if placeholder exists in data (including nested paths)
    const keys = placeholder.split('.');
    let current: any = data;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        missing.push(placeholder);
        break;
      }
    }
  });

  return {
    isValid: missing.length === 0,
    missingPlaceholders: missing,
  };
}

// ============================================================================
// UTILITY: Extract placeholders from template
// ============================================================================

/**
 * Extracts all placeholder names from a Word template
 * This can be used to show users which variables are expected
 *
 * @param template - Template file as ArrayBuffer
 * @returns Array of placeholder names
 */
export async function extractPlaceholdersFromTemplate(
  template: ArrayBuffer
): Promise<string[]> {
  try {
    const zip = new PizZip(template);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Get all tags (placeholders) from template
    const tags = doc.getFullText().match(/\{\{([^}]+)\}\}/g) || [];

    // Clean up and extract variable names
    const placeholders = tags.map((tag) => tag.replace(/\{\{|\}\}/g, '').trim());

    // Remove duplicates
    return [...new Set(placeholders)];
  } catch (error: any) {
    console.error('Error extracting placeholders:', error);
    throw new Error(`Impossibile estrarre i placeholder: ${error.message}`);
  }
}

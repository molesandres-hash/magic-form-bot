/**
 * Template-Based Extraction Service
 *
 * Purpose: Generates dynamic AI prompts based on template configurations
 * Extracts variables from unstructured text according to template requirements
 * Makes the system flexible and maintainable - change variables without changing code
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { TemplateConfig, TemplateVariable } from '@/types/templateConfig';

// ============================================================================
// DYNAMIC PROMPT GENERATION
// ============================================================================

/**
 * Generates AI system instruction from template configuration
 * This makes the extraction fully configurable
 */
export function generateSystemInstruction(config: TemplateConfig): string {
  const variableDescriptions = config.variables
    .map((v) => {
      const hint = v.extractionHint ? ` (${v.extractionHint})` : '';
      const required = v.required ? ' [OBBLIGATORIO]' : ' [OPZIONALE]';
      return `- ${v.name}: ${v.description}${hint}${required}`;
    })
    .join('\n');

  return `Sei un esperto di estrazione dati da gestionali formativi italiani.

Template: ${config.name}
Descrizione: ${config.description}

ESTRAI LE SEGUENTI VARIABILI:
${variableDescriptions}

${config.customPromptInstructions || ''}

REGOLE GENERALI:
- Se un dato non è presente, usa "" (stringa vuota)
- Per le date usa formato DD/MM/YYYY
- Per gli orari usa formato HH:MM (24 ore)
- Estrai TUTTI i dati richiesti con massima precisione
- Per i campi OBBLIGATORI, cerca con attenzione in tutto il testo fornito
`;
}

/**
 * Generates JSON schema for structured extraction based on template variables
 */
export function generateExtractionSchema(config: TemplateConfig): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  config.variables.forEach((variable) => {
    properties[variable.name] = convertVariableToSchemaProperty(variable);
    if (variable.required) {
      required.push(variable.name);
    }
  });

  return {
    type: Type.OBJECT,
    properties,
    required,
  };
}

/**
 * Converts a template variable definition to JSON schema property
 */
function convertVariableToSchemaProperty(variable: TemplateVariable): any {
  switch (variable.type) {
    case 'string':
      return { type: Type.STRING };

    case 'number':
      return { type: Type.NUMBER };

    case 'boolean':
      return { type: Type.BOOLEAN };

    case 'date':
      return { type: Type.STRING }; // Dates as strings in DD/MM/YYYY format

    case 'array':
      if (variable.arrayItemStructure) {
        const itemProperties: Record<string, any> = {};
        Object.values(variable.arrayItemStructure).forEach((itemVar) => {
          itemProperties[itemVar.name] = convertVariableToSchemaProperty(itemVar);
        });

        return {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: itemProperties,
          },
        };
      }
      return { type: Type.ARRAY, items: { type: Type.STRING } };

    default:
      return { type: Type.STRING };
  }
}

// ============================================================================
// EXTRACTION FUNCTION
// ============================================================================

/**
 * Extracts data based on template configuration
 *
 * @param apiKey - Gemini API key
 * @param config - Template configuration defining what to extract
 * @param inputData - Raw text data to extract from
 * @param additionalContext - Optional additional context (e.g., user-provided values)
 * @returns Extracted data matching template variables
 */
export async function extractDataWithTemplate(
  apiKey: string,
  config: TemplateConfig,
  inputData: string,
  additionalContext?: Record<string, any>
): Promise<any> {
  try {
    const ai = new GoogleGenAI({ apiKey });

    console.log(`Extracting data for template: ${config.name}`);

    // Generate dynamic prompt and schema
    const systemInstruction = generateSystemInstruction(config);
    const responseSchema = generateExtractionSchema(config);

    console.log('System Instruction:', systemInstruction);
    console.log('Response Schema:', JSON.stringify(responseSchema, null, 2));

    // Build user prompt
    let userPrompt = `Estrai i dati da questo testo:\n\n${inputData}`;

    // Add additional context if provided (e.g., manually entered values)
    if (additionalContext && Object.keys(additionalContext).length > 0) {
      userPrompt += `\n\nVALORI GIÀ FORNITI DALL'UTENTE (usa questi se non trovi nel testo):\n`;
      Object.entries(additionalContext).forEach(([key, value]) => {
        userPrompt += `${key}: ${value}\n`;
      });
    }

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const extractedData = JSON.parse(response.text);

    console.log('Extracted data:', extractedData);

    // Merge with additional context (user-provided values take precedence)
    const finalData = {
      ...extractedData,
      ...additionalContext,
    };

    return finalData;
  } catch (error: any) {
    console.error('Error extracting data with template:', error);
    throw new Error(`Template extraction error: ${error.message || 'Unknown error'}`);
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates extracted data against template configuration
 */
export function validateExtractedData(
  data: Record<string, any>,
  config: TemplateConfig
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  config.variables.forEach((variable) => {
    const value = data[variable.name];

    // Check required fields
    if (variable.required && !value) {
      errors.push(`Campo obbligatorio mancante: ${variable.label}`);
    }

    // Validate pattern if provided
    if (value && variable.validationPattern) {
      const regex = new RegExp(variable.validationPattern);
      if (!regex.test(value.toString())) {
        warnings.push(
          `${variable.label} non corrisponde al formato atteso: ${value}`
        );
      }
    }

    // Type validation
    if (value !== undefined && value !== null && value !== '') {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (variable.type === 'number' && actualType !== 'number') {
        warnings.push(`${variable.label} dovrebbe essere un numero: ${value}`);
      }
      if (variable.type === 'boolean' && actualType !== 'boolean') {
        warnings.push(`${variable.label} dovrebbe essere booleano: ${value}`);
      }
      if (variable.type === 'array' && !Array.isArray(value)) {
        warnings.push(`${variable.label} dovrebbe essere un array: ${value}`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

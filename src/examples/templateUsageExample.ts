/**
 * Template System Usage Examples
 *
 * This file demonstrates how to use the new template system
 * for extracting data and generating documents
 */

import { extractDataWithTemplate, validateExtractedData } from '@/services/templateExtractionService';
import { processWordTemplate, loadTemplateFromStorage } from '@/services/wordTemplateProcessor';
import { generateExcelFromTemplate, processSessionsIntoRows } from '@/services/excelTemplateGenerator';
import { PREDEFINED_TEMPLATES } from '@/types/templateConfig';

// ============================================================================
// EXAMPLE 1: Extract Data for Registro Ore using Template
// ============================================================================

export async function example1_ExtractRegistroOreData() {
  const apiKey = 'YOUR_GEMINI_API_KEY';

  // Get predefined template configuration
  const templateConfig = {
    ...PREDEFINED_TEMPLATES.REGISTRO_ORE,
    id: 'registro_ore_1',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Input data from gestionale
  const inputText = `
ID Sezione: 22639
Corso: AI: Intelligenza Artificiale 100% FAD (1,2,3)

Quando:
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 22/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 23/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 24/09/2025 14:00 - 18:00 - Online

Trainer: Andres Moles
  `;

  // Additional context (manually entered data)
  const additionalContext = {
    CODICE_FISCALE_DOCENTE: 'MLSNDR90A01H501Z', // User enters this
  };

  try {
    // Extract data using template
    const extractedData = await extractDataWithTemplate(
      apiKey,
      templateConfig,
      inputText,
      additionalContext
    );

    console.log('Extracted Data:', extractedData);
    /*
    {
      ID_SEZIONE: "22639",
      CODICE_FISCALE_DOCENTE: "MLSNDR90A01H501Z",
      MATERIA: "Intelligenza Artificiale",
      SESSIONI: [
        {
          data: "22/09/2025",
          ora_inizio: "14:00",
          ora_fine: "18:00",
          luogo: "Online"
        },
        ...
      ]
    }
    */

    // Validate extracted data
    const validation = validateExtractedData(extractedData, templateConfig);

    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      console.warn('Validation warnings:', validation.warnings);
    } else {
      console.log('✓ Data validated successfully!');
    }

    // Generate Excel from extracted data
    generateExcelFromTemplate(extractedData, templateConfig);

    return extractedData;
  } catch (error) {
    console.error('Error extracting data:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Generate Word Document from Template
// ============================================================================

export async function example2_GenerateWordDocument(supabase: any) {
  // Load template from Supabase storage
  const template = await loadTemplateFromStorage(
    'templates/attestato_template.docx',
    supabase
  );

  // Data to fill into template
  const data = {
    NOME_PARTECIPANTE: 'Mario Rossi',
    CODICE_FISCALE: 'RSSMRA80A01H501Z',
    NOME_CORSO: 'Intelligenza Artificiale - Modulo 1',
    DATA_INIZIO: '22/09/2025',
    DATA_FINE: '26/09/2025',
    ORE_TOTALI: '20',
    FIRMA_DIRETTORE: 'Dr. Giovanni Bianchi',
  };

  try {
    // Generate Word document
    const blob = await processWordTemplate({
      template,
      data,
      filename: 'Attestato_MarioRossi.docx',
    });

    console.log('✓ Word document generated successfully!');
    return blob;
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: Process Sessions into Excel Rows
// ============================================================================

export async function example3_ProcessSessionsIntoExcelRows() {
  const sessions = [
    {
      data: '22/09/2025',
      ora_inizio: '09:00',
      ora_fine: '17:00',
      luogo: 'Ufficio Milano',
    },
    {
      data: '23/09/2025',
      ora_inizio: '14:00',
      ora_fine: '18:00',
      luogo: 'Online',
    },
  ];

  const idSezione = '22639';
  const codiceFiscaleDocente = 'MLSNDR90A01H501Z';
  const materia = 'Intelligenza Artificiale';

  // Process sessions into Excel rows
  const rows = processSessionsIntoRows(
    sessions,
    idSezione,
    codiceFiscaleDocente,
    materia
  );

  console.log('Generated rows:', rows);
  /*
  [
    // Day 1: 09:00-17:00 → 7 blocks (skips 13:00-14:00)
    { ID_SEZIONE: "22639", DATA_LEZIONE: "22/09/2025", ORA_INIZIO: "09:00", ORA_FINE: "10:00", TIPOLOGIA: "1", ... },
    { ID_SEZIONE: "22639", DATA_LEZIONE: "22/09/2025", ORA_INIZIO: "10:00", ORA_FINE: "11:00", TIPOLOGIA: "1", ... },
    { ID_SEZIONE: "22639", DATA_LEZIONE: "22/09/2025", ORA_INIZIO: "11:00", ORA_FINE: "12:00", TIPOLOGIA: "1", ... },
    { ID_SEZIONE: "22639", DATA_LEZIONE: "22/09/2025", ORA_INIZIO: "12:00", ORA_FINE: "13:00", TIPOLOGIA: "1", ... },
    // 13:00-14:00 SKIPPED
    { ID_SEZIONE: "22639", DATA_LEZIONE: "22/09/2025", ORA_INIZIO: "14:00", ORA_FINE: "15:00", TIPOLOGIA: "1", ... },
    { ID_SEZIONE: "22639", DATA_LEZIONE: "22/09/2025", ORA_INIZIO: "15:00", ORA_FINE: "16:00", TIPOLOGIA: "1", ... },
    { ID_SEZIONE: "22639", DATA_LEZIONE: "22/09/2025", ORA_INIZIO: "16:00", ORA_FINE: "17:00", TIPOLOGIA: "1", ... },

    // Day 2: 14:00-18:00 → 4 blocks
    { ID_SEZIONE: "22639", DATA_LEZIONE: "23/09/2025", ORA_INIZIO: "14:00", ORA_FINE: "15:00", TIPOLOGIA: "4", ... },
    { ID_SEZIONE: "22639", DATA_LEZIONE: "23/09/2025", ORA_INIZIO: "15:00", ORA_FINE: "16:00", TIPOLOGIA: "4", ... },
    { ID_SEZIONE: "22639", DATA_LEZIONE: "23/09/2025", ORA_INIZIO: "16:00", ORA_FINE: "17:00", TIPOLOGIA: "4", ... },
    { ID_SEZIONE: "22639", DATA_LEZIONE: "23/09/2025", ORA_INIZIO: "17:00", ORA_FINE: "18:00", TIPOLOGIA: "4", ... },
  ]
  */

  return rows;
}

// ============================================================================
// EXAMPLE 4: Create Custom Template Configuration
// ============================================================================

export function example4_CreateCustomTemplateConfig() {
  const customTemplate = {
    id: 'custom_verbale_1',
    name: 'Verbale Riunione Custom',
    description: 'Template personalizzato per verbali di riunione',
    templateType: 'verbale_partecipazione',
    format: 'docx' as const,
    variables: [
      {
        name: 'DATA_RIUNIONE',
        label: 'Data Riunione',
        description: 'Data della riunione',
        type: 'date' as const,
        required: true,
        extractionHint: 'Cerca la data della riunione nel formato DD/MM/YYYY',
      },
      {
        name: 'ORA_INIZIO',
        label: 'Ora Inizio',
        description: 'Orario di inizio',
        type: 'string' as const,
        required: true,
      },
      {
        name: 'PARTECIPANTI',
        label: 'Partecipanti',
        description: 'Lista partecipanti alla riunione',
        type: 'array' as const,
        required: true,
        arrayItemStructure: {
          nome: {
            name: 'nome',
            label: 'Nome',
            description: 'Nome del partecipante',
            type: 'string' as const,
            required: true,
          },
          ruolo: {
            name: 'ruolo',
            label: 'Ruolo',
            description: 'Ruolo del partecipante',
            type: 'string' as const,
            required: false,
          },
        },
      },
      {
        name: 'ARGOMENTI',
        label: 'Argomenti Discussi',
        description: 'Punti all\'ordine del giorno',
        type: 'array' as const,
        required: true,
      },
    ],
    customPromptInstructions: `
ISTRUZIONI SPECIFICHE:
- Estrai TUTTI i partecipanti con nome completo e ruolo se presente
- Gli argomenti discussi devono essere estratti come lista
- Se l'orario non è specificato, usa "Non specificato"
    `,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('Custom template created:', customTemplate);
  return customTemplate;
}

// ============================================================================
// EXAMPLE 5: Full Workflow - From Input to Document
// ============================================================================

export async function example5_FullWorkflow(apiKey: string, supabase: any) {
  console.log('=== FULL WORKFLOW EXAMPLE ===\n');

  // Step 1: Collect user input
  console.log('Step 1: Collecting input...');
  const courseInput = `
ID Corso: 50039
ID Sezione: 22639
Titolo: AI: Intelligenza Artificiale 100% FAD

Sessioni:
- 22/09/2025 14:00-18:00 Online
- 23/09/2025 14:00-18:00 Online
- 24/09/2025 14:00-18:00 Online
  `;

  const additionalData = {
    CODICE_FISCALE_DOCENTE: 'MLSNDR90A01H501Z',
    LINK_ZOOM: 'https://zoom.us/j/123456789',
  };

  // Step 2: Extract data with template
  console.log('Step 2: Extracting data with AI...');
  const templateConfig = {
    ...PREDEFINED_TEMPLATES.REGISTRO_ORE,
    id: 'registro_1',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const extractedData = await extractDataWithTemplate(
    apiKey,
    templateConfig,
    courseInput,
    additionalData
  );

  console.log('✓ Data extracted:', extractedData);

  // Step 3: Validate data
  console.log('Step 3: Validating data...');
  const validation = validateExtractedData(extractedData, templateConfig);

  if (!validation.isValid) {
    console.error('❌ Validation failed:', validation.errors);
    return;
  }

  console.log('✓ Data validated successfully!');

  // Step 4: Generate Excel
  console.log('Step 4: Generating Excel...');
  generateExcelFromTemplate(extractedData, templateConfig);
  console.log('✓ Excel generated!');

  // Step 5: Generate Word documents (if templates exist)
  console.log('Step 5: Generating Word documents...');
  try {
    const registroTemplate = await loadTemplateFromStorage(
      'templates/registro_template.docx',
      supabase
    );

    await processWordTemplate({
      template: registroTemplate,
      data: {
        ...extractedData,
        DATA_GENERAZIONE: new Date().toLocaleDateString('it-IT'),
      },
      filename: `Registro_${extractedData.ID_SEZIONE}.docx`,
    });

    console.log('✓ Word documents generated!');
  } catch (error) {
    console.warn('⚠ Word template not found, skipping...');
  }

  console.log('\n=== WORKFLOW COMPLETED ===');
}

// ============================================================================
// USAGE
// ============================================================================

/*
// In your React component:

import { example1_ExtractRegistroOreData } from '@/examples/templateUsageExample';

const handleExtractData = async () => {
  try {
    const data = await example1_ExtractRegistroOreData();
    console.log('Extraction complete!', data);
  } catch (error) {
    console.error('Extraction failed:', error);
  }
};
*/

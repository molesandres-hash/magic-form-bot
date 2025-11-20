# 📋 Sistema di Template Configurabili - Guida Completa

## 🎯 Obiettivo

Il sistema di template permette di:
1. **Creare nuovi template** Word/Excel senza modificare il codice
2. **Definire variabili** da estrarre tramite AI in modo configurabile
3. **Generare documenti** sostituendo placeholder con dati estratti
4. **Modificare facilmente** le variabili e i prompt di estrazione

## 🏗️ Architettura del Sistema

### Componenti Principali

```
┌──────────────────────────────────────────────────────────────┐
│                    Template Configuration                     │
│  (Define quali variabili estrarre e come processarle)        │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│              Template Extraction Service                      │
│  (Genera prompt AI dinamici basati sulla configurazione)     │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│                    AI Extraction                              │
│           (Gemini estrae le variabili)                        │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│              Document Generation                              │
│  - Word: Sostituisce {{PLACEHOLDER}} con valori              │
│  - Excel: Applica logica business (blocchi orari, ecc.)      │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 Come Funziona

### 1. Configurazione Template

Ogni template ha una configurazione JSON che definisce:

```typescript
interface TemplateConfig {
  name: string;              // Nome del template
  description: string;       // Descrizione
  templateType: string;      // Tipo (registro_didattico, etc.)
  format: 'docx' | 'xlsx';   // Formato file

  variables: TemplateVariable[];  // Variabili da estrarre

  customPromptInstructions?: string;  // Istruzioni custom per AI

  postProcessing?: {
    skipLunchBreak?: boolean;           // Per Excel
    splitIntoHourlyBlocks?: boolean;    // Per Excel
    excelColumns?: ExcelColumnDefinition[];  // Definizione colonne
  };
}
```

### 2. Definizione Variabili

Ogni variabile specifica cosa estrarre:

```typescript
interface TemplateVariable {
  name: string;                  // Nome variabile (es: "ID_SEZIONE")
  label: string;                 // Etichetta UI
  description: string;           // Descrizione
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean;             // Obbligatorio?
  defaultValue?: string;         // Valore default
  extractionHint?: string;       // Hint per AI
  validationPattern?: string;    // Regex per validazione
}
```

---

## 🚀 Esempio Pratico: Registro Ore

### Configurazione Template

```json
{
  "name": "Registro Ore Lezione",
  "description": "Registro con dettaglio orario delle lezioni",
  "templateType": "registro_didattico",
  "format": "xlsx",
  "variables": [
    {
      "name": "ID_SEZIONE",
      "label": "ID Sezione",
      "description": "Identificativo della sezione del corso",
      "type": "string",
      "required": true,
      "extractionHint": "Cerca 'ID Sezione', 'Sezione:', 'ID:' nei dati"
    },
    {
      "name": "CODICE_FISCALE_DOCENTE",
      "label": "Codice Fiscale Docente",
      "type": "string",
      "required": true,
      "validationPattern": "^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$"
    },
    {
      "name": "SESSIONI",
      "type": "array",
      "required": true,
      "arrayItemStructure": {
        "data": { "type": "date", "required": true },
        "ora_inizio": { "type": "string", "required": true },
        "ora_fine": { "type": "string", "required": true },
        "luogo": { "type": "string", "required": true }
      }
    }
  ],
  "postProcessing": {
    "skipLunchBreak": true,
    "splitIntoHourlyBlocks": true
  }
}
```

### Input Dati

```
ID Sezione: 22639
Corso: AI: Intelligenza Artificiale 100% FAD (1,2,3)

Quando:
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 22/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 23/09/2025 14:00 - 18:00 - Online

Trainer: Andres Moles
```

### Processo di Estrazione

1. **Il servizio genera prompt AI dinamico**:
   ```
   Estrai le seguenti variabili:
   - ID_SEZIONE: Identificativo della sezione (cerca 'ID Sezione', 'Sezione:')
   - CODICE_FISCALE_DOCENTE: Codice fiscale del docente
   - SESSIONI: Array di sessioni con data, ora_inizio, ora_fine, luogo
   ```

2. **AI estrae i dati**:
   ```json
   {
     "ID_SEZIONE": "22639",
     "CODICE_FISCALE_DOCENTE": "[da inserire]",
     "MATERIA": "Intelligenza Artificiale",
     "SESSIONI": [
       {
         "data": "22/09/2025",
         "ora_inizio": "14:00",
         "ora_fine": "18:00",
         "luogo": "Online"
       },
       {
         "data": "23/09/2025",
         "ora_inizio": "14:00",
         "ora_fine": "18:00",
         "luogo": "Online"
       }
     ]
   }
   ```

3. **Post-processing (Excel)**:
   - Divide 14:00-18:00 in blocchi orari: 14-15, 15-16, 16-17, 17-18 (4 ore)
   - Determina TIPOLOGIA: "Online" → TIPOLOGIA=4, SVOLGIMENTO=""
   - Crea 8 righe totali (4 ore × 2 giorni)

4. **Output Excel**:
   ```
   ID_SEZIONE | DATA LEZIONE | TOTALE_ORE | ORA_INIZIO | ORA_FINE | TIPOLOGIA | ...
   22639      | 22/09/2025   | 1          | 14:00      | 15:00    | 4         | ...
   22639      | 22/09/2025   | 1          | 15:00      | 16:00    | 4         | ...
   22639      | 22/09/2025   | 1          | 16:00      | 17:00    | 4         | ...
   22639      | 22/09/2025   | 1          | 17:00      | 18:00    | 4         | ...
   22639      | 23/09/2025   | 1          | 14:00      | 15:00    | 4         | ...
   ...
   ```

---

## 📄 Template Word con Placeholder

### Creazione Template Word

1. Crea un documento Word normale
2. Usa sintassi `{{NOME_VARIABILE}}` per i placeholder:

```
REGISTRO DIDATTICO

Corso: {{NOME_CORSO}}
ID Sezione: {{ID_SEZIONE}}
Docente: {{NOME_DOCENTE}} (CF: {{CODICE_FISCALE_DOCENTE}})

Periodo: dal {{DATA_INIZIO}} al {{DATA_FINE}}

{#SESSIONI}
- {{data}} ore {{ora_inizio}}-{{ora_fine}} - {{luogo}}
{/SESSIONI}
```

3. Carica il template nel sistema

### Sostituzione Automatica

Il sistema:
1. Carica il template Word
2. Estrae i dati con AI
3. Sostituisce tutti i `{{PLACEHOLDER}}` con i valori
4. Genera il documento finale

```typescript
import { processWordTemplate } from '@/services/wordTemplateProcessor';

// Carica template
const template = await loadTemplateFromStorage('path/to/template.docx', supabase);

// Dati estratti
const data = {
  NOME_CORSO: "Intelligenza Artificiale",
  ID_SEZIONE: "22639",
  CODICE_FISCALE_DOCENTE: "MLSNDR90A01H501Z",
  SESSIONI: [
    { data: "22/09/2025", ora_inizio: "14:00", ora_fine: "18:00", luogo: "Online" }
  ]
};

// Genera documento
const blob = await processWordTemplate({
  template,
  data,
  filename: "Registro_22639.docx"
});
```

---

## 🎨 Configurazione Ordine Cartelle ZIP

### Impostazioni Folder

Il sistema permette di configurare:

1. **Ordine delle cartelle** nel ZIP
2. **Nomi delle cartelle** personalizzati
3. **Abilitazione/disabilitazione** cartelle
4. **Opzioni generali**: timestamp, README, metadata

```typescript
interface FolderStructureSettings {
  folders: [
    { id: 'documenti', name: 'Documenti', order: 1, enabled: true },
    { id: 'excel', name: 'Excel', order: 2, enabled: true },
    { id: 'pdf', name: 'PDF', order: 3, enabled: false }
  ],
  includeTimestamp: true,
  includeCourseIdInFilenames: true,
  generateReadme: true,
  generateMetadata: true
}
```

### UI per Configurazione

Componente: `src/components/settings/FolderStructureSettings.tsx`

Funzionalità:
- Drag & drop per riordinare cartelle
- Toggle per abilitare/disabilitare
- Rinomina cartelle
- Salvataggio in localStorage

---

## 🔧 Files Creati

### Core System

| File | Descrizione |
|------|-------------|
| `src/types/templateConfig.ts` | Tipi TypeScript per configurazioni template |
| `src/services/templateExtractionService.ts` | Generazione prompt AI dinamici |
| `src/services/excelTemplateGenerator.ts` | Generazione Excel con logica business |
| `src/services/wordTemplateProcessor.ts` | Sostituzione placeholder Word |

### UI Components

| File | Descrizione |
|------|-------------|
| `src/components/steps/AdditionalDataStep.tsx` | Wizard step per codice fiscale/zoom link |
| `src/components/settings/FolderStructureSettings.tsx` | Configurazione ordine cartelle ZIP |

### Database

| File | Descrizione |
|------|-------------|
| `supabase/migrations/20251118000000_add_template_configurations.sql` | Tabella configurazioni template |

---

## 📊 Excel: Logica Blocchi Orari

### Funzionalità

```typescript
function splitIntoHourlyBlocks(oraInizio: string, oraFine: string)
```

**Input**: `09:00 - 17:00`

**Output**: 7 blocchi (non 8, perché salta pausa pranzo)

```
09:00-10:00  ✓
10:00-11:00  ✓
11:00-12:00  ✓
12:00-13:00  ✓
13:00-14:00  ✗ PAUSA PRANZO (SALTATO)
14:00-15:00  ✓
15:00-16:00  ✓
16:00-17:00  ✓
```

### Determinazione TIPOLOGIA

```typescript
function determineTipologiaAndSvolgimento(luogo: string)
```

**Logica**:
- Se `luogo` contiene "office", "ufficio", "presenza":
  - TIPOLOGIA = "1"
  - SVOLGIMENTO = "1"
- Altrimenti (online/FAD):
  - TIPOLOGIA = "4"
  - SVOLGIMENTO = ""

### Formato Pulito

```typescript
// Force text format on ALL cells
ws[cellRef].t = 's';  // Type: string
ws[cellRef].z = '@';  // Format: text
```

**Risultato**: File Excel ~11KB (invece di 36KB)
- No stili
- No formattazioni condizionali
- Solo testo

---

## 🔐 Wizard: Dati Aggiuntivi

### Componente: `AdditionalDataStep`

Raccoglie:

1. **Codice Fiscale Docente** (obbligatorio)
   - Validazione regex: `^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$`
   - Auto-uppercase
   - 16 caratteri

2. **Link Zoom** (opzionale)
   - Validazione URL: `^https?://`
   - Per sessioni online

3. **Note** (opzionale)
   - Textarea per informazioni aggiuntive

```typescript
interface AdditionalData {
  codiceFiscaleDocente: string;
  linkZoom?: string;
  note?: string;
}
```

---

## 🗄️ Database: Template Configurations

### Tabella: `template_configurations`

```sql
create table template_configurations (
  id uuid primary key,
  template_id uuid references document_templates(id),

  config_name text not null unique,
  template_type text not null,
  format text not null,

  variables jsonb not null,             -- Array di variabili
  custom_prompt_instructions text,      -- Prompt custom
  post_processing jsonb,                -- Regole post-processing

  version text not null default '1.0.0',
  is_active boolean default true,
  is_system_template boolean default false,

  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
```

### Esempio Record

```json
{
  "id": "uuid-here",
  "config_name": "Registro Ore Lezione",
  "template_type": "registro_didattico",
  "format": "xlsx",
  "variables": [...],
  "post_processing": {
    "skipLunchBreak": true,
    "splitIntoHourlyBlocks": true,
    "excelColumns": [...]
  },
  "is_system_template": true
}
```

---

## 🎯 Come Aggiungere un Nuovo Template

### Passo 1: Crea Configurazione

```typescript
const newTemplate: TemplateConfig = {
  name: "Attestato di Partecipazione",
  description: "Certificato per partecipanti al corso",
  templateType: "attestato",
  format: "docx",
  variables: [
    {
      name: "NOME_PARTECIPANTE",
      label: "Nome Partecipante",
      type: "string",
      required: true,
      extractionHint: "Nome completo del partecipante"
    },
    {
      name: "NOME_CORSO",
      label: "Nome Corso",
      type: "string",
      required: true
    },
    {
      name: "DATA_CORSO",
      label: "Date Corso",
      type: "string",
      required: true
    },
    {
      name: "ORE_TOTALI",
      label: "Ore Totali",
      type: "number",
      required: true
    }
  ]
};
```

### Passo 2: Crea Template Word

File: `attestato.docx`

```
ATTESTATO DI PARTECIPAZIONE

Si certifica che

{{NOME_PARTECIPANTE}}

ha partecipato al corso

{{NOME_CORSO}}

svoltosi dal {{DATA_CORSO}}
per un totale di {{ORE_TOTALI}} ore.
```

### Passo 3: Carica nel Sistema

1. Vai su Admin → Template Manager
2. Carica `attestato.docx`
3. Seleziona tipo: "Attestato"
4. Salva configurazione nel database

### Passo 4: Usa il Template

```typescript
// Estrai dati
const data = await extractDataWithTemplate(
  apiKey,
  newTemplate,
  inputText,
  { NOME_PARTECIPANTE: "Mario Rossi" }  // Context aggiuntivo
);

// Genera documento
await processAndDownloadWordTemplate({
  template: templateFile,
  data,
  filename: "Attestato_MarioRossi.docx"
});
```

---

## ✅ Vantaggi del Sistema

### 1. **Manutenibilità**
- Cambi le variabili senza toccare il codice
- Modifichi i prompt AI dalla configurazione
- Aggiungi nuovi template facilmente

### 2. **Flessibilità**
- Ogni template ha le sue variabili
- Post-processing configurabile
- Supporto Word e Excel

### 3. **Scalabilità**
- Database centralizzato
- Template versionati
- Configurazioni riutilizzabili

### 4. **User-Friendly**
- UI per gestire template
- Wizard guidato
- Validazione automatica

---

## 🔄 Workflow Completo

```
1. CONFIGURAZIONE
   └─> Definisci variabili in JSON
   └─> Crea template Word/Excel con placeholder
   └─> Salva configurazione nel DB

2. ESTRAZIONE
   └─> Inserisci dati grezzi dal gestionale
   └─> AI estrae variabili automaticamente
   └─> Sistema valida dati estratti

3. GENERAZIONE
   └─> Word: Sostituisce placeholder
   └─> Excel: Applica logica business
   └─> Crea ZIP con struttura configurata

4. DOWNLOAD
   └─> Tutti i documenti pronti
   └─> Formattazione corretta
   └─> File puliti e leggeri
```

---

## 📚 Riferimenti Codice

### Funzioni Principali

```typescript
// 1. Estrazione con template
extractDataWithTemplate(apiKey, config, inputData, context)

// 2. Generazione prompt dinamico
generateSystemInstruction(config)

// 3. Processing Word
processWordTemplate({ template, data, filename })

// 4. Generazione Excel pulito
generateCleanExcel(rows, columns, filename)

// 5. Divisione blocchi orari
splitIntoHourlyBlocks(oraInizio, oraFine)

// 6. Determinazione tipologia
determineTipologiaAndSvolgimento(luogo)
```

### Componenti UI

```typescript
// Wizard step dati aggiuntivi
<AdditionalDataStep onComplete={handleData} />

// Settings folder ZIP
<FolderStructureSettings />

// Template manager
<TemplateManager />
```

---

## 🎉 Conclusione

Il sistema di template è ora:

✅ **Configurabile**: Cambi variabili e prompt senza codice
✅ **Flessibile**: Supporta Word e Excel con logiche diverse
✅ **Manutenibile**: Tutto in configurazioni JSON
✅ **Estendibile**: Aggiungi nuovi template facilmente
✅ **User-Friendly**: UI per gestire tutto

**Prossimi passi**:
1. Testare il sistema end-to-end
2. Creare più template predefiniti
3. Documentare casi d'uso specifici
4. Raccogliere feedback utenti

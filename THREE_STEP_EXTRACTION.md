# Three-Step Extraction with Google Gemini

## Overview

The **Three-Step Extraction** feature implements a structured approach to extracting course data using Google Gemini's structured output API. Instead of processing all data in a single API call, the system makes **3 separate, focused extractions** for better accuracy.

## Why Three Steps?

### Problem with Single-Step Extraction
- **ID Confusion**: Course IDs and Section IDs were sometimes extracted incorrectly when all data was processed together
- **Context Overload**: Too much information in one prompt led to the AI missing critical fields
- **Mixed Data Sources**: Different paste sources (course details, modules table, participants list) were not clearly separated

### Solution: Focused Extraction
Each step has a **specific purpose** and **focused prompt**, leading to:
- ✅ **Better accuracy** for critical fields like ID Corso and ID Sezione
- ✅ **Clearer separation** of concerns
- ✅ **Easier debugging** when extraction fails
- ✅ **More reliable** participant extraction

---

## The Three Steps

### **Step 1: Calendar & Module Structure**
**Purpose**: Extract course schedule, sessions, and module organization
**Input**: First paste (course data)

**Extracts**:
- Course title, dates, total hours
- Number of modules/sections
- Session dates and times
- Module titles and types (Presenza/Online/FAD)
- Calendar summary

**Does NOT extract**:
- ❌ ID Corso
- ❌ ID Sezione
- ❌ Participants

**Example API Call**:
```typescript
const step1 = await extractStep1_CalendarAndModules(apiKey, courseData);
// Result: { corso: {...}, moduli: [...], numero_moduli: 3, calendario: {...} }
```

---

### **Step 2: IDs & Additional Info**
**Purpose**: Extract unique identifiers and supplementary information
**Input**: Second paste (modules data with IDs table)

**Extracts**:
- ✅ **ID Corso** (from Moduli table, NOT from Dettagli di base)
- ✅ **ID Sezione** (one for each module)
- Venue/location information
- Training entity details
- Trainer information
- Directors and supervisors
- FAD platform info

**Critical Logic**:
```
PRIORITÀ ASSOLUTA alle colonne "ID Corso" e "ID Sezione" nella tabella Moduli
IGNORA l'ID in "Dettagli di base" se differisce dalla tabella
```

**Example API Call**:
```typescript
const step2 = await extractStep2_IDsAndInfo(apiKey, modulesData);
// Result: { corso: { id: "47816" }, moduli: [{ id_corso: "47816", id_sezione: "12345" }], ... }
```

---

### **Step 3: Participants**
**Purpose**: Extract complete participant information
**Input**: Third paste (participants list)

**Extracts**:
- All participant details (ID, nome, cognome, CF, email, telefono)
- Program information (GOL, PNRR, etc.)
- Benefits status
- Office/department
- Case manager

**Example API Call**:
```typescript
const step3 = await extractStep3_Participants(apiKey, participantsData);
// Result: { partecipanti: [...], riepilogo: { totale_partecipanti: 15 } }
```

---

## Implementation

### Using the Three-Step Service

```typescript
import { extractCourseDataThreeSteps } from '@/services/threeStepExtractionService';

const result = await extractCourseDataThreeSteps(
  apiKey,
  courseData,      // First paste
  modulesData,     // Second paste
  participantsData, // Third paste
  (message, percent) => {
    console.log(`${message} - ${percent}%`);
  }
);
```

### Progress Tracking

The extraction provides real-time progress updates:

```
5%  - "Avvio estrazione in 3 fasi..."
10% - "Estrazione calendario e moduli (Step 1/3)..."
33% - "Step 1 completato"
40% - "Estrazione ID corso e sezione (Step 2/3)..."
66% - "Step 2 completato"
70% - "Estrazione partecipanti (Step 3/3)..."
90% - "Step 3 completato"
95% - "Combinazione dati..."
100% - "Estrazione completata!"
```

---

## Google Gemini Structured Output Format

Each step uses the **official Google Gemini structured output** pattern:

```typescript
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey });

const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: [{ text: SYSTEM_INSTRUCTION }],
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        corso: {
          type: Type.OBJECT,
          properties: {
            titolo: { type: Type.STRING },
            data_inizio: { type: Type.STRING },
            // ... more fields
          },
          required: ['titolo']
        },
        // ... more top-level fields
      },
      required: ['corso', 'moduli']
    },
  },
  contents: [
    {
      role: 'user',
      parts: [{ text: 'Estrai i dati...' }],
    },
  ],
});

// Collect streamed response
let fullText = '';
for await (const chunk of response) {
  fullText += chunk.text;
}

const result = JSON.parse(fullText);
```

---

## Files Structure

```
src/
├── services/
│   ├── extractionStepsConfig.ts       # Step 1, 2, 3 schemas and prompts
│   ├── threeStepExtractionService.ts  # Extraction logic
│   └── geminiService.ts               # Legacy single-step extraction
├── hooks/
│   └── useWizardState.ts              # Wizard logic with extraction toggle
└── components/
    ├── steps/
    │   └── InputStepWizard.tsx        # Main wizard component
    └── wizard/
        └── WizardStepParticipants.tsx # Step 3 with extraction options
```

---

## UI Features

### Extraction Mode Toggle

The user can choose between:

1. **Three-Step Extraction** (Default - Recommended)
   - Blue button: "Estrai in 3 Fasi"
   - Icon: ✨ Sparkles
   - Progress bar: Blue color

2. **Double-Check Extraction** (Legacy)
   - Green button: "Estrai con Doppia Verifica"
   - Icon: 🛡️ Shield
   - Runs extraction twice and compares results

3. **Standard Extraction** (Legacy)
   - Primary button: "Estrai con AI"
   - Icon: ▶️ Play
   - Single extraction call

### Visual Feedback

```
┌─────────────────────────────────────────────────┐
│ [✨] Estrazione in 3 Fasi (Consigliato)    [ON] │
│ Estrae i dati in 3 chiamate separate per        │
│ maggiore accuratezza degli ID                    │
└─────────────────────────────────────────────────┘

Progress: ████████████████░░░░░░░░░░░░░░  66%
Step 2 completato
✨ Estrazione in 3 fasi: calendario → ID corso/sezione → partecipanti
```

---

## Metadata

The three-step extraction adds special metadata to the result:

```typescript
{
  // ... normal course data ...
  metadata: {
    extraction_method: 'three-step',
    versione_sistema: '2.3.0',
    step_info: {
      numero_moduli_rilevati: 3,
      calendario_summary: {
        prima_sessione_data: "01/12/2025",
        ultima_sessione_data: "15/12/2025",
        numero_sessioni_totali: 12,
        numero_sessioni_presenza: 8,
        numero_sessioni_online: 4
      },
      partecipanti_summary: {
        totale_partecipanti: 15,
        partecipanti_con_benefits: 10,
        programmi_presenti: ["GOL", "PNRR"]
      }
    }
  }
}
```

---

## Benefits

| Feature | Single-Step | Three-Step |
|---------|-------------|------------|
| ID Accuracy | ⚠️ Medium | ✅ High |
| Context Clarity | ⚠️ Mixed | ✅ Focused |
| Debugging | ❌ Hard | ✅ Easy |
| Calendar Extraction | ✅ Good | ✅ Excellent |
| Participant Extraction | ✅ Good | ✅ Excellent |
| API Calls | 1 | 3 |
| Cost | Lower | Higher |

---

## Migration Guide

### From Single-Step to Three-Step

**Old Code**:
```typescript
const result = await extractCourseDataWithGemini(
  apiKey,
  courseData,
  modulesData,
  participantsData
);
```

**New Code**:
```typescript
const result = await extractCourseDataThreeSteps(
  apiKey,
  courseData,      // Step 1 input
  modulesData,     // Step 2 input
  participantsData, // Step 3 input
  onProgress       // Optional callback
);
```

The **output format is identical** - no changes needed to downstream code!

---

## Testing

To test the three-step extraction:

1. Navigate to the Input Step in the UI
2. Enable "Estrazione in 3 Fasi"
3. Paste your three data blocks:
   - Step 1: Course overview data
   - Step 2: Modules table with IDs
   - Step 3: Participants list
4. Click "Estrai in 3 Fasi"
5. Observe the progress: Step 1 → Step 2 → Step 3 → Merge
6. Check the result metadata for `step_info`

---

## Future Improvements

- [ ] Add retry logic for individual steps
- [ ] Cache Step 1 and Step 2 results to avoid re-extraction
- [ ] Add validation between steps (e.g., check that Step 2 has same number of modules as Step 1)
- [ ] Add parallel execution for Steps 1 and 3 (they don't depend on each other)
- [ ] Add diff comparison between steps for quality assurance

---

## Support

For issues or questions about the three-step extraction:
1. Check the console logs for `[STEP 1]`, `[STEP 2]`, `[STEP 3]` messages
2. Verify that each paste contains the correct data
3. Check that the Gemini API key is valid
4. Review the extraction schemas in `extractionStepsConfig.ts`

---

**Version**: 2.3.0
**Last Updated**: 2025-11-30
**Author**: Magic Form Bot Team

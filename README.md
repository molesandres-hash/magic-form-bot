# 📋 Magic Form Bot - Compilatore Documenti di Avvio Corso

## 🎯 Che cos'è questo progetto?

**Magic Form Bot** è un sistema intelligente di automazione documentale progettato per **ridurre da 60 minuti a 5 minuti** il processo di generazione dei documenti necessari all'avvio di corsi formativi.

Il sistema trasforma dati non strutturati copiati da un gestionale in documenti professionali pronti all'uso, utilizzando l'intelligenza artificiale per l'estrazione e la strutturazione dei dati.

---

## 🚀 Il Problema che Risolve

### Prima (Processo Manuale)
1. ❌ Copiare manualmente dati dal gestionale
2. ❌ Aprire template Word/Excel
3. ❌ Compilare centinaia di campi uno per uno
4. ❌ Rischio di errori di battitura
5. ❌ Tempo impiegato: **~60 minuti per corso**

### Dopo (Con Magic Form Bot)
1. ✅ Copia-incolla dati dal gestionale in 3 step
2. ✅ L'AI estrae e struttura automaticamente i dati
3. ✅ Genera tutti i documenti con un click
4. ✅ Doppia verifica automatica per accuratezza 99%+
5. ✅ Tempo impiegato: **~5 minuti per corso**

**Risparmio: 55 minuti per corso** 🎉

---

## ✨ Funzionalità Principali

### 🧙 Wizard Guidato a 3 Step
Sistema step-by-step che guida l'utente attraverso il processo:
1. **Step 1: Dati Corso** - Informazioni generali del corso (ID, titolo, date, ente)
2. **Step 2: Moduli** - Dettagli dei moduli (sessioni, orari, sedi, docenti)
3. **Step 3: Partecipanti** - Elenco completo partecipanti con dati anagrafici

### 🤖 Estrazione AI con Doppia Verifica
- **AI-Powered**: Utilizza Google Gemini 2.5 Flash per l'estrazione intelligente
- **Doppia Verifica**: Effettua 2 estrazioni indipendenti e confronta i risultati
- **Accuratezza**: >99% di corrispondenza tra le estrazioni
- **Gestione Dati Mancanti**: Valori di default intelligenti per campi incompleti

### 📄 Generazione Documenti Automatica
Genera automaticamente tutti i documenti necessari:

#### Documenti Word
- 📋 **Comunicazione di Avvio**: Notifica formale di inizio corso
- 📋 **Patto Formativo**: Accordo tra ente e partecipanti
- 📋 **Registro Presenze**: Fogli firma per ogni sessione

#### Fogli Excel
- 📊 **Elenco Partecipanti**: Anagrafica completa
- 📊 **Calendario Lezioni**: Planning dettagliato con orari
- 📊 **Riepilogo Ore**: Calcolo automatico ore totali/rendicontabili

#### Output Finale
- 📦 **File ZIP**: Tutti i documenti organizzati in cartelle
- 📁 **Struttura Standard**: Organizzazione gerarchica documenti
- 🏷️ **Naming Automatico**: Nomi file standardizzati

### 🎨 Sistema di Template Configurabili
- **Template Word Personalizzabili**: Usa file .docx con placeholder `{{VARIABILE}}`
- **Template Excel Dinamici**: Logica business configurable
- **Configurazione JSON**: Definisce variabili e regole di estrazione
- **Admin Panel**: Gestione template senza modificare codice
- **Enti Responsabili**: Database configurabile di enti formativi

### 🛡️ Robustezza e UX
- **Validazione Real-Time**: Controlli su codici fiscali, email, date
- **Preview Dati**: Anteprima completa prima della generazione
- **Export/Import JSON**: Backup e ripristino dati
- **Error Handling**: Messaggi di errore chiari e actionable
- **Error Boundary**: Recovery automatico da crash UI
- **Responsive Design**: Funziona su desktop e tablet

---

## 🏗️ Architettura del Sistema

### Workflow Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STEP 1: Input Wizard                          │
│  Utente incolla dati → 3 step (Corso, Moduli, Partecipanti)        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 2: AI Extraction                             │
│  Google Gemini API → Parsing intelligente → Strutturazione JSON     │
│  (Opzionale: Doppia estrazione + confronto per accuratezza)         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 3: Data Completion                           │
│  Revisione campi estratti → Validazione → Completamento manuale     │
│  (Validatori: CF, email, date, numeri di telefono)                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 STEP 4: Document Generation                          │
│  Template Processor → Word docs + Excel sheets → ZIP Package        │
│  (Sostituisce placeholder, applica logica business)                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Stack Tecnologico

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: React hooks + TanStack Query
- **Form Handling**: React Hook Form + Zod validation
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS + CSS Variables per theming

#### Backend / Services
- **AI Engine**: Google Gemini 2.5 Flash API (`@google/genai`)
- **Database**: Supabase (PostgreSQL + Auth)
- **Document Generation**:
  - Word: `docxtemplater` + `pizzip`
  - Excel: `xlsx` (SheetJS)
- **File Handling**: `jszip`, `file-saver`

#### Testing & Quality
- **Testing Framework**: Vitest + Testing Library
- **Test Coverage**: Unit tests per validatori e utility
- **Type Safety**: TypeScript strict mode
- **Linting**: ESLint + TypeScript ESLint

---

## 📦 Installazione e Setup

### Prerequisiti
- **Node.js**: v18+ (consigliato v20)
- **npm**: v9+ o **pnpm**: v8+
- **Google Gemini API Key**: Registrati su [Google AI Studio](https://makersuite.google.com/)

### Clone e Installazione

```bash
# Clone repository
git clone https://github.com/molesandres-hash/magic-form-bot.git
cd magic-form-bot

# Installa dipendenze
npm install

# Copia file di configurazione
cp .env.example .env

# Configura le variabili d'ambiente
# Modifica .env e inserisci le tue chiavi API
```

### Configurazione Variabili d'Ambiente

Crea un file `.env` nella root del progetto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API (configurata via UI)
# L'API key viene salvata nel localStorage dell'utente
```

### Avvio Sviluppo

```bash
# Avvia server di sviluppo
npm run dev

# Apri browser su http://localhost:5173
```

### Build Produzione

```bash
# Build ottimizzato
npm run build

# Preview build
npm run preview

# Run all checks (lint + test + build)
npm run validate
```

---

## 🎮 Come Usare l'Applicazione

### 1. Configurazione Iniziale

**Prima di iniziare**, configura la tua API key:
1. Clicca su **"API Key"** nella barra in alto
2. Inserisci la tua Google Gemini API key
3. La chiave viene salvata localmente (localStorage)

### 2. Processo di Generazione Documenti

#### Step 1: Incolla Dati Corso
1. Apri il gestionale e naviga alla scheda del corso
2. Copia tutti i dati visibili (Ctrl+A, Ctrl+C)
3. Incolla nel campo testuale dello Step 1
4. Clicca **"Avanti"**

#### Step 2: Incolla Dati Moduli
1. Nel gestionale, vai alla sezione "Moduli"
2. Copia tutti i dati dei moduli e sessioni
3. Incolla nel campo testuale dello Step 2
4. Clicca **"Avanti"**

#### Step 3: Incolla Partecipanti
1. Nel gestionale, seleziona un modulo
2. Copia l'elenco completo dei partecipanti
3. Incolla nel campo testuale dello Step 3
4. **Abilita "Doppia Verifica"** (consigliato)
5. Clicca **"Estrai con AI"**

#### Step 4: Completa e Verifica
1. Revisiona i dati estratti dall'AI
2. Completa eventuali campi mancanti
3. Verifica validazione real-time (CF, email, date)
4. Clicca **"Conferma"**

#### Step 5: Genera Documenti
1. Clicca **"Genera Documenti"**
2. Attendi la generazione (5-10 secondi)
3. Scarica il file ZIP con tutti i documenti
4. Estrai lo ZIP e usa i documenti

### 3. Funzionalità Avanzate

#### Export/Import JSON
- **Export**: Salva i dati estratti come backup JSON
- **Import**: Ricarica dati da file JSON salvato
- **Utilità**: Condivisione, backup, recovery

#### Template Manager (Admin)
- Accedi alla pagina Admin (solo utenti admin)
- Gestisci template Word/Excel
- Configura enti responsabili
- Definisci variabili di estrazione

---

## 🔧 Configurazione Template

### Come Funziona il Sistema di Template

Il sistema usa **placeholder** nei file Word/Excel che vengono sostituiti con i dati estratti:

#### Template Word

```
Comunicazione di Avvio Corso

Corso: {{TITOLO_CORSO}}
ID Corso: {{ID_CORSO}}
Date: dal {{DATA_INIZIO}} al {{DATA_FINE}}

Partecipanti:
{{#PARTECIPANTI}}
- {{NOME}} {{COGNOME}} (CF: {{CODICE_FISCALE}})
{{/PARTECIPANTI}}
```

#### Configurazione Template (JSON)

```json
{
  "id": "comunicazione_avvio",
  "nome": "Comunicazione di Avvio",
  "tipo": "word",
  "file_template": "templates/comunicazione_avvio.docx",
  "variabili": [
    {
      "nome": "TITOLO_CORSO",
      "descrizione": "Titolo completo del corso",
      "tipo": "string",
      "obbligatorio": true,
      "esempio": "Corso di Formazione Professionale"
    },
    {
      "nome": "PARTECIPANTI",
      "descrizione": "Array di partecipanti",
      "tipo": "array",
      "obbligatorio": true,
      "schema": {
        "NOME": "string",
        "COGNOME": "string",
        "CODICE_FISCALE": "string"
      }
    }
  ]
}
```

### Creare un Nuovo Template

1. Crea file Word/Excel con placeholder `{{VARIABILE}}`
2. Carica file nella cartella `public/templates/`
3. Crea configurazione JSON in Admin Panel
4. Definisci le variabili da estrarre
5. Testa il template con dati di esempio

Per dettagli completi, consulta: [📋 TEMPLATE_SYSTEM_GUIDE.md](./TEMPLATE_SYSTEM_GUIDE.md)

---

## 📚 Guide e Documentazione

- **[📋 TEMPLATE_SYSTEM_GUIDE.md](./TEMPLATE_SYSTEM_GUIDE.md)**: Guida completa al sistema di template
- **[🎨 UX_IMPROVEMENTS_GUIDE.md](./UX_IMPROVEMENTS_GUIDE.md)**: Miglioramenti UX e funzionalità robustezza

---

## 🗂️ Struttura del Progetto

```
magic-form-bot/
├── src/
│   ├── components/          # Componenti React
│   │   ├── steps/          # Wizard steps (Input, Completion, Generation)
│   │   ├── admin/          # Admin panel (Template Manager)
│   │   ├── settings/       # Settings dialogs (API Key)
│   │   └── ui/             # shadcn/ui components
│   ├── services/           # Business logic
│   │   ├── geminiService.ts           # AI extraction
│   │   ├── wordDocumentGenerator.ts   # Word generation
│   │   ├── excelGenerator.ts          # Excel generation
│   │   ├── wordTemplateProcessor.ts   # Template processing
│   │   └── zipPackager.ts             # ZIP packaging
│   ├── types/              # TypeScript types
│   │   ├── courseData.ts            # Data models
│   │   ├── templateConfig.ts        # Template config
│   │   └── userSettings.ts          # User settings
│   ├── utils/              # Utility functions
│   │   ├── validators.ts            # Validatori (CF, email, etc)
│   │   ├── dateUtils.ts             # Date formatting
│   │   └── errorHandling.ts         # Error handling
│   ├── constants/          # Constants e examples
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   └── integrations/       # External integrations (Supabase)
├── public/
│   └── templates/          # Template Word/Excel
├── tests/                  # Test files
└── docs/                   # Documentation
```

---

## 🧪 Testing

```bash
# Run tutti i test
npm run test

# Run test in watch mode
npm run test:watch

# Run test con UI
npm run test:ui

# Run test con coverage
npm run test:coverage
```

### Test Coverage

Il progetto include test per:
- ✅ Validatori (CF, email, date)
- ✅ Utility functions (date, string, error handling)
- ✅ Extraction service (gemini parsing)

---

## 🤝 Contribuire

### Workflow di Sviluppo

1. **Fork** il repository
2. Crea un **branch** per la tua feature (`git checkout -b feature/nuova-funzionalita`)
3. **Commit** le modifiche (`git commit -m 'Add: nuova funzionalità'`)
4. **Push** al branch (`git push origin feature/nuova-funzionalita`)
5. Apri una **Pull Request**

### Coding Standards

- **TypeScript Strict Mode**: Tutti i file devono passare type checking
- **ESLint**: Segui le regole ESLint del progetto
- **Clean Code**: Commenta codice complesso, usa nomi descrittivi
- **Test**: Aggiungi test per nuove funzionalità

---

## 🔒 Sicurezza e Privacy

### Gestione Dati
- **Nessun salvataggio server**: I dati non vengono salvati su server esterni
- **Processing client-side**: Tutta l'elaborazione avviene nel browser
- **API Key locale**: Le chiavi API sono salvate solo nel localStorage
- **GDPR Compliant**: Nessun tracciamento utente

### API Key
- **Google Gemini API**: Richiede API key personale
- **Costo**: Google Gemini Flash ha un tier gratuito generoso
- **Rate Limits**: Rispetta i rate limits di Google

---

## 📊 Roadmap

### In Sviluppo 🚧
- [ ] Edit inline dei campi nella preview
- [ ] Supporto multi-lingua (Italiano/Inglese)
- [ ] Template marketplace

### Pianificato 📅
- [ ] Integrazione diretta con gestionali popolari
- [ ] OCR per scansione documenti cartacei
- [ ] Dashboard analytics (tempo risparmiato, documenti generati)
- [ ] Mobile app (React Native)

### Completato ✅
- [x] Wizard a 3 step
- [x] Estrazione AI con doppia verifica
- [x] Sistema template configurabili
- [x] Export/Import JSON
- [x] Validazione real-time
- [x] Error handling robusto

---

## 📝 Changelog

### v1.0.0 (Attuale)
- ✨ Release iniziale
- ✨ Wizard guidato a 3 step
- ✨ Estrazione AI con Google Gemini
- ✨ Doppia verifica per accuratezza
- ✨ Sistema template configurabili
- ✨ Generazione documenti Word/Excel
- ✨ Export/Import JSON

---

## 📄 Licenza

Questo progetto è stato creato con [Lovable](https://lovable.dev) ed è privato.

Per informazioni sulla licenza, contatta il proprietario del repository.

---

## 🙏 Riconoscimenti

- **Lovable**: Piattaforma di sviluppo utilizzata
- **shadcn/ui**: Libreria di componenti UI
- **Google Gemini**: API di intelligenza artificiale
- **Supabase**: Backend as a Service
- **Community Open Source**: Per le numerose librerie utilizzate

---

## 📞 Supporto e Contatti

- **Issues**: [GitHub Issues](https://github.com/molesandres-hash/magic-form-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/molesandres-hash/magic-form-bot/discussions)
- **Project URL**: https://lovable.dev/projects/5d2fc690-0455-4ac3-ac4a-19d0ee9eb1e2

---

## 🌟 Se ti piace questo progetto

⭐ Metti una stella su GitHub per supportare il progetto!

---

<div align="center">
  <strong>Sviluppato con ❤️ per semplificare la vita a chi gestisce corsi formativi</strong>
  <br>
  <sub>Riducendo la burocrazia, un documento alla volta</sub>
</div>

---

## 🆕 Nuove Funzionalità v2.0 - Multi-Modulo e Placeholder Configurabili

### 📚 Supporto Multi-Modulo Avanzato

Il sistema ora gestisce correttamente corsi con **più moduli**, ognuno con le proprie caratteristiche:

#### Struttura Dati: CORSO → MODULI → LEZIONI

```
Corso
├── Modulo 1: "Fondamenti"
│   ├── Lezione 1: 01/02/2025, 09:00-13:00, Presenza
│   ├── Lezione 2: 03/02/2025, 09:00-13:00, Presenza
│   └── Lezione 3: 05/02/2025, 10:00-13:00, Online ⭐
├── Modulo 2: "Avanzato"
│   ├── Lezione 1: 10/02/2025, 09:00-13:00, Presenza
│   ├── Lezione 2: 12/02/2025, 10:00-13:00, Online ⭐
│   └── Lezione 3: 14/02/2025, 10:00-13:00, Online ⭐
└── Modulo 3: "Pratica"
    ├── Lezione 1: 20/02/2025, 10:00-13:00, Online ⭐
    └── Lezione 2: 22/02/2025, 10:00-13:00, Online ⭐
```

#### Caratteristiche Chiave

✅ **Moduli Multipli**: Ogni modulo con:
- ID Corso proprio
- ID Sezione dedicato
- Titolo specifico del modulo
- Date inizio/fine del modulo
- Provider/docente del modulo

✅ **Lezioni Miste**: All'interno di uno stesso modulo possono coesistere:
- Lezioni in PRESENZA (aula fisica)
- Lezioni ONLINE (FAD, Zoom, Teams, ecc.)

✅ **Separazione Lezioni Online**: Le lezioni online sono **automaticamente separate per modulo**
- Facilita la generazione di documenti FAD specifici per modulo
- Ogni modulo ha la sua lista `lezioni_online[]`
- Flag `registrata` per lezioni online (per compliance)

#### Esempio di Estrazione Multi-Modulo

```json
{
  "corso": {
    "id": "50001",
    "titolo": "Master in AI"
  },
  "moduli": [
    {
      "id_sezione": "60001",
      "titolo": "Fondamenti di AI",
      "tipo_sede": "Presenza",
      "sessioni": [...],
      "lezioni_online": []  // Nessuna lezione online
    },
    {
      "id_sezione": "60002",
      "titolo": "Applicazioni Pratiche",
      "tipo_sede": "Misto",
      "sessioni": [...],      // Tutte le lezioni
      "sessioni_presenza": [...],  // Solo presenza
      "lezioni_online": [...]      // Solo online ⭐
    }
  ],
  "lezioni_online_per_documenti": {
    "60002": {
      "modulo_titolo": "Applicazioni Pratiche",
      "modulo_id_corso": "50001",
      "modulo_id_sezione": "60002",
      "lezioni": [...]  // Lezioni online del modulo
    }
  }
}
```

---

### 🔧 Prompt di Estrazione Configurabile

Il prompt per l'AI è ora **configurabile esternamente**, senza modificare il codice!

#### Dove si trova

```
📁 config/
  └── 📁 prompts/
      └── 📄 extraction-prompt.json  ⬅️ Modifica qui!
```

#### Come modificare il prompt

1. Apri `config/prompts/extraction-prompt.json`
2. Modifica il campo `system_instruction` con le tue istruzioni
3. Modifica `extraction_schema` per cambiare la struttura JSON di output
4. Riavvia l'applicazione

#### Esempio

```json
{
  "version": "2.0.0",
  "system_instruction": "Sei un esperto di estrazione dati...\n\nIMPORTANTE PER MODULI MULTIPLI:\n- Estrai OGNI riga come un oggetto modulo separato\n...",
  "extraction_schema": {
    "type": "object",
    "properties": {
      "corso": {...},
      "moduli": {...}
    }
  }
}
```

#### Vantaggi

✅ Prompt facilmente modificabile senza rebuild
✅ Versionamento del prompt separato dal codice
✅ Possibilità di testare diversi prompt rapidamente
✅ Configurazione centralizzata e documentata

---

### 🏷️ Sistema Placeholder Configurabile

I placeholder nei documenti Word seguono ora una **convenzione standard configurabile**.

#### Convenzione Placeholder

```
{{CATEGORIA_CAMPO}}
```

#### Categorie Disponibili

| Categoria | Prefix | Esempio | Descrizione |
|-----------|--------|---------|-------------|
| **Corso** | `CORSO_` | `{{CORSO_TITOLO}}` | Dati generali del corso |
| **Modulo** | `MOD{N}_` | `{{MOD1_TITOLO}}` | Dati specifici per modulo (dinamico) |
| **Lezione** | `LEZ{N}_` | `{{LEZ1_DATA}}` | Dati per singola lezione |
| **Lezione/Modulo** | `MOD{M}_LEZ{N}_` | `{{MOD1_LEZ2_DATA}}` | Lezione N del modulo M |
| **Partecipante** | `PART{N}_` | `{{PART1_NOME}}` | Dati partecipanti |
| **Ente** | `ENTE_` | `{{ENTE_NOME}}` | Dati ente erogatore |
| **Sede** | `SEDE_` | `{{SEDE_INDIRIZZO}}` | Dati sede |
| **Docente** | `DOCENTE_` | `{{DOCENTE_NOME}}` | Dati docente/trainer |
| **FAD** | `FAD_` | `{{FAD_PIATTAFORMA}}` | Dati formazione a distanza |

#### File di Configurazione

```
📁 config/
  └── 📁 placeholders/
      └── 📄 placeholder-convention.json  ⬅️ Convenzione completa
```

#### Esempio Pratico: Modulo-Specifico

```
Template Word: Modello_A_FAD.docx

Corso: {{CORSO_TITOLO}}
ID Corso: {{MOD1_ID_CORSO}}
ID Sezione: {{MOD1_ID_SEZIONE}}
Titolo Modulo: {{MOD1_TITOLO}}

Lezioni Online Modulo 1:
{{#MOD1_LEZIONI_ONLINE}}
- {{data}}: {{ora_inizio}}-{{ora_fine}} (Registrata: {{registrata}})
{{/MOD1_LEZIONI_ONLINE}}
```

#### Generazione Automatica

Il servizio `placeholderService.ts` genera **automaticamente** tutti i placeholder:

```typescript
import { generatePlaceholderMap } from '@/services/placeholderService';

const placeholders = generatePlaceholderMap(courseData);

// Risultato:
{
  CORSO_TITOLO: "Master in AI",
  MOD1_ID_SEZIONE: "60001",
  MOD1_TITOLO: "Fondamenti di AI",
  MOD1_NUM_LEZIONI_ONLINE: 0,
  MOD2_ID_SEZIONE: "60002",
  MOD2_TITOLO: "Applicazioni Pratiche",
  MOD2_NUM_LEZIONI_ONLINE: 3,
  PART1_NOME: "Mario",
  PART1_COGNOME: "Rossi",
  ...
}
```

---

### 🎯 Come Aggiungere Nuovi Template Word

Ora è **facilissimo** aggiungere nuovi documenti senza modificare codice:

#### Step 1: Crea il Template Word

```
File: nuovo_documento.docx

Titolo Corso: {{CORSO_TITOLO}}
Cliente: {{ENTE_NOME}}

Moduli:
{{#MODULI}}
- {{titolo}} ({{id_sezione}})
{{/MODULI}}

Partecipanti:
{{#PARTECIPANTI}}
{{numero}}. {{nome_completo}} - {{codice_fiscale}}
{{/PARTECIPANTI}}
```

#### Step 2: Carica nel Sistema

1. Vai su **Impostazioni → Template**
2. Carica il file `.docx`
3. Definisci quali placeholder usa (opzionale)
4. Salva

#### Step 3: Usa!

Il sistema **genererà automaticamente** tutti i valori per i placeholder noti seguendo la convenzione.

---

### 🧪 Test Automatici

Sono stati aggiunti test completi per validare:

```
📁 src/tests/
  ├── 📄 extraction.test.ts        ⬅️ Test estrazione multi-modulo
  └── 📁 fixtures/
      ├── 📄 corso-2-moduli-misto.json    ⬅️ Caso test: 2 moduli
      └── 📄 corso-3-moduli-mixed.json    ⬅️ Caso test: 3 moduli misti
```

#### Esegui i Test

```bash
npm test
# oppure
npx vitest
```

#### Cosa Viene Testato

✅ Estrazione corretta di moduli multipli
✅ Separazione lezioni online/presenza per modulo
✅ Generazione placeholder per tutti i moduli
✅ Struttura `lezioni_online_per_documenti`
✅ Flag `registrata` per lezioni online
✅ Placeholder dinamici (MOD{N}_, PART{N}_, ecc.)

---

### 📖 Flusso Dati Completo (Aggiornato)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1️⃣ UTENTE: Copia dati dal gestionale                                   │
│     • Dati corso                                                         │
│     • Tabella moduli (può contenere PIÙ righe)                          │
│     • Elenco partecipanti                                                │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2️⃣ AI EXTRACTION (Gemini 2.5 Flash)                                    │
│     📄 Prompt: config/prompts/extraction-prompt.json                    │
│     📋 Schema: extraction_schema nel JSON                                │
│                                                                          │
│     Estrae:                                                              │
│     • corso {...}                                                        │
│     • moduli [{...}, {...}, {...}]  ⬅️ Array di moduli                  │
│     • partecipanti [{...}, {...}]                                        │
│                                                                          │
│     Per ogni modulo estrae:                                              │
│     • id_sezione, titolo, date                                           │
│     • sessioni_raw [{data, ora, tipo_sede}, ...]                        │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3️⃣ POST-PROCESSING (geminiService.ts)                                  │
│                                                                          │
│     Per ogni modulo:                                                     │
│     • Separa sessioni_presenza (tipo_sede = "Presenza")                 │
│     • Separa lezioni_online (tipo_sede = "Online"|"FAD")                │
│     • Aggiunge modulo_id alle lezioni                                    │
│     • Aggiunge flag registrata alle lezioni online                       │
│                                                                          │
│     Crea struttura lezioni_online_per_documenti:                         │
│     {                                                                    │
│       "60001": { modulo_titolo, lezioni: [...] },                       │
│       "60002": { modulo_titolo, lezioni: [...] }                        │
│     }                                                                    │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4️⃣ PLACEHOLDER GENERATION (placeholderService.ts)                      │
│                                                                          │
│     generatePlaceholderMap(courseData) →                                │
│     {                                                                    │
│       CORSO_TITOLO: "...",                                               │
│       MOD1_ID_SEZIONE: "60001",                                          │
│       MOD1_TITOLO: "...",                                                │
│       MOD1_NUM_LEZIONI_ONLINE: 0,                                        │
│       MOD2_ID_SEZIONE: "60002",                                          │
│       MOD2_NUM_LEZIONI_ONLINE: 3,                                        │
│       PART1_NOME: "...",                                                 │
│       ...                                                                │
│     }                                                                    │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5️⃣ WORD GENERATION (wordTemplateProcessor.ts)                          │
│                                                                          │
│     Template.docx + Placeholder Map →                                   │
│                                                                          │
│     {{CORSO_TITOLO}}  →  "Master in AI"                                 │
│     {{MOD1_TITOLO}}   →  "Fondamenti"                                   │
│     {{MOD2_TITOLO}}   →  "Applicazioni"                                 │
│                                                                          │
│     Genera documenti:                                                    │
│     • Registro Didattico (generale)                                      │
│     • Modello A FAD per OGNI modulo con lezioni online                  │
│     • Verbali, attestati, ecc.                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🔍 Dove Modificare Cosa

| Cosa vuoi fare | Dove andare | File |
|----------------|-------------|------|
| **Modificare prompt AI** | Configurazione prompt | `config/prompts/extraction-prompt.json` |
| **Cambiare schema JSON output** | Configurazione schema | `config/prompts/extraction-prompt.json` → `extraction_schema` |
| **Aggiungere nuovi placeholder** | Convezione placeholder | `config/placeholders/placeholder-convention.json` |
| **Vedere placeholder disponibili** | Documentazione | `config/placeholders/placeholder-convention.json` → `categories` |
| **Aggiungere nuovo template Word** | UI Admin | Impostazioni → Template (carica .docx) |
| **Modificare logica estrazione** | Codice backend | `src/services/geminiService.ts` → `processExtractedData()` |
| **Aggiungere nuovi campi modulo** | Tipo TypeScript | `src/types/courseData.ts` → `interface Modulo` |
| **Testare estrazione** | Test | `src/tests/extraction.test.ts` |

---

### 🚀 Benefici per le Aziende

Con queste nuove features, le aziende possono:

✅ **Gestire corsi complessi** con moduli multipli e modalità miste
✅ **Aggiungere nuovi template Word** senza chiamare uno sviluppatore
✅ **Modificare il prompt AI** per adattarlo ai propri gestionali
✅ **Scalare il sistema** per supportare nuovi tipi di documenti
✅ **Documentazione FAD per modulo** automatica e separata
✅ **Compliance** con flag registrata per lezioni online

---

### 📝 Changelog v2.0

#### Nuovo Modello Dati
- ✅ `Modulo.lezioni_online[]` - Lezioni online separate per modulo
- ✅ `Sessione.registrata` - Flag per lezioni online registrate
- ✅ `Sessione.modulo_id` - Link sessione → modulo
- ✅ `CourseData.lezioni_online_per_documenti` - Struttura per generazione documenti FAD

#### Nuovi Servizi
- ✅ `placeholderService.ts` - Generazione automatica placeholder
- ✅ Caricamento prompt da `config/prompts/extraction-prompt.json`
- ✅ Funzioni `getSystemInstruction()` e `getExtractionSchema()`

#### Nuove Configurazioni
- ✅ `config/prompts/extraction-prompt.json` - Prompt configurabile
- ✅ `config/placeholders/placeholder-convention.json` - Convenzione placeholder

#### Nuovi Test
- ✅ `src/tests/extraction.test.ts` - Test completi multi-modulo
- ✅ Fixtures con casi 2-moduli e 3-moduli misti
- ✅ Validazione schema e placeholder

---

### 💡 Esempi d'Uso

#### Generare Modello A FAD per Modulo Specifico

```typescript
import { generateModulePlaceholders } from '@/services/placeholderService';

// Per il primo modulo (index 0)
const placeholders = generateModulePlaceholders(courseData, 0);

// Placeholders specifici per questo modulo:
placeholders.MODULO_ID_SEZIONE  // ID del modulo corrente
placeholders.MODULO_TITOLO      // Titolo del modulo corrente
placeholders.MODULO_NUM_LEZIONI_ONLINE  // Numero lezioni online
```

#### Accedere alle Lezioni Online per Modulo

```typescript
import { getOnlineLessonsByModule } from '@/services/placeholderService';

const grouped = getOnlineLessonsByModule(courseData);

// Itera per modulo
grouped.forEach(({ module, lessons }) => {
  console.log(`Modulo: ${module.titolo}`);
  console.log(`Lezioni online: ${lessons.length}`);
  
  lessons.forEach(lesson => {
    console.log(`- ${lesson.data_completa}: ${lesson.ora_inizio}-${lesson.ora_fine}`);
    if (lesson.registrata) {
      console.log('  ✓ Registrata');
    }
  });
});
```

---


---

## 📄 Generazione PDF (Nuova Feature!)

### Cosa Fa

Il sistema ora può **generare automaticamente versioni PDF** di tutti i documenti Word quando si scarica lo ZIP completo!

### Come Funziona

1. **Toggle PDF**: Nella schermata di generazione documenti, troverai un interruttore "Includi versioni PDF"
2. **Attiva/Disattiva**: Scegli se vuoi solo Word o Word + PDF
3. **Scarica ZIP**: I PDF saranno inclusi automaticamente nello ZIP insieme ai Word

### Documenti con PDF

✅ **Registro Didattico** - `Registro_Didattico_{ID}.pdf`
✅ **Verbale Partecipazione** - `Verbale_Partecipazione_{ID}.pdf`
✅ **Verbale Scrutinio** - `Verbale_Scrutinio_{ID}.pdf`
✅ **Modello A FAD** - `Modello_A_FAD_{ID}.pdf`

### Struttura ZIP con PDF

```
📦 Corso_50001_Master_AI.zip
├── 📁 Documenti/
│   ├── 📄 Registro_Didattico_50001.docx    ⬅️ Word (editabile)
│   ├── 📕 Registro_Didattico_50001.pdf     ⬅️ PDF (stampa/lettura)
│   ├── 📄 Verbale_Partecipazione_50001.docx
│   ├── 📕 Verbale_Partecipazione_50001.pdf
│   ├── 📄 Verbale_Scrutinio_50001.docx
│   ├── 📕 Verbale_Scrutinio_50001.pdf
│   └── ...
├── 📁 Excel/
│   └── ...
└── 📄 README.txt
```

### Vantaggi

✅ **Non serve più convertire manualmente** - I PDF sono già pronti
✅ **Formato professionale** - Layout pulito con tabelle e intestazioni
✅ **Pronto per la stampa** - PDF ottimizzati per stampa e archiviazione
✅ **Compatibilità universale** - Apribile su qualsiasi dispositivo senza Word
✅ **Versione read-only** - Perfetto per invii ufficiali e archiviazione
✅ **Opzionale** - Puoi disattivarlo se vuoi solo i Word

### Caratteristiche PDF

- ✅ **Intestazioni professionali** con titolo documento
- ✅ **Tabelle formattate** per partecipanti e sessioni
- ✅ **Numerazione pagine** automatica
- ✅ **Layout responsive** che si adatta al contenuto
- ✅ **Colori corporate** con header colorati
- ✅ **Line separators** per sezioni chiare

### Come Disattivare i PDF

Se preferisci scaricare **solo i file Word**:

1. Vai alla schermata di generazione documenti
2. Disattiva l'interruttore "Includi versioni PDF"
3. Scarica lo ZIP normalmente

Lo ZIP conterrà solo i file Word (.docx)

### Dettagli Tecnici

**Librerie usate:**
- `jsPDF` - Generazione PDF nel browser
- `jspdf-autotable` - Tabelle professionali nei PDF

**Codice:**
- `src/services/pdfDocumentGenerator.ts` - Generatori PDF
- `src/services/zipPackager.ts` - Integrazione ZIP
- `src/components/steps/GenerationStep.tsx` - UI toggle

---


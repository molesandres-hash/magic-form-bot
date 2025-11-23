# 📅 Calendario Condizionalità - Placeholder Guide

## 🎯 Tipologia Documento
**Convocazione formale del beneficiario con calendario delle lezioni e informativa sulle sanzioni (NASPI, DIS-COLL, RDC)**

---

## 📋 Sostituzioni Effettuate

### 1. **DATI PARTECIPANTE** (2 occorrenze identiche)

Questo documento mostra i dati del partecipante 2 volte:
- Una volta all'inizio nella convocazione
- Una volta nella sezione "Servizi alla formazione"

| Campo | Placeholder | Disponibile |
|-------|-------------|-------------|
| Nome | `{{PARTECIPANTE 1 NOME}}` | ✅ |
| Cognome | `{{PARTECIPANTE 1 COGNOME}}` | ✅ |
| Codice Fiscale | `{{PARTECIPANTE 1 CF}}` | ✅ |

**Risultato:**
```
Nome: {{PARTECIPANTE 1 NOME}}  Cognome: {{PARTECIPANTE 1 COGNOME}}  Codice Fiscale: {{PARTECIPANTE 1 CF}}
```

---

### 2. **DATI CORSO**

| Campo | Placeholder | Disponibile |
|-------|-------------|-------------|
| Titolo percorso | `{{NOME_CORSO}}` | ✅ |
| ID Corso | `{{ID_CORSO}}` | ✅ |
| ID Sezione | `{{ID_SEZIONE}}` | ✅ |
| Ente erogatore | `{{ENTE_NOME}}` | ✅ |
| ID Ente | `{{ID_ENTE}}` | ⚠️ Nuovo |
| Sede corso | `{{SEDE_ACCREDITATA}} - {{SEDE_INDIRIZZO}}` | ✅ |
| Periodo | `dal {{DATA_INIZIO}} al {{DATA_FINE}}` | ✅ |
| Totale ore | `{{ORE_TOTALI}}` | ✅ |

**Esempio output:**
```
TITOLO PERCORSO: Inglese Base
id. corso: 52674    id. sezione: 148870
DENOMINAZIONE SOGGETTO EROGATORE: AK Group s.r.l.
ID SOGGETTO EROGATORE: 12345
SEDE DI SVOLGIMENTO DEL CORSO: Sede Milano - Via Roma 1, Milano
PERIODO: dal 22/09/2025 al 30/10/2025
TOTALE ORE: 90
```

---

### 3. **CONTATTO SUPERVISORE**

| Campo | Formula | Disponibile |
|-------|---------|-------------|
| Email supervisore | `{{SUPERVISORE_NOME}}.{{SUPERVISORE_COGNOME}}@akgitalia.it` | ✅ |

**Formula Automatica:** L'email viene generata automaticamente dal nome e cognome del supervisore.

**Esempio:**
- Supervisore: Grazia Trainito
- Email generata: `grazia.trainito@akgitalia.it`

**Nota:** Il sistema deve convertire nome e cognome in minuscolo e inserire il punto tra i due.

---

### 4. **LUOGO E DATA DOCUMENTO**

| Campo | Placeholder | Note |
|-------|-------------|------|
| Luogo, Data | `{{VERBALE_LUOGO}}, {{DATA_INIZIO}}` | Data inizio corso |

**Risultato:** `Milano, 22/09/2025`

---

### 5. **TABELLE CON FIRME** (Tabella 1 e 3)

Ci sono 2 tabelle identiche (all'inizio e alla fine) con firme:

| Colonna | Placeholder |
|---------|-------------|
| Ente Formativo | `{{RESP_CERT_NOME_COMPLETO}}` |
| Persona beneficiaria | `{{PARTECIPANTE 1}}` |

**Risultato:**
```
┌────────────────────────────────┬───────────────────────────────────────┐
│ Ente Formativo                 │ Persona beneficiaria                  │
│ {{RESP_CERT_NOME_COMPLETO}}    │ {{PARTECIPANTE 1}}                    │
│                                │ (Firma per ricevuta)                  │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 📊 TABELLA 2: CALENDARIO LEZIONI (Loop) ⭐

Questa è la **tabella più importante** del documento. Usa un **loop per generare una riga per ogni sessione**.

### Struttura della Tabella

```
┌──────────┬──────────┬──────────────┬──────────┬──────────┐
│   Data   │ Mattina  │  Pomeriggio  │ Tot. ore │ Docente  │
├──────────┼──────────┼──────────────┼──────────┼──────────┤
{#SESSIONI}
│ {{data}} │{{ora_mattina}}│{{ora_pomeriggio}}│{{durata}}│{{NOME_DOCENTE}}│
{/SESSIONI}
└──────────┴──────────┴──────────────┴──────────┴──────────┘
```

### Placeholder nella Tabella

| Colonna | Placeholder | Descrizione | Esempio |
|---------|-------------|-------------|---------|
| Data | `{{data}}` | Data della lezione | "22/09/2025" |
| Mattina | `{{ora_mattina}}` | Orario mattina | "9:00-13:00" |
| Pomeriggio | `{{ora_pomeriggio}}` | Orario pomeriggio | "14:00-18:00" |
| Tot. ore | `{{durata}}` | Durata in ore | "4" o "8" |
| Docente | `{{NOME_DOCENTE}}` | Nome docente | "Grazia Trainito" |

### Note sui Placeholder Orari

**Opzione 1: Orari separati (mattina/pomeriggio)**
Il manuale ha `{{ora_inizio}}` e `{{ora_fine}}`, ma questa tabella divide mattina/pomeriggio.

**Suggerimenti:**
- Se la lezione è **solo mattina**: `{{ora_mattina}}` = "9:00-13:00", `{{ora_pomeriggio}}` = "-"
- Se la lezione è **solo pomeriggio**: `{{ora_mattina}}` = "-", `{{ora_pomeriggio}}` = "14:00-18:00"
- Se la lezione è **full day**: `{{ora_mattina}}` = "9:00-13:00", `{{ora_pomeriggio}}` = "14:00-18:00"

**Opzione 2: Usa orario completo**
Semplifica usando:
- Mattina: `{{ora_inizio}}-{{ora_fine}}` se prima delle 14:00
- Pomeriggio: `{{ora_inizio}}-{{ora_fine}}` se dopo le 14:00

---

## 🔄 Esempio di Dati per la Tabella

### Dati Input

```javascript
corso = {
  nome: "Inglese Base",
  sessioni: [
    { 
      data: "22/09/2025", 
      ora_inizio: "09:00", 
      ora_fine: "13:00",
      durata: "4",
      turno: "mattina" // Determina quale colonna compilare
    },
    { 
      data: "23/09/2025", 
      ora_inizio: "14:00", 
      ora_fine: "18:00",
      durata: "4",
      turno: "pomeriggio"
    },
    { 
      data: "24/09/2025", 
      ora_inizio: "09:00", 
      ora_fine: "18:00",
      durata: "8",
      turno: "full-day"
    }
  ],
  docente: "Grazia Trainito"
}
```

### Output nella Tabella

```
┌────────────┬──────────────┬──────────────┬──────────┬─────────────────┐
│    Data    │   Mattina    │  Pomeriggio  │ Tot. ore │    Docente      │
├────────────┼──────────────┼──────────────┼──────────┼─────────────────┤
│ 22/09/2025 │ 9:00-13:00   │      -       │    4     │ Grazia Trainito │
│ 23/09/2025 │      -       │ 14:00-18:00  │    4     │ Grazia Trainito │
│ 24/09/2025 │ 9:00-13:00   │ 14:00-18:00  │    8     │ Grazia Trainito │
└────────────┴──────────────┴──────────────┴──────────┴─────────────────┘
```

---

## 🎯 Placeholder Utilizzati - Riepilogo

### Dal Manuale Esistente ✅

| Placeholder | Descrizione | Disponibile |
|-------------|-------------|-------------|
| `{{PARTECIPANTE 1 NOME}}` | Nome partecipante | ✅ |
| `{{PARTECIPANTE 1 COGNOME}}` | Cognome partecipante | ✅ |
| `{{PARTECIPANTE 1 CF}}` | Codice fiscale | ✅ |
| `{{PARTECIPANTE 1}}` | Nome completo | ✅ |
| `{{NOME_CORSO}}` | Titolo corso | ✅ |
| `{{ID_CORSO}}` | ID corso | ✅ |
| `{{ID_SEZIONE}}` | ID sezione | ✅ |
| `{{ENTE_NOME}}` | Nome ente | ✅ |
| `{{SEDE_ACCREDITATA}}` | Nome sede | ✅ |
| `{{SEDE_INDIRIZZO}}` | Indirizzo sede | ✅ |
| `{{DATA_INIZIO}}` | Data inizio corso | ✅ |
| `{{DATA_FINE}}` | Data fine corso | ✅ |
| `{{ORE_TOTALI}}` | Ore totali corso | ✅ |
| `{{VERBALE_LUOGO}}` | Città/sede | ✅ |
| `{{NOME_DOCENTE}}` | Nome docente | ✅ |
| `{{RESP_CERT_NOME_COMPLETO}}` | Responsabile certificazione | ✅ |

### Dal Loop Sessioni ✅

| Placeholder | Dal Loop | Descrizione |
|-------------|----------|-------------|
| `{{data}}` | `{#SESSIONI}` | Data lezione |
| `{{durata}}` | `{#SESSIONI}` | Durata in ore |

### Da Creare/Implementare ⚠️

| Placeholder | Descrizione | Come Implementare |
|-------------|-------------|-------------------|
| `{{ID_ENTE}}` | ID univoco ente | Aggiungi ai dati ente |
| `{{ora_mattina}}` | Orario mattina | Logica basata su `{{ora_inizio}}`/`{{ora_fine}}` |
| `{{ora_pomeriggio}}` | Orario pomeriggio | Logica basata su `{{ora_inizio}}`/`{{ora_fine}}` |

---

## 💡 Logica per Orari Mattina/Pomeriggio

### Opzione A: Campo Turno (Consigliata)

Aggiungi un campo `turno` ai dati della sessione:

```javascript
sessione = {
  data: "22/09/2025",
  ora_inizio: "09:00",
  ora_fine: "13:00",
  durata: "4",
  turno: "mattina" // o "pomeriggio" o "full-day"
}

// Nel template:
if (turno === "mattina") {
  ora_mattina = `${ora_inizio}-${ora_fine}`
  ora_pomeriggio = "-"
} else if (turno === "pomeriggio") {
  ora_mattina = "-"
  ora_pomeriggio = `${ora_inizio}-${ora_fine}`
} else if (turno === "full-day") {
  ora_mattina = "9:00-13:00"
  ora_pomeriggio = "14:00-18:00"
}
```

### Opzione B: Calcolo Automatico

Calcola automaticamente dal `{{ora_inizio}}`:

```javascript
if (parseInt(ora_inizio.split(':')[0]) < 14) {
  // È mattina
  ora_mattina = `${ora_inizio}-${ora_fine}`
  ora_pomeriggio = "-"
} else {
  // È pomeriggio
  ora_mattina = "-"
  ora_pomeriggio = `${ora_inizio}-${ora_fine}`
}
```

---

## 📝 Struttura Completa del Documento

```text
REALIZZATO CON IL SOSTEGNO DI [Logo/Header]

Raccomandata a mano (convocazione formale)

CONVOCAZIONE DEL BENEFICIARIO PER L'EROGAZIONE DEI SERVIZI PER IL LAVORO E
INFORMATIVA SULLE SANZIONI (NASPI, DIS-COLL, RDC)

Gentile

Nome: {{PARTECIPANTE 1 NOME}}  Cognome: {{PARTECIPANTE 1 COGNOME}}  
Codice Fiscale: {{PARTECIPANTE 1 CF}}

[... testo standard ...]

In caso di assenza, comunicare a: {{SUPERVISORE_EMAIL}}

[... testo sulle sanzioni ...]

┌────────────────────────────────┬───────────────────────────────────────┐
│ Ente Formativo                 │ Persona beneficiaria                  │
│ {{RESP_CERT_NOME_COMPLETO}}    │ {{PARTECIPANTE 1}}                    │
└────────────────────────────────┴───────────────────────────────────────┘

SERVIZI ALLA FORMAZIONE ATTIVATI NELLA DOTE GOL, a favore di:

Nome: {{PARTECIPANTE 1 NOME}}  Cognome: {{PARTECIPANTE 1 COGNOME}}  
Codice Fiscale: {{PARTECIPANTE 1 CF}}

TITOLO PERCORSO: {{NOME_CORSO}}
id. corso: {{ID_CORSO}}    id. sezione: {{ID_SEZIONE}}
DENOMINAZIONE SOGGETTO EROGATORE: {{ENTE_NOME}}
ID SOGGETTO EROGATORE: {{ID_ENTE}}
SEDE DI SVOLGIMENTO DEL CORSO: {{SEDE_ACCREDITATA}} - {{SEDE_INDIRIZZO}}
PERIODO: dal {{DATA_INIZIO}} al {{DATA_FINE}}

┌────────────┬──────────────┬──────────────┬──────────┬─────────────────┐
│    Data    │   Mattina    │  Pomeriggio  │ Tot. ore │    Docente      │
├────────────┼──────────────┼──────────────┼──────────┼─────────────────┤
{#SESSIONI}
│  {{data}}  │{{ora_mattina}}│{{ora_pomeriggio}}│{{durata}}│{{NOME_DOCENTE}}│
{/SESSIONI}
└────────────┴──────────────┴──────────────┴──────────┴─────────────────┘

TOTALE ORE: {{ORE_TOTALI}}
LE DATE POTRANNO SUBIRE VARIAZIONI IN FUNZIONE DELL'ORGANIZZAZIONE DELL'ENTE

{{VERBALE_LUOGO}}, {{DATA_INIZIO}}

┌────────────────────────────────┬───────────────────────────────────────┐
│ Ente Formativo                 │ Persona beneficiaria                  │
│ {{RESP_CERT_NOME_COMPLETO}}    │ {{PARTECIPANTE 1}}                    │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## ✅ Checklist Validazione

- [x] Dati partecipante sostituiti (2 occorrenze)
- [x] Dati corso completi
- [x] Periodo (data inizio/fine) inserito
- [x] Sede con indirizzo
- [x] Tabella calendario con loop `{#SESSIONI}`
- [x] Firme ente e partecipante
- [x] ⚠️ Email supervisore da implementare
- [x] ⚠️ Orari mattina/pomeriggio richiedono logica aggiuntiva

---

## 🚀 Implementazione Codice

```javascript
function generaCalendarioCondizionalita(corso, partecipante) {
  
  // Prepara dati sessioni con orari mattina/pomeriggio
  const sessioniConOrari = corso.sessioni.map(sessione => {
    const oraInizioNum = parseInt(sessione.ora_inizio.split(':')[0]);
    
    let ora_mattina = "-";
    let ora_pomeriggio = "-";
    
    if (oraInizioNum < 14) {
      // Lezione mattina
      ora_mattina = `${sessione.ora_inizio}-${sessione.ora_fine}`;
    } else if (oraInizioNum >= 14) {
      // Lezione pomeriggio
      ora_pomeriggio = `${sessione.ora_inizio}-${sessione.ora_fine}`;
    }
    
    // Full day (8+ ore)
    if (sessione.durata >= 8) {
      ora_mattina = "9:00-13:00";
      ora_pomeriggio = "14:00-18:00";
    }
    
    return {
      data: sessione.data,
      ora_mattina: ora_mattina,
      ora_pomeriggio: ora_pomeriggio,
      durata: sessione.durata,
      NOME_DOCENTE: corso.docente
    };
  });
  
  const data = {
    // Dati partecipante
    'PARTECIPANTE 1 NOME': partecipante.nome,
    'PARTECIPANTE 1 COGNOME': partecipante.cognome,
    'PARTECIPANTE 1 CF': partecipante.codice_fiscale,
    'PARTECIPANTE 1': `${partecipante.nome} ${partecipante.cognome}`,
    
    // Dati corso
    NOME_CORSO: corso.nome,
    ID_CORSO: corso.id_corso,
    ID_SEZIONE: corso.id_sezione,
    ENTE_NOME: corso.ente.nome,
    ID_ENTE: corso.ente.id,
    SEDE_ACCREDITATA: corso.sede.nome,
    SEDE_INDIRIZZO: corso.sede.indirizzo,
    DATA_INIZIO: corso.data_inizio,
    DATA_FINE: corso.data_fine,
    ORE_TOTALI: corso.ore_totali,
    
    // Altri dati
    VERBALE_LUOGO: corso.sede.citta,
    NOME_DOCENTE: corso.docente,
    RESP_CERT_NOME_COMPLETO: corso.responsabile,
    
    // Email supervisore - GENERATA AUTOMATICAMENTE
    SUPERVISORE_NOME: corso.supervisore.nome.toLowerCase(),
    SUPERVISORE_COGNOME: corso.supervisore.cognome.toLowerCase(),
    // Risultato: grazia.trainito@akgitalia.it
    
    // Array sessioni per loop tabella
    SESSIONI: sessioniConOrari
  };
  
  return data;
}
```

---

**Documento generato il:** 23/11/2025  
**File output:** `Calendario_condizionalita_con_placeholder.docx`  
**Feature principale:** Loop `{#SESSIONI}` nella tabella calendario

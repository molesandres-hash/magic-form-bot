# 📧 Comunicazione Evento - Versione PER SESSIONE

## 🎯 Modalità di Generazione
**Un documento per ogni giorno di lezione** - I placeholder utilizzano i dati della sessione specifica.

---

## 📋 Sostituzioni Effettuate (Versione Sessione)

### 1. **MITTENTE**
| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{ENTE_NOME}}` | Nome ente accreditato | "AK Group s.r.l." |

---

### 2. **DATI PARTECIPANTE ASSENTE**
| Campo | Placeholder | Disponibile | Esempio |
|-------|-------------|-------------|---------|
| Nome | `{{PARTECIPANTE 1 NOME}}` | ✅ | "LICI" |
| Cognome | `{{PARTECIPANTE 1 COGNOME}}` | ✅ | "EVILDA" |
| CF | `{{PARTECIPANTE 1 CF}}` | ✅ | "LCIXXXXX..." |

**Nota:** Usa `PARTECIPANTE 1` perché la comunicazione riguarda un singolo utente assente.

---

### 3. **DATI SESSIONE/LEZIONE** ⭐ NOVITÀ

Questi placeholder vengono presi **dalla sessione specifica** per cui generi il documento:

| Campo | Placeholder | Loop Sessioni | Esempio |
|-------|-------------|---------------|---------|
| Data lezione | `{{data}}` | ✅ Disponibile | "22/09/2025" |
| Ora inizio | `{{ora_inizio}}` | ✅ Disponibile | "14:00" |
| Ora fine | `{{ora_fine}}` | ✅ Disponibile | "18:00" |
| Luogo | `{{luogo}}` | ✅ Disponibile | "Online" o "Sede Milano" |

**Risultato nel documento:**
```
presso la sede: {{luogo}}
per il giorno {{data}} alle ore {{ora_inizio}}
```

**Output esempio:**
```
presso la sede: Online
per il giorno 22/09/2025 alle ore 14:00
```

---

### 4. **DATA COMUNICAZIONE E FIRMA**
| Campo | Placeholder | Note |
|-------|-------------|------|
| Data documento | `{{data}}` | Stessa data della lezione |
| Firma | `{{RESP_CERT_NOME_COMPLETO}}` | Nome responsabile certificazione |

**Alternativa per data comunicazione:**
- Se vuoi la data di "oggi" (quando generi il doc): usa una variabile `{{DATA_OGGI}}`
- Se vuoi la data della lezione: usa `{{data}}` (come ora)

---

## 🔄 Logica di Generazione

### Scenario: Corso con 5 lezioni

```javascript
// Dati corso
corso = {
  nome: "Inglese Base",
  sessioni: [
    { data: "22/09/2025", ora_inizio: "14:00", ora_fine: "18:00", luogo: "Online" },
    { data: "23/09/2025", ora_inizio: "14:00", ora_fine: "18:00", luogo: "Online" },
    { data: "24/09/2025", ora_inizio: "09:00", ora_fine: "13:00", luogo: "Sede Milano" },
    { data: "25/09/2025", ora_inizio: "14:00", ora_fine: "18:00", luogo: "Online" },
    { data: "26/09/2025", ora_inizio: "14:00", ora_fine: "18:00", luogo: "Online" }
  ],
  partecipanti: [
    { nome: "LICI", cognome: "EVILDA", cf: "LCI..." },
    { nome: "LOMBARDO", cognome: "EGLE", cf: "LMB..." }
  ]
}

// GENERA 5 DOCUMENTI (uno per sessione)
corso.sessioni.forEach((sessione, index) => {
  // File: Comunicazione_evento_22_09_2025.docx
  // File: Comunicazione_evento_23_09_2025.docx
  // File: Comunicazione_evento_24_09_2025.docx
  // ecc.
  
  generateDocument({
    ENTE_NOME: "AK Group s.r.l.",
    PARTECIPANTE_1_NOME: "LICI",
    PARTECIPANTE_1_COGNOME: "EVILDA",
    PARTECIPANTE_1_CF: "LCI...",
    
    // Dati dalla sessione specifica
    data: sessione.data,
    ora_inizio: sessione.ora_inizio,
    ora_fine: sessione.ora_fine,
    luogo: sessione.luogo,
    
    RESP_CERT_NOME_COMPLETO: "Gianfranco Torre"
  });
});
```

---

## 📁 Struttura Output Files

```
Comunicazioni_Evento/
├── Comunicazione_evento_22_09_2025_LICI_EVILDA.docx
├── Comunicazione_evento_23_09_2025_LICI_EVILDA.docx
├── Comunicazione_evento_24_09_2025_LICI_EVILDA.docx
├── Comunicazione_evento_25_09_2025_LICI_EVILDA.docx
└── Comunicazione_evento_26_09_2025_LICI_EVILDA.docx
```

**Naming convention suggerita:**
```
Comunicazione_evento_{DATA}_{COGNOME}_{NOME}.docx
```

---

## 🎯 Placeholder Finali Utilizzati

### Dal Manuale Esistente ✅
| Placeholder | Da dove viene | Esempio |
|-------------|---------------|---------|
| `{{ENTE_NOME}}` | Dati Ente | "AK Group s.r.l." |
| `{{PARTECIPANTE 1 NOME}}` | Lista partecipanti | "LICI" |
| `{{PARTECIPANTE 1 COGNOME}}` | Lista partecipanti | "EVILDA" |
| `{{PARTECIPANTE 1 CF}}` | Lista partecipanti | "LCI..." |
| `{{RESP_CERT_NOME_COMPLETO}}` | Responsabile certificazione | "Gianfranco Torre" |

### Dal Loop Sessioni ✅
| Placeholder | Da dove viene | Esempio |
|-------------|---------------|---------|
| `{{data}}` | Loop `{#SESSIONI}` | "22/09/2025" |
| `{{ora_inizio}}` | Loop `{#SESSIONI}` | "14:00" |
| `{{ora_fine}}` | Loop `{#SESSIONI}` | "18:00" |
| `{{luogo}}` | Loop `{#SESSIONI}` | "Online" |

---

## 💡 Struttura Documento Finale

```text
Mittente: {{ENTE_NOME}}

Al Centro per l'Impiego (CPI titolare della SAP)

Oggetto: Comunicazione al CPI di competenza della mancata presentazione/partecipazione 
dell'utente percettore di sostegno al reddito all'appuntamento fissato dall'Operatore 
accreditato (ex Circolare ANPAL n.1/2022)

Con la presente si comunica che l'utente:

Nome: {{PARTECIPANTE 1 NOME}}
Cognome: {{PARTECIPANTE 1 COGNOME}}
Codice Fiscale: {{PARTECIPANTE 1 CF}}

[... resto del documento ...]

presso la sede: {{luogo}}
per il giorno {{data}} alle ore {{ora_inizio}}

[... resto del documento ...]

Data: {{data}}    Firma: {{RESP_CERT_NOME_COMPLETO}}
```

---

## ✅ Vantaggi di Questo Approccio

1. **Un file per giorno** = più facile da archiviare e gestire
2. **Tutti i placeholder disponibili** = no bisogno di creare nuovi campi
3. **Dati sessione automatici** = data, ora e luogo dalla lista lezioni
4. **Scalabile** = funziona per corsi con 5 o 50 lezioni

---

## 🚀 Come Implementare nel Codice

```javascript
// Pseudo-codice generazione
function generaComunicazioniEvento(corso) {
  const documenti = [];
  
  // Per ogni sessione del corso
  corso.sessioni.forEach(sessione => {
    
    // Per ogni partecipante assente in quella sessione
    corso.partecipanti.forEach(partecipante => {
      
      const data = {
        ENTE_NOME: corso.ente,
        'PARTECIPANTE 1 NOME': partecipante.nome,
        'PARTECIPANTE 1 COGNOME': partecipante.cognome,
        'PARTECIPANTE 1 CF': partecipante.cf,
        
        // Dalla sessione
        data: sessione.data,
        ora_inizio: sessione.ora_inizio,
        ora_fine: sessione.ora_fine,
        luogo: sessione.luogo,
        
        RESP_CERT_NOME_COMPLETO: corso.responsabile
      };
      
      const filename = `Comunicazione_evento_${sessione.data}_${partecipante.cognome}_${partecipante.nome}.docx`;
      
      documenti.push({
        filename: filename,
        data: data
      });
    });
  });
  
  return documenti;
}
```

---

## ⚠️ Note Importanti

1. **Data comunicazione = Data lezione:** Nel documento, la data della comunicazione è la stessa della lezione. Se vuoi una data diversa, aggiungi un placeholder `{{DATA_COMUNICAZIONE}}`.

2. **Checkbox da gestire manualmente:** I checkbox per tipo sostegno, modalità, esito vanno ancora gestiti con logica condizionale.

3. **Un partecipante alla volta:** Ogni documento riguarda UN solo partecipante assente. Se più partecipanti sono assenti nello stesso giorno, genera documenti separati.

4. **Requisito 3 giorni:** Ricorda che la comunicazione deve essere inviata entro 3 giorni dalla data della lezione.

---

**Documento generato il:** 23/11/2025  
**File output:** `Comunicazione_evento_SESSIONE.docx`  
**Modalità:** Un documento per ogni giorno di lezione

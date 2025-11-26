# 📜 Sostituzioni Placeholder - Attestato di Partecipazione

## 🎯 Riepilogo Sostituzioni Effettuate

### ⚠️ IMPORTANTE: Data di Nascita
**Il placeholder per la data di nascita NON è disponibile nel manuale.**
Ho creato **DUE versioni** del documento:

1. **Attestato_con_placeholder.docx** - Mantiene `{{DATA_NASCITA}}` e `{{LUOGO_NASCITA}}` (da implementare)
2. **Attestato_SENZA_datanascita.docx** - Rimuove completamente la riga con la data di nascita ✅ **CONSIGLIATO**

---

## 📋 Sostituzioni Effettuate

### 1. **PARTECIPANTE**
| Testo Originale | Placeholder | Note |
|-----------------|-------------|------|
| `Emilia Perrone` | `{{NOME_PARTECIPANTE}}` | Nome completo del partecipante |
| `PRRMLE61T63Z602G` | `{{CODICE_FISCALE_PARTECIPANTE}}` | ⚠️ Usare `{{PARTECIPANTE 1 CF}}` se per singolo partecipante |

**Placeholder Alternativi Disponibili:**
- `{{NOME_PARTECIPANTE}}` - Per certificati generici
- `{{PARTECIPANTE 1}}` - Nome completo del 1° partecipante
- `{{PARTECIPANTE 1 NOME}}` + `{{PARTECIPANTE 1 COGNOME}}` - Nome e cognome separati
- `{{PARTECIPANTE 1 CF}}` - Codice fiscale del 1° partecipante

---

### 2. **DATI NASCITA** ⚠️

#### Versione 1 (CON data di nascita - richiede implementazione)
| Testo Originale | Placeholder | Disponibile? |
|-----------------|-------------|--------------|
| `Nata a Brazile` | `{{LUOGO_NASCITA}}` | ❌ NON DISPONIBILE |
| `il 23.12.1961` | `{{DATA_NASCITA}}` | ❌ NON DISPONIBILE |

#### Versione 2 (SENZA data di nascita - CONSIGLIATA) ✅
**Riga originale:**
```
Nata a Brazile il 23.12.1961, Codice fiscale PRRMLE61T63Z602G
```

**Riga modificata:**
```
Codice fiscale {{CODICE_FISCALE_PARTECIPANTE}}
```

---

### 3. **DATI CORSO**
| Campo | Testo Originale | Placeholder |
|-------|-----------------|-------------|
| Nome corso | `Inglese Base (90hr)` | `{{NOME_CORSO}}` |
| Monte ore | `90hr` | `{{ORE_TOTALI}}` |

**Riga completa:**
- Prima: `Monte ore frequentato: 90hr`
- Dopo: `Monte ore frequentato: {{ORE_TOTALI}}`

---

### 4. **ENTE EROGATORE**
| Testo Originale | Placeholder |
|-----------------|-------------|
| `Maximus Italia` | `{{ENTE_NOME}}` |

**Riga completa:**
- Prima: `Erogato da Maximus Italia nell'ambito del Garanzia di Occupabilità die Lavoratori`
- Dopo: `Erogato da {{ENTE_NOME}} nell'ambito del Garanzia di Occupabilità dei Lavoratori`

*(Nota: corretto anche "die" → "dei")*

---

### 5. **PROGRAMMA/CONTESTO** (Opzionale)
Il testo "Garanzia di Occupabilità dei Lavoratori" può essere:
- **Opzione A:** Lasciato fisso (come ora)
- **Opzione B:** Sostituito con `{{NOME_PROGRAMMA}}` se vuoi renderlo dinamico

---

### 6. **LUOGO E DATA ATTESTATO**
| Testo Originale | Placeholder |
|-----------------|-------------|
| `Milano, 23/02/2022` | `{{VERBALE_LUOGO}}, {{DATA_FINE}}` |

**Note:**
- `{{VERBALE_LUOGO}}` = Sede dove si svolgono le lezioni (es. "Milano")
- `{{DATA_FINE}}` = Ultimo giorno del corso (data finale automatica)

---

## 🔄 Mappatura Completa dei Placeholder

### Placeholder Utilizzati dall'Attestato

| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{NOME_PARTECIPANTE}}` | Nome completo partecipante | "Emilia Perrone" |
| `{{CODICE_FISCALE_PARTECIPANTE}}` | Codice fiscale | "PRRMLE61T63Z602G" |
| `{{NOME_CORSO}}` | Titolo del corso | "Inglese Base" |
| `{{ORE_TOTALI}}` | Ore totali del corso | "90" |
| `{{ENTE_NOME}}` | Nome ente erogatore | "AK Group s.r.l." |
| `{{VERBALE_LUOGO}}` | Città/sede | "Milano" |
| `{{DATA_FINE}}` | Data fine corso | "23/02/2022" |

### Placeholder NON Disponibili (da implementare se necessario)
| Placeholder | Descrizione | Alternativa |
|-------------|-------------|-------------|
| `{{LUOGO_NASCITA}}` | Luogo di nascita | ❌ Rimuovere la riga |
| `{{DATA_NASCITA}}` | Data di nascita | ❌ Rimuovere la riga |
| `{{NOME_PROGRAMMA}}` | Nome programma formativo | Testo fisso: "GOL" |

---

## 🎯 Esempio di Dati per Generazione

```javascript
{
  NOME_PARTECIPANTE: "Emilia Perrone",
  CODICE_FISCALE_PARTECIPANTE: "PRRMLE61T63Z602G",
  
  NOME_CORSO: "Inglese Base",
  ORE_TOTALI: "90",
  
  ENTE_NOME: "Maximus Italia",
  
  VERBALE_LUOGO: "Milano",
  DATA_FINE: "23/02/2022"
}
```

---

## 📝 Confronto Versioni

### Versione 1: Con Data di Nascita (richiede implementazione)
```
                            Attestato di partecipazione
                                    {{NOME_PARTECIPANTE}}

Nata a {{LUOGO_NASCITA}} il {{DATA_NASCITA}}, Codice fiscale {{CODICE_FISCALE_PARTECIPANTE}}
```
⚠️ Richiede l'aggiunta di nuovi placeholder al sistema

---

### Versione 2: Senza Data di Nascita (CONSIGLIATA) ✅
```
                            Attestato di partecipazione
                                    {{NOME_PARTECIPANTE}}

Codice fiscale {{CODICE_FISCALE_PARTECIPANTE}}
```
✅ Usa solo placeholder già disponibili

---

## 💡 Suggerimenti

### Per Generazione Singola (Un attestato per partecipante)
Usa i placeholder posizionali se generi un attestato alla volta:
```
{{PARTECIPANTE 1}}
{{PARTECIPANTE 1 CF}}
```

### Per Generazione Multipla (Loop su tutti i partecipanti)
Se vuoi generare un attestato per ogni partecipante in automatico, usa un loop:
```
{#PARTECIPANTI}
    Nome: {{nome_completo}}
    CF: {{codice_fiscale}}
{/PARTECIPANTI}
```

---

## ✅ Checklist Validazione

- [x] Nome partecipante sostituito
- [x] Codice fiscale sostituito
- [x] Nome corso sostituito
- [x] Monte ore sostituito
- [x] Ente erogatore sostituito
- [x] Luogo e data attestato sostituiti
- [x] Correzione ortografica ("die" → "dei")
- [x] ⚠️ Data di nascita RIMOSSA (non disponibile nel sistema)

---

## 🎨 Struttura Finale Attestato

```text
                    Attestato di partecipazione

                        {{NOME_PARTECIPANTE}}

Codice fiscale {{CODICE_FISCALE_PARTECIPANTE}}

ha partecipato con profitto al corso di formazione

{{NOME_CORSO}}

Monte ore frequentato: {{ORE_TOTALI}}

Erogato da {{ENTE_NOME}} nell'ambito del Garanzia di Occupabilità dei Lavoratori

{{VERBALE_LUOGO}}, {{DATA_FINE}}
```

---

**Documento generato il:** 23/11/2025  
**File output:**
- `Attestato_con_placeholder.docx` (versione con data nascita da implementare)
- `Attestato_SENZA_datanascita.docx` ✅ **VERSIONE CONSIGLIATA**

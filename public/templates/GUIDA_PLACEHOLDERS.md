# 📋 Guida ai Placeholder per i Template Word

Questa cartella contiene i template Word che verranno utilizzati per generare i documenti.
Il sistema riconosce automaticamente i file `.docx` presenti in questa cartella.

## 📝 Come creare un nuovo template

1. Crea un documento Word.
2. Inserisci i **placeholder** dove vuoi che appaiano i dati estratti.
3. Salva il file in questa cartella (`public/templates`).
4. Esegui il comando `npm run scan:templates` per aggiornare la lista nel sistema.

## 🔑 Placeholder Disponibili

Ecco la lista delle variabili che puoi utilizzare nel tuo documento Word.
Il sistema sostituirà `{{NOME_VARIABILE}}` con il valore corrispondente.

### Dati Generali Corso
| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{NOME_CORSO}}` | Il titolo del corso | "Intelligenza Artificiale" |
| `{{ID_CORSO}}` | Il codice identificativo del corso | "21342" |
| `{{ID_SEZIONE}}` | Il codice identificativo della sezione | "22639" |
| `{{DATA_INIZIO}}` | La data della prima lezione | "22/09/2025" |
| `{{DATA_FINE}}` | La data dell'ultima lezione | "30/10/2025" |
| `{{ORE_TOTALI}}` | Numero totale di ore del corso | "40" |
| `{{ANNO_CORSO}}` | Anno del corso | "2025" |

### Dati Docente / Responsabile Corso
> **Nota**: Il docente è anche il "Responsabile del Corso" (Course Director).

| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{NOME_DOCENTE}}` | Nome e cognome del docente/responsabile corso | "Mario Rossi" |
| `{{CODICE_FISCALE_DOCENTE}}` | Codice fiscale del docente | "RSSMRA80A01H501U" |

### Dati Partecipante (per Attestati)
| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{NOME_PARTECIPANTE}}` | Nome e cognome del partecipante | "Luigi Verdi" |

### 📅 Lista Sessioni (Loop)

Per inserire una lista di lezioni, usa la sintassi speciale per i loop:

```text
{#SESSIONI}
- Lezione del {{data}}: dalle {{ora_inizio}} alle {{ora_fine}} ({{luogo}})
{/SESSIONI}
```

All'interno del blocco `{#SESSIONI} ... {/SESSIONI}`, puoi usare questi placeholder specifici per ogni lezione:

| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{data}}` | Data della lezione | "22/09/2025" |
| `{{ora_inizio}}` | Orario di inizio | "14:00" |
| `{{ora_fine}}` | Orario di fine | "18:00" |
| `{{luogo}}` | Luogo o modalità (Online/FAD) | "Online" |
| `{{durata}}` | Durata in ore | "4" |
| `{{modalita}}` | Modalità della sessione | "FAD" o "Presenza" |

### Dati Ente e Sede
| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{ENTE_NOME}}` | Nome dell'ente | "AK GROUP SRL" |
| `{{ENTE_INDIRIZZO}}` | Indirizzo completo dell'ente | "Via Roma 1, Milano" |
| `{{SEDE_ACCREDITATA}}` | Nome della sede accreditata | "Sede Milano" |
| `{{SEDE_INDIRIZZO}}` | Indirizzo della sede | "Via Milano 2" |

### Dati FAD (E-Learning)
| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{ORE_FAD}}` | Ore totali in modalità FAD | "20" |
| `{{PIATTAFORMA}}` | Piattaforma utilizzata | "Zoom" |
| `{{MODALITA_GESTIONE}}` | Modalità (Sincrona/Asincrona) | "Sincrona" |
| `{{MODALITA_VALUTAZIONE}}` | Tipo di valutazione | "Test Scritto" |
| `{{OBIETTIVI_DIDATTICI}}` | Obiettivi didattici del corso FAD | "Acquisire competenze..." |
| `{{ZOOM_MEETING_ID}}` | ID meeting Zoom (opzionale) | "123 456 7890" |
| `{{ZOOM_PASSCODE}}` | Passcode Zoom (opzionale) | "abc123" |
| `{{GUEST_USER}}` | Utente ospite (opzionale) | "guest@example.com" |

### Dati Verbale (Esame Finale)
| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{VERBALE_DATA}}` | Data dell'esame (default: ultimo giorno corso) | "09/10/2025" |
| `{{VERBALE_ORA}}` | Ora dell'esame | "14:00" |
| `{{VERBALE_LUOGO}}` | Luogo dell'esame | "Milano" |
| `{{VERBALE_DESCRIZIONE_PROVA}}` | Descrizione della prova | "Prova scritta..." |
| `{{VERBALE_TIPO_PROVA}}` | Tipo di prova | "Scritta" |
| `{{VERBALE_DURATA_PROVA}}` | Durata della prova | "1 ora" |
| `{{VERBALE_MODALITA_PROVA}}` | Modalità di svolgimento | "In classe" |
| `{{VERBALE_CRITERI}}` | Criteri di valutazione | "Superamento 60%..." |
| `{{VERBALE_INDICATORI}}` | Indicatori di valutazione | "Correttezza lessicale..." |
| `{{VERBALE_PESO}}` | Peso della prova | "100%" |
| `{{VERBALE_PROTOCOLLO_SIUF}}` | Numero protocollo SIUF | "12345" |
| `{{PARTECIPANTI_PROMOSSI_TESTO}}` | Elenco promossi (testo) | "Mario Rossi, Luigi Verdi" |
| `{{PARTECIPANTI_BOCCIATI_TESTO}}` | Elenco bocciati (testo) | "nessuno" |

### Dati Responsabili
| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{RESP_CERT_NOME}}` | Nome responsabile certificazione | "Gianfranco" |
| `{{RESP_CERT_COGNOME}}` | Cognome responsabile certificazione | "Torre" |
| `{{RESP_CERT_DATA_NASCITA}}` | Data di nascita | "14/07/1987" |
| `{{RESP_CERT_CITTA_NASCITA}}` | Città di nascita | "Palermo" |
| `{{RESP_CERT_PROVINCIA_NASCITA}}` | Provincia di nascita | "Palermo" |
| `{{RESP_CERT_CITTA_RESIDENZA}}` | Città di residenza | "Reggio Calabria" |
| `{{RESP_CERT_VIA_RESIDENZA}}` | Via di residenza | "VIALE A.MORO TR.SCORDINO" |
| `{{RESP_CERT_NUMERO_CIVICO}}` | Numero civico | "25" |
| `{{RESP_CERT_DOCUMENTO}}` | Documento identità | "AX 2491909" |
| `{{DIRETTORE_NOME_COMPLETO}}` | Nome completo direttore | "Andrea Hubbard" |
| `{{DIRETTORE_QUALIFICA}}` | Qualifica direttore | "Direttore" |
| `{{SUPERVISORE_NOME_COMPLETO}}` | Nome completo supervisore | "Grazia Trainito" |
| `{{SUPERVISORE_QUALIFICA}}` | Qualifica supervisore | "Supervisore" |

### Partecipanti (Posizionali)
Utili per certificati o documenti specifici per singolo partecipante basati sull'ordine in elenco.

- `{{PARTECIPANTE 1}}` - Nome completo del 1° partecipante
- `{{PARTECIPANTE 1 NOME}}` - Nome del 1° partecipante
- `{{PARTECIPANTE 1 COGNOME}}` - Cognome del 1° partecipante
- `{{PARTECIPANTE 1 CF}}` - Codice Fiscale del 1° partecipante
- `{{PARTECIPANTE 1 EMAIL}}` - Email del 1° partecipante
- `{{PARTECIPANTE 2}}` - Nome completo del 2° partecipante
- `{{PARTECIPANTE 2 NOME}}` - Nome del 2° partecipante
- `{{PARTECIPANTE 2 COGNOME}}` - Cognome del 2° partecipante
- `{{PARTECIPANTE 2 CF}}` - Codice Fiscale del 2° partecipante
- `{{PARTECIPANTE 2 EMAIL}}` - Email del 2° partecipante
- `{{PARTECIPANTE 3}}` ... e così via per tutti i partecipanti

### Loop Partecipanti (Tabella)
Da usare all'interno di una tabella Word per elencare tutti i partecipanti.:
```text
{#PARTECIPANTI}
{{numero}}. {{nome}} {{cognome}} (CF: {{codice_fiscale}})
{/PARTECIPANTI}
```

### 👥 Lista Partecipanti (Loop)
Per creare un elenco dei partecipanti:
```text
{#PARTECIPANTI}
{{numero}}. {{nome}} {{cognome}} (CF: {{codice_fiscale}})
{/PARTECIPANTI}
```

All'interno del blocco `{#PARTECIPANTI} ... {/PARTECIPANTI}`, puoi usare:

| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{numero}}` | Numero progressivo (ordine di iscrizione) | "1", "2", "3" |
| `{{nome}}` | Nome del partecipante | "Mario" |
| `{{cognome}}` | Cognome del partecipante | "Rossi" |
| `{{nome_completo}}` | Nome e cognome completo | "Mario Rossi" |
| `{{codice_fiscale}}` | Codice fiscale | "RSSMRA80A01H501U" |
| `{{email}}` | Email del partecipante | "mario.rossi@email.com" |
| `{{telefono}}` | Telefono del partecipante | "123456789" |
| `{{benefits}}` | Benefits status | "Sì", "No" |

> **Nota**: L'ordine dei partecipanti può essere gestito tramite l'interfaccia del wizard durante l'inserimento dei dati.

### 🎯 Placeholder Dinamici per Partecipanti (Posizionali)

Oltre ai loop, puoi usare placeholder posizionali basati sull'ordine dei partecipanti:

```text
{{PARTECIPANTE 1}} - Nome completo del primo partecipante
{{PARTECIPANTE 1 NOME}} - Nome del primo partecipante
{{PARTECIPANTE 1 COGNOME}} - Cognome del primo partecipante
{{PARTECIPANTE 1 CF}} - Codice fiscale del primo partecipante
{{PARTECIPANTE 1 EMAIL}} - Email del primo partecipante
{{PARTECIPANTE 1 BENEFITS}} - Benefits status del primo partecipante

{{PARTECIPANTE 2}} - Nome completo del secondo partecipante
{{PARTECIPANTE 2 NOME}} - Nome del secondo partecipante
...
```

Questi placeholder si aggiornano automaticamente in base all'ordine che imposti durante la compilazione del wizard.

### 📚 Lista Argomenti per Modulo

Per elencare gli argomenti trattati in un modulo:

```text
{#LISTA_ARGOMENTI}
- {{argomento}} (dal modulo: {{modulo}})
{/LISTA_ARGOMENTI}
```

Oppure, per un modulo specifico, usa il placeholder dinamico:
```text
Argomenti Modulo 1: {{MODULO 1 ARGOMENTI}}
Argomenti Modulo 2: {{MODULO 2 ARGOMENTI}}
```

Gli argomenti sono separati da virgola quando usi i placeholder dinamici.

### 📅 Lista Sessioni con Date Complete

Per elencare tutte le sessioni con date e orari:

```text
{#LISTA_SESSIONI_DATE}
{{data}}: {{ora_inizio}} - {{ora_fine}} | {{luogo}} | Modalità: {{modalita}}
{/LISTA_SESSIONI_DATE}
```

### 📅 Lista Sessioni FAD (Loop)
Per elencare solo le sessioni FAD:
```text
{#SESSIONI_FAD}
- Data: {{data}} | Orario: {{ora_inizio}}-{{ora_fine}} | Durata: {{durata}}h
{/SESSIONI_FAD}
```

All'interno di `{#SESSIONI_FAD}`, puoi usare anche:
- `{{giorno}}` (es. "22")
- `{{mese}}` (es. "Settembre")
- `{{anno}}` (es. "2025")

E puoi inserire una **tabella partecipanti specifica per quella sessione**:
```text
{#PARTECIPANTI_SESSIONE}
{{numero}}. {{nome}} {{cognome}} | Connesso: {{ora_connessione}} | Disconnesso: {{ora_disconnessione}}
{/PARTECIPANTI_SESSIONE}
```

All'interno di `{#PARTECIPANTI_SESSIONE}`, sono disponibili gli stessi placeholder di `{#PARTECIPANTI}`, più i campi specifici per connessione/disconnessione.

## 💡 Esempio Completo (Modello A)

```text
PRESENTAZIONE ATTIVITA’ DI FORMAZIONE IN MODALITA’ E-LEARNING

Denominazione ente accreditato: {{ENTE_NOME}}
Sede Accreditata di riferimento: {{SEDE_ACCREDITATA}}
Piattaforma utilizzata: {{PIATTAFORMA}}
Titolo del corso: {{NOME_CORSO}}
ID Corso/Progetto: {{ID_CORSO}} (Sezione: {{ID_SEZIONE}})
Numero di ore in FAD: {{ORE_FAD}}

ELENCO PARTECIPANTI:
{#PARTECIPANTI}
{{nome}} {{cognome}}
{/PARTECIPANTI}
```

## 💡 Esempio Completo (Modello B - Scheda Giorno)

Per generare un documento con **una pagina per ogni giorno**, racchiudi **tutto il contenuto della pagina** nel loop `{#SESSIONI_FAD}`.

```text
{#SESSIONI_FAD}
REGISTRO FORMATIVO E DELLE PRESENZE ONLINE

SCHEDA GIORNO
GIORNO: {{giorno}}      MESE: {{mese}}      ANNO: {{anno}}

--------------------------------------------------------------------------------
| Partecipante | Ora connessione | Ora disconnessione | Firma |
--------------------------------------------------------------------------------
{#PARTECIPANTI_SESSIONE}
| {{nome}} {{cognome}} | {{ora_connessione}} | {{ora_disconnessione}} |       |
{/PARTECIPANTI_SESSIONE}
--------------------------------------------------------------------------------

FIRMA DIRETTORE: _________________
<Interruzione di Pagina>
{/SESSIONI_FAD}
```
*Nota: Assicurati di inserire un'interruzione di pagina manuale prima della chiusura del tag `{/SESSIONI_FAD}` per avere ogni giorno su una nuova pagina.*

## 💡 Esempio: Modello B FAD (File Separato per Giorno)

**NUOVO**: Il sistema genera automaticamente **un file per ogni giorno FAD** usando il template `modello B FAD_placeholder.docx`.

### Template Structure (Semplificato)

```text
REGISTRO FORMATIVO E DELLE PRESENZE ONLINE

SCHEDA GIORNO
GIORNO: {{giorno}}      MESE: {{mese}}      ANNO: {{anno}}

Corso: {{NOME_CORSO}}
ID Sezione: {{ID_SEZIONE}}

DETTAGLI LEZIONE ONLINE

Orario della lezione online: {{ora_inizio}} - {{ora_fine}}

Argomento della lezione online: {{argomento_sessione}}


FIRMA IL DIRETTORE DEL CORSO (2)

____________________________
```

### Placeholder Unici per Modello B

| Placeholder | Descrizione | Esempio |
|-------------|-------------|---------|
| `{{giorno}}` | Numero giorno | "22" |
| `{{mese}}` | Nome mese italiano | "Settembre" |
| `{{anno}}` | Anno | "2025" |
| `{{ora_inizio}}` | Ora inizio lezione FAD | "9:00" |
| `{{ora_fine}}` | Ora fine lezione FAD | "13:00" |
| `{{argomento_sessione}}` | Argomento casuale dalla lista configurata * | "Sicurezza sul lavoro" |

*L'argomento viene scelto casualmente dalle "Liste Argomenti" configurate in Impostazioni → Dati Predefiniti

### Come Funziona

1. Il sistema filtra **solo le sessioni FAD** del corso
2. Per OGNI sessione FAD, genera **un file separato**
3. I file vengono salvati nella cartella `Registri_FAD/` all'interno del ZIP
4. Nome file: `Registro_FAD_22_09_2025.docx` (basato sulla data della sessione)

**Vantaggi**:
- Un documento per ogni giorno = più facile da archiviare e firmare
- Argomenti variabili automaticamente
- Nessun bisogno di loop nel template (ogni file = 1 giorno)


## 💡 Esempio: Tabella Calendario Lezioni E-Learning

Per creare una tabella con il calendario delle lezioni che si popola automaticamente, segui questi passaggi in **Microsoft Word**:

1. **Scrivi il titolo**:
   ```
   5. Calendario delle lezioni e-learning, modalità utilizzata e docenti impegnati
   ```

2. **Crea una tabella** con 6 colonne (Inserisci → Tabella → 6 colonne x 2 righe)

3. **Nella prima riga (intestazione)** inserisci:
   - `DATA` | `ORA INIZIO` | `ORA FINE` | `MATERIA` | `DOCENTE` | `NOTE`

4. **Nella seconda riga** inserisci i placeholder con il loop:
   - Nella cella della colonna DATA: `{#SESSIONI_FAD}`
   - Nella stessa riga, nelle celle successive: `{{data}}` | `{{ora_inizio}}` | `{{ora_fine}}` | `{{NOME_CORSO}}` | `{{NOME_DOCENTE}}` |
   - Nell'ultima cella (NOTE) lascia vuoto o inserisci `{{modalita}}`

5. **Chiudi il loop**: In una nuova riga sotto la tabella, scrivi `{/SESSIONI_FAD}`

6. **Assicurati che i bordi siano visibili**: Seleziona la tabella → Layout Tabella → Visualizza Griglia oppure Design Tabella → Bordi → Tutti i bordi

**Risultato finale in Word**:
```
5. Calendario delle lezioni e-learning, modalità utilizzata e docenti impegnati

┌──────────┬────────────┬──────────┬─────────────┬─────────────┬──────┐
│   DATA   │ ORA INIZIO │ ORA FINE │   MATERIA   │   DOCENTE   │ NOTE │
├──────────┼────────────┼──────────┼─────────────┼─────────────┼──────┤
{#SESSIONI_FAD}
│ {{data}} │ {{ora_inizio}} │ {{ora_fine}} │ {{NOME_CORSO}} │ {{NOME_DOCENTE}} │      │
{/SESSIONI_FAD}
└──────────┴────────────┴──────────┴─────────────┴─────────────┴──────┘
```

📌 **Importante**: 
- Il tag `{#SESSIONI_FAD}` deve essere **nella prima cella dati** della tabella
- Il tag `{/SESSIONI_FAD}` deve essere **dopo l'ultima cella della riga**
- La tabella genererà automaticamente una riga per ogni sessione FAD del corso

**Varianti disponibili per la colonna NOTE**:
- `{{modalita}}` - Mostra se è sincrona/asincrona
- `{{luogo}}` - Mostra "Online" o altra location
- `{{durata}}h` - Mostra la durata in ore
- Lascia vuoto per compilazione manuale

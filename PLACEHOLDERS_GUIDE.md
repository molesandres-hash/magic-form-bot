# Guida Completa ai Placeholder dei Documenti

Questa guida descrive il sistema di placeholder utilizzato per generare i documenti Word (e alcuni Excel) nel progetto Magic Form Bot.

## Indice

1.  [Introduzione](#introduzione)
2.  [Sintassi dei Placeholder](#sintassi-dei-placeholder)
3.  [Elenco Completo dei Placeholder](#elenco-completo-dei-placeholder)
    *   [Dati Corso](#dati-corso)
    *   [Dati Ente e Sede](#dati-ente-e-sede)
    *   [Dati Docente e Referenti](#dati-docente-e-referenti)
    *   [Dati FAD (E-Learning)](#dati-fad-e-learning)
    *   [Liste e Loop (Sessioni, Partecipanti)](#liste-e-loop-sessioni-partecipanti)
    *   [Placeholder Dinamici](#placeholder-dinamici)
    *   [Dati Verbale Esame](#dati-verbale-esame)
    *   [Modulo 5 (Calendario Condizionalità)](#modulo-5-calendario-condizionalità)
    *   [Modulo 7 (Comunicazione Evento)](#modulo-7-comunicazione-evento)
4.  [Come Creare o Modificare un Template](#come-creare-o-modificare-un-template)
5.  [Come Aggiungere Nuovi Placeholder](#come-aggiungere-nuovi-placeholder)

---

## Introduzione

Il sistema utilizza **docxtemplater** per sostituire variabili all'interno di documenti Word (`.docx`). I dati estratti dai PDF o inseriti manualmente vengono mappati in un oggetto dati che viene passato al motore di template.

## Sintassi dei Placeholder

*   **Variabile Semplice:** `{{NOME_VARIABILE}}`
    *   Esempio: `{{NOME_CORSO}}` verrà sostituito con il titolo del corso.
*   **Oggetti Nidificati:** `{{oggetto.proprieta}}`
    *   Esempio: `{{ente.nome}}` (anche se la maggior parte dei dati viene appiattita per facilità d'uso).
*   **Loop (Liste):** `{#LISTA} ... {/LISTA}`
    *   Esempio:
        ```text
        {#SESSIONI}
        Data: {{data}} - Orario: {{ora_inizio}} / {{ora_fine}}
        {/SESSIONI}
        ```
*   **Condizionali:** `{#VARIABILE} ... {/VARIABILE}` (mostra solo se esiste/vero) o `{:VARIABILE} ... {/VARIABILE}` (else).

---

## Elenco Completo dei Placeholder

Questi placeholder sono disponibili per tutti i template generici gestiti da `templateRegistry.ts`.

### Dati Corso

| Placeholder | Descrizione | Fonte Dati |
| :--- | :--- | :--- |
| `{{NOME_CORSO}}` | Titolo del corso | `corso.titolo` |
| `{{ID_CORSO}}` | ID del corso (o del modulo corrente) | `corso.id` |
| `{{ID_SEZIONE}}` | ID della sezione (o del corso) | `corso.id` |
| `{{DATA_INIZIO}}` | Data inizio corso | `corso.data_inizio` |
| `{{DATA_FINE}}` | Data fine corso | `corso.data_fine` |
| `{{ORE_TOTALI}}` | Monte ore totale | `corso.ore_totali` |
| `{{ANNO_CORSO}}` | Anno di riferimento | `corso.anno` (default: anno corrente) |
| `{{MODULO_TITOLO}}` | Titolo del modulo corrente | `modulo.titolo` |
| `{{MODULO_ID}}` | ID del modulo corrente | `modulo.id` |
| `{{MODULO_NUMERO}}` | Numero sequenziale del modulo | `modulo.index` |
| `{{CODICE_OFFERTA_FORMATIVA}}` | Codice offerta formativa (es. GOL) | `corso.offerta_formativa.codice` |
| `{{NOME_OFFERTA_FORMATIVA}}` | Nome offerta formativa | `corso.offerta_formativa.nome` |

### Dati Ente e Sede

| Placeholder | Descrizione | Fonte Dati |
| :--- | :--- | :--- |
| `{{ENTE_NOME}}` | Nome dell'ente gestore | `ente.nome` |
| `{{ENTE_INDIRIZZO}}` | Indirizzo completo dell'ente | `ente.indirizzo` |
| `{{SEDE_ACCREDITATA}}` | Nome della sede accreditata | `ente.accreditato.nome` o `sede.nome` |
| `{{SEDE_INDIRIZZO}}` | Indirizzo della sede di svolgimento | `ente.accreditato` o `sede.indirizzo` |

### Dati Docente e Referenti

| Placeholder | Descrizione | Fonte Dati |
| :--- | :--- | :--- |
| `{{NOME_DOCENTE}}` | Nome completo del docente | `trainer.nome_completo` |
| `{{CODICE_FISCALE_DOCENTE}}` | Codice fiscale del docente | `trainer.codice_fiscale` |
| `{{TELEFONO_DOCENTE}}` | Telefono del docente | `trainer.telefono` |
| `{{DIRETTORE_CORSO}}` | Nome del Direttore del Corso | `direttore.nomeCompleto` |
| `{{DIRETTORE_QUALIFICA}}` | Qualifica del Direttore | `direttore.qualifica` |
| `{{RESP_CERT_NOME_COMPLETO}}` | Responsabile Certificazione | `respCert.nomeCompleto` |
| `{{SUPERVISORE_NOME_COMPLETO}}` | Supervisore | `supervisore.nomeCompleto` |

### Dati FAD (E-Learning)

| Placeholder | Descrizione | Fonte Dati |
| :--- | :--- | :--- |
| `{{ORE_FAD}}` | Ore totali in modalità FAD | Calcolato da sessioni FAD |
| `{{PIATTAFORMA}}` | Piattaforma utilizzata (es. Zoom) | `calendario_fad.strumenti` |
| `{{MODALITA_GESTIONE}}` | Modalità (es. Sincrona) | `calendario_fad.modalita` |
| `{{ID_RIUNIONE}}` | ID Meeting Zoom/Meet | Estratto da strumenti |
| `{{PASSCODE}}` | Password Meeting | Estratto da strumenti |

### Liste e Loop (Sessioni, Partecipanti)

Utilizzare con sintassi `{#NOME_LISTA}...{/NOME_LISTA}`.

#### `{#SESSIONI}`
Itera su tutte le sessioni del corso.
*   `{{data}}`: Data completa (es. 22/09/2025)
*   `{{ora_inizio}}`: Ora inizio (es. 09:00)
*   `{{ora_fine}}`: Ora fine (es. 13:00)
*   `{{luogo}}`: Sede o "FAD"
*   `{{durata}}`: Durata in ore
*   `{{modalita}}`: "Presenza" o "FAD"
*   `{{giorno}}`: Giorno (es. 22)
*   `{{mese}}`: Mese (es. Settembre)
*   `{{anno}}`: Anno (es. 2025)

#### `{#SESSIONI_PRESENZA}`
Itera SOLO sulle sessioni in presenza (esclude FAD/Online).
*   Stessi campi di `SESSIONI` (inclusi giorno, mese, anno).

#### `{#SESSIONI_ONLINE}`
Itera SOLO sulle sessioni Online/FAD.
*   Alias di `SESSIONI_FAD`, ma più intuitivo.
*   Stessi campi di `SESSIONI`.

#### `{#SESSIONI_FAD}`
Itera solo sulle sessioni FAD.
*   Include i campi di `SESSIONI` più:
*   `{{giorno}}`, `{{mese}}`, `{{anno}}` separati.
*   `{#PARTECIPANTI_SESSIONE}`: Sotto-lista dei partecipanti per quella sessione (utile per registri presenze giornalieri).

#### `{#PARTECIPANTI}`
Elenco completo degli iscritti.
*   `{{numero}}`: Numero progressivo
*   `{{nome}}`, `{{cognome}}`, `{{nome_completo}}`
*   `{{codice_fiscale}}`
*   `{{email}}`, `{{telefono}}`
*   `{{benefits}}`: "Sì" o "No"

#### `{#LISTA_ARGOMENTI}`
Elenco piatto di tutti gli argomenti trattati.
*   `{{argomento}}`: Descrizione argomento
*   `{{modulo}}`: Titolo del modulo di appartenenza

### Placeholder Dinamici

Per accedere a partecipanti specifici senza usare i loop (utile per moduli fissi).
*   `{{PARTECIPANTE 1}}`: Nome completo del primo partecipante
*   `{{PARTECIPANTE 1 NOME}}`
*   `{{PARTECIPANTE 1 COGNOME}}`
*   `{{PARTECIPANTE 1 CF}}`
*   ... fino all'ultimo partecipante.

*   `{{MODULO 1 ARGOMENTI}}`: Stringa con tutti gli argomenti del modulo 1.

### Dati Verbale Esame

*   `{{VERBALE_DATA}}`, `{{VERBALE_ORA}}`, `{{VERBALE_LUOGO}}`
*   `{{VERBALE_DESCRIZIONE_PROVA}}`, `{{VERBALE_TIPO_PROVA}}`
*   `{{PARTECIPANTI_PROMOSSI_TESTO}}`: Elenco testuale dei promossi.

---

### Modulo 5 (Calendario Condizionalità)

Questo documento viene generato specificamente per ogni beneficiario GOL.
*   `{{PARTECIPANTE 1 ...}}`: Dati del singolo beneficiario.
*   `{{SUPERVISORE_EMAIL}}`: Email generata del supervisore.
*   `{#SESSIONI}`: Contiene `{{ora_mattina}}` e `{{ora_pomeriggio}}` separati.

### Modulo 7 (Comunicazione Evento)

Generato per ogni beneficiario per ogni singola sessione.
*   `{{DATA_LEZIONE}}`
*   `{{ORA_INIZIO}}`, `{{ORA_FINE}}`
*   `{{luogo}}`

---

## Come Creare o Modificare un Template

1.  **Apri Word**: Crea un nuovo documento o aprine uno esistente.
2.  **Inserisci Placeholder**: Scrivi i placeholder dove vuoi che appaiano i dati.
    *   Esempio: "Il corso **{{NOME_CORSO}}** inizierà il **{{DATA_INIZIO}}**."
3.  **Gestisci Tabelle**: Se vuoi una tabella dinamica (es. elenco partecipanti):
    *   Crea una riga di intestazione.
    *   Crea una seconda riga per i dati.
    *   Nella seconda riga, inizia la prima cella con `{#PARTECIPANTI}` e finisci l'ultima cella con `{/PARTECIPANTI}`.
    *   Inserisci i campi (es. `{{nome}}`, `{{cognome}}`) nelle colonne appropriate.
4.  **Salva**: Salva il file come `.docx`.
5.  **Carica**:
    *   Se è un template "di sistema", mettilo in `public/templates/`.
    *   Se è un template utente, caricalo tramite l'interfaccia "Impostazioni Template" dell'applicazione.

## Come Aggiungere Nuovi Placeholder

Se hai bisogno di un dato che non è in elenco:

1.  **Identifica il dato**: Assicurati che il dato esista in `CourseData` (`src/types/courseData.ts`).
2.  **Aggiorna il Mapping**:
    *   Modifica `src/services/templateRegistry.ts`.
    *   Vai alla funzione `createLocalTemplateGenerator` (o `createDbTemplateGenerator`).
    *   Aggiungi la nuova chiave all'oggetto `templateData`.
    *   Esempio:
        ```typescript
        const templateData = {
            // ... esistenti
            NUOVO_CAMPO: data.nuovo_percorso?.valore || '',
        };
        ```
3.  **Aggiorna questa Guida**: Aggiungi il nuovo placeholder all'elenco sopra.

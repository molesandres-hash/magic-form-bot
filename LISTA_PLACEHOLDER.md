# Lista Placeholder Disponibili

## Dati Generali Corso
| Placeholder | Descrizione |
|-------------|-------------|
| `{{NOME_CORSO}}` | Titolo del corso |
| `{{ID_CORSO}}` | Codice identificativo del corso |
| `{{ID_SEZIONE}}` | Codice identificativo della sezione |
| `{{DATA_INIZIO}}` | Data della prima lezione |
| `{{DATA_FINE}}` | Data dell'ultima lezione |
| `{{ORE_TOTALI}}` | Numero totale di ore |
| `{{ANNO_CORSO}}` | Anno del corso |

## Dati Docente / Responsabile
| Placeholder | Descrizione |
|-------------|-------------|
| `{{NOME_DOCENTE}}` | Nome e cognome docente |
| `{{CODICE_FISCALE_DOCENTE}}` | Codice fiscale docente |

## Dati Partecipante (Singolo)
| Placeholder | Descrizione |
|-------------|-------------|
| `{{NOME_PARTECIPANTE}}` | Nome e cognome partecipante |

## Dati Ente e Sede
| Placeholder | Descrizione |
|-------------|-------------|
| `{{ENTE_NOME}}` | Nome dell'ente |
| `{{ENTE_INDIRIZZO}}` | Indirizzo dell'ente |
| `{{SEDE_ACCREDITATA}}` | Nome sede accreditata |
| `{{SEDE_INDIRIZZO}}` | Indirizzo sede |

## Dati FAD (E-Learning)
| Placeholder | Descrizione |
|-------------|-------------|
| `{{ORE_FAD}}` | Ore totali FAD |
| `{{PIATTAFORMA}}` | Piattaforma utilizzata |
| `{{MODALITA_GESTIONE}}` | Modalità (Sincrona/Asincrona) |
| `{{MODALITA_VALUTAZIONE}}` | Tipo di valutazione |
| `{{OBIETTIVI_DIDATTICI}}` | Obiettivi didattici |
| `{{ZOOM_MEETING_ID}}` | ID Meeting Zoom |
| `{{ZOOM_PASSCODE}}` | Passcode Zoom |
| `{{GUEST_USER}}` | Utente ospite |

## Dati Verbale (Esame)
| Placeholder | Descrizione |
|-------------|-------------|
| `{{VERBALE_DATA}}` | Data esame |
| `{{VERBALE_ORA}}` | Ora esame |
| `{{VERBALE_LUOGO}}` | Luogo esame |
| `{{VERBALE_DESCRIZIONE_PROVA}}` | Descrizione prova |
| `{{VERBALE_TIPO_PROVA}}` | Tipo prova |
| `{{VERBALE_DURATA_PROVA}}` | Durata prova |
| `{{VERBALE_MODALITA_PROVA}}` | Modalità svolgimento |
| `{{VERBALE_CRITERI}}` | Criteri valutazione |
| `{{VERBALE_INDICATORI}}` | Indicatori valutazione |
| `{{VERBALE_PESO}}` | Peso prova |
| `{{VERBALE_PROTOCOLLO_SIUF}}` | Protocollo SIUF |
| `{{PARTECIPANTI_PROMOSSI_TESTO}}` | Elenco promossi |
| `{{PARTECIPANTI_BOCCIATI_TESTO}}` | Elenco bocciati |

## Dati Responsabili
| Placeholder | Descrizione |
|-------------|-------------|
| `{{RESP_CERT_NOME}}` | Nome resp. certificazione |
| `{{RESP_CERT_COGNOME}}` | Cognome resp. certificazione |
| `{{RESP_CERT_DATA_NASCITA}}` | Data nascita resp. |
| `{{RESP_CERT_CITTA_NASCITA}}` | Città nascita resp. |
| `{{RESP_CERT_PROVINCIA_NASCITA}}` | Prov. nascita resp. |
| `{{RESP_CERT_CITTA_RESIDENZA}}` | Città residenza resp. |
| `{{RESP_CERT_VIA_RESIDENZA}}` | Via residenza resp. |
| `{{RESP_CERT_NUMERO_CIVICO}}` | Civico resp. |
| `{{RESP_CERT_DOCUMENTO}}` | Documento resp. |
| `{{DIRETTORE_NOME_COMPLETO}}` | Nome direttore |
| `{{DIRETTORE_QUALIFICA}}` | Qualifica direttore |
| `{{SUPERVISORE_NOME_COMPLETO}}` | Nome supervisore |
| `{{SUPERVISORE_QUALIFICA}}` | Qualifica supervisore |

## Partecipanti Posizionali (1-20+)
Sostituire `X` con il numero del partecipante (es. 1, 2, 3...)
| Placeholder | Descrizione |
|-------------|-------------|
| `{{PARTECIPANTE X}}` | Nome completo |
| `{{PARTECIPANTE X NOME}}` | Nome |
| `{{PARTECIPANTE X COGNOME}}` | Cognome |
| `{{PARTECIPANTE X CF}}` | Codice Fiscale |
| `{{PARTECIPANTE X EMAIL}}` | Email |

## Loop (Liste)

### Lista Sessioni `{#SESSIONI}`
| Placeholder | Descrizione |
|-------------|-------------|
| `{{data}}` | Data lezione |
| `{{ora_inizio}}` | Ora inizio |
| `{{ora_fine}}` | Ora fine |
| `{{luogo}}` | Luogo |
| `{{durata}}` | Durata |
| `{{modalita}}` | Modalità |

### Lista Partecipanti `{#PARTECIPANTI}`
| Placeholder | Descrizione |
|-------------|-------------|
| `{{numero}}` | Numero progressivo |
| `{{nome}}` | Nome |
| `{{cognome}}` | Cognome |
| `{{nome_completo}}` | Nome completo |
| `{{codice_fiscale}}` | Codice Fiscale |
| `{{email}}` | Email |
| `{{telefono}}` | Telefono |

### Lista Sessioni FAD `{#SESSIONI_FAD}`
Stessi di `{#SESSIONI}` più:
| Placeholder | Descrizione |
|-------------|-------------|
| `{{giorno}}` | Giorno (es. 22) |
| `{{mese}}` | Mese (es. Settembre) |
| `{{anno}}` | Anno (es. 2025) |

### Lista Argomenti `{#LISTA_ARGOMENTI}`
| Placeholder | Descrizione |
|-------------|-------------|
| `{{argomento}}` | Testo argomento |
| `{{modulo}}` | Modulo di riferimento |

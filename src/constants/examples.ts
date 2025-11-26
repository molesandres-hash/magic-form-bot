/**
 * Example data for the wizard steps
 * Used for demonstration and testing purposes
 */

export const EXAMPLE_COURSE_DATA = `Dettagli di base

ID
22639
Corso
AI: Intelligenza Artificiale 100% FAD (1,2,3)
Quando
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 22/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 23/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 24/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 25/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 1 - 26/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 2 - 29/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 2 - 30/09/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 2 - 01/10/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 2 - 02/10/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 2 - 03/10/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 3 - 06/10/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 3 - 07/10/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 3 - 08/10/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 3 - 09/10/2025 14:00 - 18:00 - Online
AI: Intelligenza Artificiale 100% FAD - Modulo 3 - 10/10/2025 14:00 - 18:00 - Online
Ufficio
Milano Porta Venezia
Capienza
4/5
Trainer
Andres Moles
Tipo di sede
Ufficio
Ore Totali
60 hours
Durata
60 hours
Rendicontabile
60 hours
Stato
Aperto`;

export const EXAMPLE_MODULES_DATA = `Moduli

Ricerca
Corso	ID Corso	ID Sezione	Quando	Provider	Tipo di sede	# Sessioni	Ore Totali	Durata	Rendicontabile	Capienza	Stato
AI: Intelligenza Artificiale 100% FAD - Modulo 1	50039	144176	22/09/2025 14:00 - 18:00
23/09/2025 14:00 - 18:00
24/09/2025 14:00 - 18:00
25/09/2025 14:00 - 18:00
26/09/2025 14:00 - 18:00	Andres Moles	Ufficio	5	20 hours	20 hours	20 hours	4/5	Aperto
AI: Intelligenza Artificiale 100% FAD - Modulo 2	50173	144200	29/09/2025 14:00 - 18:00
30/09/2025 14:00 - 18:00
01/10/2025 14:00 - 18:00
02/10/2025 14:00 - 18:00
03/10/2025 14:00 - 18:00	Andres Moles	Ufficio	5	20 hours	20 hours	20 hours	4/5	Aperto
AI: Intelligenza Artificiale 100% FAD - Modulo 3	50174	144201	06/10/2025 14:00 - 18:00
07/10/2025 14:00 - 18:00
08/10/2025 14:00 - 18:00
09/10/2025 14:00 - 18:00
10/10/2025 14:00 - 18:00	Andres Moles	Ufficio	5	20 hours	20 hours	20 hours	4/5	Aperto`;

export const EXAMPLE_PARTICIPANTS_DATA = `Modulo Partecipanti

Ricerca
ID	Codice Fiscale	Nome	Telefono/i	Cellulare	Indirizzo email	Programma	Ufficio	Case Manager	Benefits	Presenza dell'utente	Dettagli	Frequenza
18900	VLCFRZ01L30Z611L	FABRIZIO VILCA CAMPOS	03518559653 / 03518559653	03518559653	fabrovc@gmail.com	GOL External Training	External Training	Valeria Carcaiso	Sì	8:00		  
18965	PRRPLA78C09F205R	PAOLO PERRONE	03470503622 / 03470503622	03470503622	paoletto039@virgilio.it	GOL External Training	External Training	Valeria Carcaiso	Sì	8:00		  
19019	CNACLD79L52F205N	CLAUDIA CANI	03494299536 / 03494299536	03494299536	claudiacani@hotmail.com	GOL External Training	External Training	Valeria Carcaiso		8:00		  
18954	GNLCST79C03E884N	Cristian Agnelli	03496286801 / 03496286801	03496286801	cristian.agnelli@me.com	GOL Lombardy	Milano Porta Romana	Chiara Filiaggi	No	8:00`;

/**
 * All example data organized by step number
 */
export const WIZARD_EXAMPLES = {
  1: EXAMPLE_COURSE_DATA,
  2: EXAMPLE_MODULES_DATA,
  3: EXAMPLE_PARTICIPANTS_DATA,
} as const;

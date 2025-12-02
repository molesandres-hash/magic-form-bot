import type { CourseData } from '@/types/courseData';
import { loadPredefinedData } from '@/utils/predefinedDataUtils';
import { formatSedeIndirizzo, getVerbaleLuogo } from '@/utils/locationUtils';

/**
 * Maps CourseData to a flat dictionary of placeholders for Word templates.
 * Centralizes all logic for data preparation to ensure consistency across different templates.
 */
export function mapCourseDataToTemplate(data: CourseData): Record<string, any> {
    // DEBUG LOGGING
    console.log('--- mapCourseDataToTemplate START ---');
    console.log('Incoming Data:', JSON.stringify(data, null, 2));

    // Helper to calculate duration in hours
    const calculateDuration = (start: string, end: string): number => {
        try {
            const [h1, m1] = start.split(':').map(Number);
            const [h2, m2] = end.split(':').map(Number);
            return (h2 + m2 / 60) - (h1 + m1 / 60);
        } catch {
            return 0;
        }
    };

    // Calculate FAD hours per module
    const moduleFadHours: Record<string, string> = {};
    let totalFadHours = 0;

    (data.moduli || []).forEach((modulo, index) => {
        // Find sessions for this module
        let moduleSessions = modulo.sessioni || [];

        // Fallback: if module sessions are empty but global sessions exist and we have 1 module
        if (moduleSessions.length === 0 && data.moduli.length === 1 && data.sessioni) {
            moduleSessions = data.sessioni;
        }

        const fadSessionsModule = moduleSessions.filter(s => s.is_fad);
        const modFadHours = fadSessionsModule.reduce((acc, s) => {
            return acc + calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata);
        }, 0);

        totalFadHours += modFadHours;

        // Map index to letter: 0->A, 1->B, etc.
        const letter = String.fromCharCode(65 + index); // 65 is 'A'
        moduleFadHours[`ore_FAD_modulo_${letter}`] = modFadHours.toFixed(1).replace('.0', '');
    });

    // Calculate global FAD sessions (if not already covered by modules, though usually they are)
    // We use the total calculated from modules to be consistent, or fallback to global sessions if no modules
    if ((!data.moduli || data.moduli.length === 0) && data.sessioni) {
        const globalFadSessions = data.sessioni.filter(s => s.is_fad);
        totalFadHours = globalFadSessions.reduce((acc, s) => {
            return acc + calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata);
        }, 0);
    }

    const fadSessions = (data.sessioni || []).filter(s => s.is_fad);

    const currentModule: any =
        (data as any)?.metadata?.modulo_corrente ||
        (data.moduli && data.moduli.length > 0 ? data.moduli[0] : null);
    const currentModuleNumber = currentModule?.index || 1;

    // Helper to parse date components
    const parseSessionDate = (dateStr: string) => {
        const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        let dateObj = new Date();
        try {
            if (dateStr.includes('/')) {
                const [d, m, y] = dateStr.split('/');
                dateObj = new Date(Number(y), Number(m) - 1, Number(d));
            } else {
                dateObj = new Date(dateStr);
            }
        } catch (e) {
            return { giorno: '', mese: '', anno: '' };
        }
        return {
            giorno: dateObj.getDate().toString().padStart(2, '0'),
            mese: mesi[dateObj.getMonth()],
            anno: dateObj.getFullYear().toString()
        };
    };

    // Load predefined data for resolving IDs
    const predefined = loadPredefinedData();

    // Helper to resolve person by ID (Director, Supervisor, etc.)
    const resolvePerson = (id?: string) => {
        if (!id) return null;
        // Handle potential prefixes from useCompletionData (e.g. "local-dir-", "local-sup-", "local-resp-")
        const cleanId = id.replace(/^(local-dir-|local-sup-|local-resp-)/, '');

        // Search in supervisors
        const supervisor = predefined.supervisors.find(s => s.id === cleanId);
        if (supervisor) {
            const nomeCompleto = supervisor.nomeCompleto || '';
            return {
                nome: nomeCompleto.split(' ')[0] || '',
                cognome: nomeCompleto.split(' ').slice(1).join(' ') || '',
                nomeCompleto: nomeCompleto,
                qualifica: supervisor.qualifica || '',
                // Supervisors might not have all these fields, so we leave them undefined or empty
                dataNascita: '',
                cittaNascita: '',
                provinciaNascita: '',
                cittaResidenza: '',
                viaResidenza: '',
                numeroCivico: '',
                documento: ''
            };
        }

        // Search in responsabili
        const resp = predefined.responsabili.find(r => r.id === cleanId);
        if (resp) return {
            nome: resp.nome,
            cognome: resp.cognome,
            nomeCompleto: `${resp.nome} ${resp.cognome}`,
            qualifica: 'Responsabile',
            dataNascita: resp.dataNascita,
            cittaNascita: resp.cittaNascita,
            provinciaNascita: resp.provinciaNascita,
            cittaResidenza: resp.cittaResidenza,
            viaResidenza: resp.viaResidenza,
            numeroCivico: resp.numeroCivico,
            documento: resp.documento
        };

        return null;
    };

    // Helper to extract Zoom details from a string
    function extractZoomDetails(text: string): { id: string, passcode: string } {
        const result = { id: '', passcode: '' };
        if (!text) return result;

        // Try to find ID (3 sets of numbers)
        const idMatch = text.match(/(\d{3}\s?\d{3,4}\s?\d{3,4})/);
        if (idMatch) result.id = idMatch[1];

        // Try to find passcode
        const passMatch = text.match(/passcode:?\s*(\d+)/i) || text.match(/pwd=([^&\s]+)/);
        if (passMatch) result.passcode = passMatch[1];

        return result;
    }

    // Resolve Roles
    const direttore = resolvePerson(data.direttore_id);
    const supervisore = resolvePerson(data.supervisore_id);
    const respCert = resolvePerson(data.responsabile_cert_id);

    // Logic for Direttore del Corso: Use selected Director, otherwise fallback to Trainer
    const direttoreNomeCompleto = direttore?.nomeCompleto || data.trainer?.nome_completo || `${data.trainer?.nome || ''} ${data.trainer?.cognome || ''}`.trim();
    const direttoreQualifica = direttore?.qualifica || 'Trainer'; // Default qualification if falling back to trainer

    // Prepare data for the template
    const result = {

        // --- DATI CORSO ---
        NOME_CORSO: data.corso?.titolo || '',
        ID_CORSO: currentModule?.id_corso || data.corso?.id || '', // Specific ID_CORSO from module
        ID_SEZIONE: currentModule?.id_sezione || data.corso?.id || '', // Specific ID_SEZIONE from module
        DATA_INIZIO: data.corso?.data_inizio || '',
        DATA_FINE: data.corso?.data_fine || '',
        ORE_TOTALI: data.corso?.ore_totali || '',
        ANNO_CORSO: data.corso?.anno || new Date().getFullYear().toString(),
        MODULO_TITOLO: (() => {
            // If there is only 1 module, ALWAYS use the Course Title
            if ((data.moduli || []).length <= 1) {
                return data.corso?.titolo || '';
            }

            const modTitle = currentModule?.titolo || '';
            // If module title is generic (e.g. "Modulo 1"), use Course Title
            if (!modTitle || /^Modulo\s+\d+$/i.test(modTitle)) {
                return data.corso?.titolo || '';
            }
            return modTitle;
        })(),
        MODULO_ID: currentModule?.id || currentModule?.id_sezione || '',
        MODULO_ID_SEZIONE: currentModule?.id_sezione || '',
        MODULO_NUMERO: currentModuleNumber,
        MODULO_DATA_INIZIO: currentModule?.data_inizio || data.corso?.data_inizio || '',
        MODULO_DATA_FINE: currentModule?.data_fine || data.corso?.data_fine || '',
        CODICE_OFFERTA_FORMATIVA: data.corso?.offerta_formativa?.codice || '',
        NOME_OFFERTA_FORMATIVA: data.corso?.offerta_formativa?.nome || '',

        // --- DATI ENTE ---
        ENTE_NOME: data.ente?.nome || '',
        ENTE_INDIRIZZO: data.ente?.indirizzo || '',
        SEDE_ACCREDITATA: data.ente?.accreditato?.nome || data.sede?.nome || '',
        SEDE_ACCREDITATA_COMPLETA: `${data.ente?.accreditato?.nome || data.sede?.nome || ''} - ${formatSedeIndirizzo(
            data.ente?.accreditato?.via || data.sede?.indirizzo || '',
            data.ente?.accreditato?.comune || data.sede?.citta
        )}`,
        SEDE_INDIRIZZO: (() => {
            // 1. Priority: Sede (if available)
            if (data.sede?.indirizzo) {
                const parts = [
                    data.sede.indirizzo,
                    data.sede.citta,
                    data.sede.cap
                ].filter(Boolean);
                return parts.join(' - ');
            }
            // 2. Fallback: Ente Accreditato
            return formatSedeIndirizzo(
                data.ente?.accreditato?.via || '',
                data.ente?.accreditato?.comune
            );
        })(),
        VERBALE_LUOGO: getVerbaleLuogo(
            data.ente?.accreditato?.via || data.sede?.indirizzo || '',
            data.ente?.accreditato?.comune || data.sede?.citta
        ),

        // --- DATI DOCENTE / REFERENTI ---
        NOME_DOCENTE: data.trainer?.nome_completo || '',
        CODICE_FISCALE_DOCENTE: data.trainer?.codice_fiscale || '',
        TELEFONO_DOCENTE: data.trainer?.telefono || '',
        EMAIL_DOCENTE: data.trainer?.email || '',

        // Direttore del Corso (Mapped to Trainer if missing)
        DIRETTORE_CORSO: direttoreNomeCompleto,
        DIRETTORE_NOME_COMPLETO: direttoreNomeCompleto,
        DIRETTORE_QUALIFICA: direttoreQualifica,

        TUTOR_CORSO: '', // TODO: Add to CourseData

        // --- DATI FAD (E-LEARNING) ---
        ORE_FAD: totalFadHours.toFixed(1).replace('.0', ''),
        ORE_TOTALE_FAD: totalFadHours.toFixed(1).replace('.0', ''),
        ...moduleFadHours,

        PIATTAFORMA: data.calendario_fad?.piattaforma || data.calendario_fad?.strumenti || 'Zoom',
        MODALITA_GESTIONE: data.calendario_fad?.modalita || 'Sincrona',
        MODALITA_VALUTAZIONE: data.calendario_fad?.valutazione || 'Test Scritto',
        OBIETTIVI_DIDATTICI: data.calendario_fad?.obiettivi || '',

        // Placeholder for specific FAD details (can be filled if data is available or left for manual input)
        ZOOM_MEETING_ID: data.calendario_fad?.id_riunione || extractZoomDetails(data.calendario_fad?.strumenti || '').id || '',
        ZOOM_PASSCODE: data.calendario_fad?.passcode || extractZoomDetails(data.calendario_fad?.strumenti || '').passcode || '',
        ZOOM_LINK: data.calendario_fad?.strumenti || '', // Often the link is in 'strumenti' or we can add a specific field
        ID_RIUNIONE: data.calendario_fad?.id_riunione || extractZoomDetails(data.calendario_fad?.strumenti || '').id || 'Da definire',
        PASSCODE: data.calendario_fad?.passcode || extractZoomDetails(data.calendario_fad?.strumenti || '').passcode || 'Da definire',
        GUEST_USER: '',

        // --- CALCOLI REGISTRO UNIFICATO ---
        NUMERO_PAGINE: (data.sessioni || []).filter(s => !s.is_fad).length,
        DATA_VIDIMAZIONE: (data.sessioni || []).filter(s => !s.is_fad).pop()?.data_completa || '',

        // --- LISTE (LOOPS) ---

        // Lista Sessioni Completa
        SESSIONI: (data.sessioni || []).map(s => {
            const d = parseSessionDate(s.data_completa);
            return {
                data: s.data_completa,
                giorno: d.giorno,
                mese: d.mese,
                anno: d.anno,
                ora_inizio: s.ora_inizio_giornata,
                ora_fine: s.ora_fine_giornata,
                luogo: s.sede,
                durata: calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata).toFixed(1).replace('.0', ''),
                modalita: s.is_fad ? 'FAD' : 'Presenza'
            };
        }),

        // Lista Sessioni SOLO PRESENZA
        SESSIONI_PRESENZA: (data.sessioni || []).filter(s => !s.is_fad).map(s => {
            const d = parseSessionDate(s.data_completa);
            return {
                data: s.data_completa,
                giorno: d.giorno,
                mese: d.mese,
                anno: d.anno,
                ora_inizio: s.ora_inizio_giornata,
                ora_fine: s.ora_fine_giornata,
                luogo: s.sede,
                durata: calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata).toFixed(1).replace('.0', ''),
                modalita: 'Presenza'
            };
        }),

        // Lista Sessioni SOLO ONLINE (Alias per FAD)
        SESSIONI_ONLINE: fadSessions.map(s => ({
            data: s.data_completa,
            ora_inizio: s.ora_inizio_giornata,
            ora_fine: s.ora_fine_giornata,
            luogo: 'Online',
            durata: calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata).toFixed(1).replace('.0', ''),
            modalita: 'FAD'
        })),

        // Lista Sessioni FAD (per calendari specifici FAD)
        SESSIONI_FAD: fadSessions.map(s => {
            // Parse date components
            // Format expected: DD/MM/YYYY or YYYY-MM-DD
            let dateObj = new Date();
            try {
                if (s.data_completa.includes('/')) {
                    const [d, m, y] = s.data_completa.split('/');
                    dateObj = new Date(Number(y), Number(m) - 1, Number(d));
                } else {
                    dateObj = new Date(s.data_completa);
                }
            } catch (e) {
                console.error('Error parsing date', s.data_completa);
            }

            const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

            return {
                data: s.data_completa,
                DATA: s.data_completa, // Uppercase for template loop scope
                giorno: dateObj.getDate().toString().padStart(2, '0'),
                mese: mesi[dateObj.getMonth()],
                anno: dateObj.getFullYear().toString(),
                ora_inizio: s.ora_inizio_giornata,
                ORA_INIZIO: s.ora_inizio_giornata,
                ora_fine: s.ora_fine_giornata,
                ORA_FINE: s.ora_fine_giornata,
                durata: calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata).toFixed(1).replace('.0', ''),
                DURATA: calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata).toFixed(1).replace('.0', ''),

                // Nested participants list for this specific session
                // In a real scenario, this would filter based on actual attendance
                // For now, we list all enrolled participants
                PARTECIPANTI_SESSIONE: (data.partecipanti || [])
                    .sort((a, b) => a.numero - b.numero)
                    .map(p => ({
                        numero: p.numero,
                        nome: p.nome,
                        cognome: p.cognome,
                        nome_completo: p.nome_completo,
                        codice_fiscale: p.codice_fiscale,
                        ora_connessione: s.ora_inizio_giornata, // Default to session start
                        ora_disconnessione: s.ora_fine_giornata // Default to session end
                    }))
            };
        }),

        // Lista Partecipanti
        PARTECIPANTI: (data.partecipanti || [])
            .sort((a, b) => a.numero - b.numero)
            .map(p => ({
                numero: p.numero,
                NUMERO: p.numero, // Uppercase alias
                nome: p.nome,
                cognome: p.cognome,
                NOME: (p.nome || '').toUpperCase(),
                COGNOME: (p.cognome || '').toUpperCase(),
                nome_completo: p.nome_completo,
                NOME_COMPLETO: p.nome_completo, // Uppercase alias
                codice_fiscale: p.codice_fiscale,
                CODICE_FISCALE: p.codice_fiscale, // Uppercase alias
                email: p.email || '',
                EMAIL: p.email || '', // Uppercase alias
                telefono: p.telefono,
                benefits: p.benefits || 'No'
            })),

        VERBALE_DESCRIZIONE_PROVA: data.verbale?.prova?.descrizione || '',
        VERBALE_TIPO_PROVA: data.verbale?.prova?.tipo || '',
        VERBALE_DURATA_PROVA: data.verbale?.prova?.durata || '',
        VERBALE_MODALITA_PROVA: data.verbale?.prova?.modalita || '',
        VERBALE_CRITERI: data.verbale?.criteri?.descrizione || '',
        VERBALE_INDICATORI: data.verbale?.criteri?.indicatori || '',
        VERBALE_PESO: data.verbale?.criteri?.peso || '',
        VERBALE_PROTOCOLLO_SIUF: data.verbale?.protocollo_siuf || '',

        // Liste esiti
        PARTECIPANTI_PROMOSSI: data.verbale?.esiti?.positivi || [],
        PARTECIPANTI_PROMOSSI_TESTO: data.verbale?.esiti?.positivi_testo || '',
        PARTECIPANTI_BOCCIATI: data.verbale?.esiti?.negativi || [],
        PARTECIPANTI_BOCCIATI_TESTO: data.verbale?.esiti?.negativi_testo || 'nessuno',

        // --- LISTA ARGOMENTI (FLAT) ---
        LISTA_ARGOMENTI: (data.moduli || []).flatMap(modulo =>
            (modulo.argomenti || []).map(argomento => ({
                argomento: argomento,
                ARGOMENTO: argomento, // Uppercase alias
                modulo: modulo.titolo || 'Modulo',
                MODULO: modulo.titolo || 'Modulo' // Uppercase alias
            }))
        ),

        // --- RESPONSABILI (da DB) ---
        RESP_CERT_NOME: respCert?.nome || '',
        RESP_CERT_COGNOME: respCert?.cognome || '',
        RESP_CERT_NOME_COMPLETO: respCert?.nomeCompleto || '',
        RESP_CERT_DATA_NASCITA: respCert?.dataNascita || '',
        RESP_CERT_CITTA_NASCITA: respCert?.cittaNascita || '',
        RESP_CERT_PROVINCIA_NASCITA: respCert?.provinciaNascita || '',
        RESP_CERT_CITTA_RESIDENZA: respCert?.cittaResidenza || '',
        RESP_CERT_VIA_RESIDENZA: respCert?.viaResidenza || '',
        RESP_CERT_NUMERO_CIVICO: respCert?.numeroCivico || '',
        RESP_CERT_DOCUMENTO: respCert?.documento || '',

        SUPERVISORE_NOME_COMPLETO: supervisore?.nomeCompleto || '',
        SUPERVISORE_QUALIFICA: supervisore?.qualifica || '',
    };

    console.log('Generated Template Data:', JSON.stringify(result, null, 2));
    console.log('--- mapCourseDataToTemplate END ---');
    return result;
}

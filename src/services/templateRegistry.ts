
import type { CourseData } from '@/types/courseData';
import {
    generateRegistroDidattico,
    generateVerbalePartecipazione,
    generateVerbaleScrutinio,
    generateModelloFAD,
} from './wordDocumentGenerator';
import { processWordTemplate } from './wordTemplateProcessor';
import { getTemplateBlob } from '@/services/localDb';

// Define the interface for a template generator
export type TemplateGenerator = (data: CourseData) => Promise<Blob | null>;

// System templates (hardcoded logic)
export const SYSTEM_TEMPLATES = {
    REGISTRO_DIDATTICO: {
        id: 'system-registro-didattico',
        name: 'Registro Didattico',
        generator: generateRegistroDidattico,
        filename: 'Registro_Didattico',
    },
    VERBALE_PARTECIPAZIONE: {
        id: 'system-verbale-partecipazione',
        name: 'Verbale Partecipazione',
        generator: generateVerbalePartecipazione,
        filename: 'Verbale_Partecipazione',
    },
    VERBALE_SCRUTINIO: {
        id: 'system-verbale-scrutinio',
        name: 'Verbale Scrutinio',
        generator: generateVerbaleScrutinio,
        filename: 'Verbale_Scrutinio',
    },
    MODELLO_FAD: {
        id: 'system-modello-fad',
        name: 'Modello FAD (Solo se presente)',
        generator: async (data: CourseData) => {
            // Check if FAD is needed
            const hasFADSessions = (data.sessioni || []).some((session) => session.is_fad);
            const isFADCourse = data.corso?.tipo?.toLowerCase().includes('fad');

            if (hasFADSessions || isFADCourse) {
                return generateModelloFAD(data);
            }
            return null; // Skip generation
        },
        filename: 'Modello_A_FAD',
    },
} as const;

// Helper to create a generator for a local template
export const createLocalTemplateGenerator = (templatePath: string, filename: string): TemplateGenerator => {
    return async (data: CourseData) => {
        try {
            // 1. Fetch the template file
            const response = await fetch(templatePath);
            if (!response.ok) throw new Error(`Failed to load template: ${templatePath}`);
            const templateBlob = await response.blob();

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

            // Calculate FAD hours
            const fadSessions = (data.sessioni || []).filter(s => s.is_fad);
            const fadHours = fadSessions.reduce((acc, s) => {
                return acc + calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata);
            }, 0);

            const currentModule: any =
                (data as any)?.metadata?.modulo_corrente ||
                (data.moduli && data.moduli.length > 0 ? data.moduli[0] : null);
            const currentModuleNumber = currentModule?.index || 1;

            // 2. Prepare data for the template
            const templateData = {
                // --- DATI CORSO ---
                NOME_CORSO: data.corso?.titolo || '',
                ID_CORSO: currentModule?.id_corso || data.corso?.id || '', // Added specific ID_CORSO from module
                ID_SEZIONE: currentModule?.id_sezione || data.corso?.id || '', // Specific ID_SEZIONE from module
                DATA_INIZIO: data.corso?.data_inizio || '',
                DATA_FINE: data.corso?.data_fine || '',
                ORE_TOTALI: data.corso?.ore_totali || '',
                ANNO_CORSO: data.corso?.anno || new Date().getFullYear().toString(),
                MODULO_TITOLO: currentModule?.titolo || data.corso?.titolo || '',
                MODULO_ID: currentModule?.id || currentModule?.id_sezione || '',
                MODULO_ID_SEZIONE: currentModule?.id_sezione || '',
                MODULO_NUMERO: currentModuleNumber,
                MODULO_DATA_INIZIO: currentModule?.data_inizio || data.corso?.data_inizio || '',
                MODULO_DATA_FINE: currentModule?.data_fine || data.corso?.data_fine || '',

                // --- DATI ENTE ---
                ENTE_NOME: data.ente?.nome || '',
                ENTE_INDIRIZZO: data.ente?.indirizzo || '',
                SEDE_ACCREDITATA: data.ente?.accreditato?.nome || data.sede?.nome || '',
                SEDE_INDIRIZZO: data.ente?.accreditato?.via ? `${data.ente.accreditato.via}, ${data.ente.accreditato.comune}` : (data.sede?.indirizzo || ''),

                // --- DATI DOCENTE / REFERENTI ---
                NOME_DOCENTE: data.trainer?.nome_completo || '',
                CODICE_FISCALE_DOCENTE: '', // TODO: Add to Trainer interface
                DIRETTORE_CORSO: '', // TODO: Fetch from DB if needed
                TUTOR_CORSO: '', // TODO: Add to CourseData

                // --- DATI FAD (E-LEARNING) ---
                ORE_FAD: fadHours.toFixed(1).replace('.0', ''),
                PIATTAFORMA: data.calendario_fad?.strumenti || 'Zoom',
                MODALITA_GESTIONE: data.calendario_fad?.modalita || 'Sincrona',
                MODALITA_VALUTAZIONE: data.calendario_fad?.valutazione || 'Test Scritto',
                OBIETTIVI_DIDATTICI: data.calendario_fad?.obiettivi || '',

                // Placeholder for specific FAD details (can be filled if data is available or left for manual input)
                ZOOM_MEETING_ID: '',
                ZOOM_PASSCODE: '',
                ID_RIUNIONE: data.calendario_fad?.id_riunione || extractZoomDetails(data.calendario_fad?.strumenti || '').id || 'Da definire',
                PASSCODE: data.calendario_fad?.passcode || extractZoomDetails(data.calendario_fad?.strumenti || '').passcode || 'Da definire',
                GUEST_USER: '',

                // --- LISTE (LOOPS) ---

                // Lista Sessioni Completa
                SESSIONI: (data.sessioni || []).map(s => ({
                    data: s.data_completa,
                    ora_inizio: s.ora_inizio_giornata,
                    ora_fine: s.ora_fine_giornata,
                    luogo: s.sede,
                    durata: calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata).toFixed(1).replace('.0', ''),
                    modalita: s.is_fad ? 'FAD' : 'Presenza'
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
                        giorno: dateObj.getDate().toString().padStart(2, '0'),
                        mese: mesi[dateObj.getMonth()],
                        anno: dateObj.getFullYear().toString(),
                        ora_inizio: s.ora_inizio_giornata,
                        ora_fine: s.ora_fine_giornata,
                        durata: calculateDuration(s.ora_inizio_giornata, s.ora_fine_giornata).toFixed(1).replace('.0', ''),

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
                        nome: p.nome,
                        cognome: p.cognome,
                        nome_completo: p.nome_completo,
                        codice_fiscale: p.codice_fiscale,
                        email: p.email || '',
                        telefono: p.telefono,
                        benefits: p.benefits || 'No'
                    })),

                // Dynamic Placeholders for Participants (PARTECIPANTE 1, PARTECIPANTE 2, etc.)
                ...(data.partecipanti || []).reduce((acc, p, index) => {
                    const num = index + 1;
                    acc[`PARTECIPANTE ${num}`] = p.nome_completo;
                    acc[`PARTECIPANTE ${num} NOME`] = p.nome;
                    acc[`PARTECIPANTE ${num} COGNOME`] = p.cognome;
                    acc[`PARTECIPANTE ${num} CF`] = p.codice_fiscale;
                    acc[`PARTECIPANTE ${num} EMAIL`] = p.email || '';
                    acc[`PARTECIPANTE ${num} BENEFITS`] = p.benefits || 'No';
                    return acc;
                }, {} as Record<string, string>),

                // --- LISTA ARGOMENTI (Flattened) ---
                LISTA_ARGOMENTI: (data.moduli || []).flatMap(m =>
                    (m.argomenti || []).map(arg => ({
                        argomento: arg,
                        modulo: m.titolo
                    }))
                ),

                // Dynamic Placeholders for Module Arguments
                ...(data.moduli || []).reduce((acc, m, index) => {
                    const num = index + 1;
                    acc[`MODULO ${num} ARGOMENTI`] = (m.argomenti || []).join(', ');
                    return acc;
                }, {} as Record<string, string>),

                // --- LISTA SESSIONI DATE (Start/End) ---
                LISTA_SESSIONI_DATE: (data.sessioni || []).map(s => ({
                    data: s.data_completa,
                    ora_inizio: s.ora_inizio_giornata,
                    ora_fine: s.ora_fine_giornata,
                    luogo: s.sede,
                    modalita: s.is_fad ? 'FAD' : 'Presenza'
                })),

                // --- DATI VERBALE (Esame Finale) ---
                VERBALE_DATA: data.verbale?.data || data.corso?.data_fine || '',
                VERBALE_ORA: data.verbale?.ora || '',
                VERBALE_LUOGO: data.verbale?.luogo || data.sede?.nome || '',
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

                // --- RESPONSABILI (da DB) ---
                // TODO: These should be fetched from the database using the IDs in CourseData
                // For now, we provide empty placeholders
                RESP_CERT_NOME: '',
                RESP_CERT_COGNOME: '',
                RESP_CERT_DATA_NASCITA: '',
                RESP_CERT_CITTA_NASCITA: '',
                RESP_CERT_PROVINCIA_NASCITA: '',
                RESP_CERT_CITTA_RESIDENZA: '',
                RESP_CERT_VIA_RESIDENZA: '',
                RESP_CERT_NUMERO_CIVICO: '',
                RESP_CERT_DOCUMENTO: '',

                DIRETTORE_NOME_COMPLETO: '',
                DIRETTORE_QUALIFICA: '',

                SUPERVISORE_NOME_COMPLETO: '',
                SUPERVISORE_QUALIFICA: '',
            };
            // 3. Process the template
            return processWordTemplate({
                template: templateBlob,
                data: templateData,
                filename: filename // This is just for internal use in the processor
            });
        } catch (error) {
            console.error(`Error generating local template ${filename}:`, error);
            return null;
        }
    };
};

// Helper to create a generator for a DB template stored nel DB locale
export const createDbTemplateGenerator = (templateId: string, filename: string): TemplateGenerator => {
    return async (data: CourseData) => {
        try {
            const fileData = await getTemplateBlob(templateId);
            if (!fileData) throw new Error("Template non trovato");

            // 2. Prepare data (same as above - ideally extract to shared helper)
            const templateData = {
                NOME_CORSO: data.corso?.titolo || '',
                ID_SEZIONE: data.corso?.id || '',
                DATA_INIZIO: data.corso?.data_inizio || '',
                DATA_FINE: data.corso?.data_fine || '',
                ORE_TOTALI: data.corso?.ore_totali || '',
                NOME_DOCENTE: data.trainer?.nome_completo || '',
                CODICE_FISCALE_DOCENTE: '', // Trainer interface doesn't have CF yet
                SESSIONI: (data.sessioni || []).map(s => ({
                    data: s.data_completa,
                    ora_inizio: s.ora_inizio_giornata,
                    ora_fine: s.ora_fine_giornata,
                    luogo: s.sede,
                }))
            };

            // 3. Process
            return processWordTemplate({
                template: fileData.blob,
                data: templateData,
                filename: filename
            });
        } catch (error) {
            console.error(`Error generating DB template ${filename}:`, error);
            return null;
        }
    };
};

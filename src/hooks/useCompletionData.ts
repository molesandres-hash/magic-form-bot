/**
 * useCompletionData Hook
 *
 * Purpose: Manages data loading and state for the Completion Step
 * Clean Code Principle: Separation of Concerns - Data fetching logic isolated from UI
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { CourseData, EnteAccreditato, ResponsabileCorso } from "@/types/courseData";
import { getEnabledEntities, getEnabledResponsabili, getEnabledSupervisors, getEnabledLocations } from "@/utils/predefinedDataUtils";
import { listEnti, listResponsabili } from "@/services/localDb";

export const useCompletionData = (
    initialData: CourseData,
    onComplete: (data: CourseData) => void
) => {
    // Form State
    const [formData, setFormData] = useState<CourseData>(initialData);

    // Database Data State
    const [enti, setEnti] = useState<EnteAccreditato[]>([]);
    const [direttori, setDirettori] = useState<ResponsabileCorso[]>([]);
    const [supervisori, setSupervisori] = useState<ResponsabileCorso[]>([]);
    const [responsabiliCert, setResponsabiliCert] = useState<ResponsabileCorso[]>([]);
    const [loading, setLoading] = useState(true);
    const trainerFullName =
        `${formData.trainer?.nome || ''} ${formData.trainer?.cognome || ''}`.trim() ||
        formData.trainer?.nome_completo ||
        '';

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const applyFallbackData = (message?: string) => {
        const fallbackEnti: EnteAccreditato[] = getEnabledEntities().map(entity => ({
            id: `local-ente-${entity.id}`,
            nome: entity.name,
            via: entity.address,
            numero_civico: "",
            comune: "",
            cap: "",
            provincia: ""
        }));

        const supervisors = getEnabledSupervisors();
        const fallbackDirettori: ResponsabileCorso[] = supervisors.map(sup => {
            const [firstName, ...rest] = (sup.nomeCompleto || "").split(" ");
            return {
                id: `local-dir-${sup.id}`,
                tipo: "direttore",
                nome: firstName || sup.nomeCompleto,
                cognome: rest.join(" ") || sup.nomeCompleto,
                qualifica: sup.qualifica
            };
        });

        const fallbackSupervisori: ResponsabileCorso[] = supervisors.map(sup => {
            const [firstName, ...rest] = (sup.nomeCompleto || "").split(" ");
            return {
                id: `local-sup-${sup.id}`,
                tipo: "supervisore",
                nome: firstName || sup.nomeCompleto,
                cognome: rest.join(" ") || sup.nomeCompleto,
                qualifica: sup.qualifica
            };
        });

        const fallbackResponsabili: ResponsabileCorso[] = getEnabledResponsabili().map(resp => ({
            id: `local-resp-${resp.id}`,
            tipo: "responsabile_cert",
            nome: resp.nome,
            cognome: resp.cognome,
            qualifica: "Responsabile Certificazione",
            data_nascita: resp.dataNascita,
            citta_nascita: resp.cittaNascita,
            provincia_nascita: resp.provinciaNascita,
            citta_residenza: resp.cittaResidenza,
            via_residenza: resp.viaResidenza,
            numero_civico_residenza: resp.numeroCivico,
            documento_identita: resp.documento
        }));

        if (fallbackEnti.length || fallbackDirettori.length || fallbackSupervisori.length || fallbackResponsabili.length) {
            setEnti(fallbackEnti);
            setDirettori(fallbackDirettori);
            setSupervisori(fallbackSupervisori);
            setResponsabiliCert(fallbackResponsabili);
            if (message) {
                toast.info(message);
            }
        }
    };

    const loadData = async () => {
        try {
            const [entiData, responsabiliData] = await Promise.all([
                listEnti(),
                listResponsabili()
            ]);

            // Include Locations as Entities to support selection from Step 2
            const locationsAsEntities: EnteAccreditato[] = getEnabledLocations().map(loc => ({
                id: loc.id,
                nome: loc.name,
                via: loc.address,
                numero_civico: "",
                comune: "",
                cap: "",
                provincia: ""
            }));

            // Merge unique entities (prefer real entities over locations if ID conflicts, though unlikely)
            const allEnti = [...(entiData || []), ...locationsAsEntities];
            // Remove duplicates by ID
            const uniqueEnti = Array.from(new Map(allEnti.map(item => [item.id, item])).values());

            setEnti(uniqueEnti);

            const typedResponsabili = (responsabiliData || []).map(r => ({
                ...r,
                tipo: r.tipo as 'direttore' | 'supervisore' | 'responsabile_cert'
            }));

            setDirettori(typedResponsabili.filter(r => r.tipo === 'direttore'));
            setSupervisori(typedResponsabili.filter(r => r.tipo === 'supervisore'));
            setResponsabiliCert(typedResponsabili.filter(r => r.tipo === 'responsabile_cert'));

            if ((entiData?.length || 0) === 0 && (responsabiliData?.length || 0) === 0) {
                applyFallbackData("Nessun dato salvato: uso i valori predefiniti salvati in locale.");
            }
        } catch (error: any) {
            console.error("Error loading data:", error);
            toast.error("Errore caricamento dati: " + error.message);
            applyFallbackData("Errore nel recupero dei dati locali: uso i dati predefiniti salvati in locale.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-select direttore using the trainer info when possible
    useEffect(() => {
        if (!trainerFullName || formData.direttore_id || direttori.length === 0) return;

        const normalizedTrainer = trainerFullName.toLowerCase();
        const match = direttori.find((dir) =>
            `${dir.nome} ${dir.cognome}`.toLowerCase().trim() === normalizedTrainer ||
            dir.nome.toLowerCase() === normalizedTrainer ||
            dir.cognome.toLowerCase() === normalizedTrainer
        );

        if (match) {
            setFormData((prev) => ({ ...prev, direttore_id: match.id }));
        }
    }, [trainerFullName, formData.direttore_id, direttori]);

    const updateFormData = (key: keyof CourseData | Partial<CourseData>, value?: any) => {
        if (typeof key === 'string') {
            setFormData(prev => ({ ...prev, [key]: value }));
        } else {
            setFormData(prev => ({ ...prev, ...key }));
        }
    };

    const validateAndSubmit = () => {
        if (enti.length > 0 && !formData.ente_accreditato_id) {
            toast.error("Seleziona un Ente Accreditato");
            return;
        }

        if (direttori.length > 0 && !formData.direttore_id) {
            toast.error("Seleziona un Direttore");
            return;
        }

        if (supervisori.length > 0 && !formData.supervisore_id) {
            toast.error("Seleziona un Supervisore");
            return;
        }

        const updatedData: CourseData = { ...formData };

        // Applica l'ente accreditato selezionato ai dati corso
        if (formData.ente_accreditato_id) {
            const ente = enti.find(e => e.id === formData.ente_accreditato_id);
            if (ente) {
                updatedData.ente = {
                    ...formData.ente,
                    id: ente.id,
                    nome: ente.nome,
                    indirizzo: [ente.via, ente.numero_civico, ente.comune, ente.provincia].filter(Boolean).join(" "),
                    accreditato: {
                        nome: ente.nome,
                        via: ente.via,
                        numero_civico: ente.numero_civico,
                        comune: ente.comune,
                        cap: ente.cap,
                        provincia: ente.provincia
                    }
                };
            }
        }

        toast.success("Dati completati! Procedi con la generazione documenti");
        onComplete(updatedData);
    };

    return {
        formData,
        enti,
        direttori,
        supervisori,
        responsabiliCert,
        loading,
        updateFormData,
        validateAndSubmit
    };
};

/**
 * useCompletionData Hook
 *
 * Purpose: Manages data loading and state for the Completion Step
 * Clean Code Principle: Separation of Concerns - Data fetching logic isolated from UI
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { CourseData, EnteAccreditato, ResponsabileCorso } from "@/types/courseData";
import { getEnabledEntities, getEnabledResponsabili, getEnabledSupervisors } from "@/utils/predefinedDataUtils";
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

            setEnti(entiData || []);

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

        toast.success("Dati completati! Procedi con la generazione documenti");
        onComplete(formData);
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

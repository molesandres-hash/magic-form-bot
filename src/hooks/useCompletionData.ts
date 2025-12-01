/**
 * useCompletionData Hook
 *
 * Purpose: Manages data loading and state for the Completion Step
 * Clean Code Principle: Separation of Concerns - Data fetching logic isolated from UI
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { CourseData, EnteAccreditato, ResponsabileCorso } from "@/types/courseData";
import type { PredefinedOffer } from "@/types/userSettings";
import { getEnabledEntities, getEnabledResponsabili, getEnabledSupervisors, getEnabledOffers } from "@/utils/predefinedDataUtils";

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
    const [offers, setOffers] = useState<PredefinedOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const trainerFullName =
        `${formData.trainer?.nome || ''} ${formData.trainer?.cognome || ''}`.trim() ||
        formData.trainer?.nome_completo ||
        '';

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        try {
            // Load entities from predefined data and flatten them (Entity -> Sedi)
            const predefinedEntities = getEnabledEntities();
            const flattenedEnti: EnteAccreditato[] = [];

            predefinedEntities.forEach(entity => {
                if (entity.sedi && entity.sedi.length > 0) {
                    // If entity has sedi, create an entry for each enabled sede
                    entity.sedi.filter(s => s.enabled).forEach(sede => {
                        flattenedEnti.push({
                            id: `${entity.id}_${sede.id}`,
                            nome: entity.name, // Entity Name (Ragione Sociale)
                            via: sede.indirizzo,
                            numero_civico: "", // Address usually contains civic number
                            comune: sede.citta,
                            cap: sede.cap,
                            provincia: sede.provincia
                        });
                    });
                } else {
                    // Fallback for entities without sedi (shouldn't happen with new model but safe to keep)
                    flattenedEnti.push({
                        id: entity.id,
                        nome: entity.name,
                        via: entity.address,
                        numero_civico: "",
                        comune: "",
                        cap: "",
                        provincia: ""
                    });
                }
            });

            const supervisors = getEnabledSupervisors();
            const fallbackDirettori: ResponsabileCorso[] = supervisors.map(sup => {
                const [firstName, ...rest] = (sup.nomeCompleto || "").split(" ");
                return {
                    id: `local-dir-${sup.id}`,
                    tipo: "direttore",
                    nome: firstName || sup.nomeCompleto || "",
                    cognome: rest.join(" ") || sup.nomeCompleto || "",
                    qualifica: sup.qualifica
                };
            });

            const fallbackSupervisori: ResponsabileCorso[] = supervisors.map(sup => {
                const [firstName, ...rest] = (sup.nomeCompleto || "").split(" ");
                return {
                    id: `local-sup-${sup.id}`,
                    tipo: "supervisore",
                    nome: firstName || sup.nomeCompleto || "",
                    cognome: rest.join(" ") || sup.nomeCompleto || "",
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

            setEnti(flattenedEnti);
            setDirettori(fallbackDirettori);
            setSupervisori(fallbackSupervisori);
            setResponsabiliCert(fallbackResponsabili);
            setOffers(getEnabledOffers());
        } catch (error: any) {
            console.error("Error loading data:", error);
            toast.error("Errore caricamento dati: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-select direttore using the trainer info when possible
    useEffect(() => {
        if (!trainerFullName || formData.direttore_id || direttori.length === 0) return;

        const normalizedTrainer = trainerFullName.toLowerCase();
        const match = direttori.find((dir) =>
            `${dir.nome || ''} ${dir.cognome || ''}`.toLowerCase().trim() === normalizedTrainer ||
            dir.nome?.toLowerCase() === normalizedTrainer ||
            dir.cognome?.toLowerCase() === normalizedTrainer
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
        offers,
        loading,
        updateFormData,
        validateAndSubmit
    };
};

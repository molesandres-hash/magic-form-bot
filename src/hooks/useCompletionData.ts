/**
 * useCompletionData Hook
 *
 * Purpose: Manages data loading and state for the Completion Step
 * Clean Code Principle: Separation of Concerns - Data fetching logic isolated from UI
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CourseData, EnteAccreditato, ResponsabileCorso } from "@/types/courseData";

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

    const loadData = async () => {
        try {
            const [entiRes, responsabiliRes] = await Promise.all([
                supabase.from("enti_accreditati").select("*").order("nome"),
                supabase.from("responsabili_corso").select("*").order("cognome")
            ]);

            if (entiRes.error) throw entiRes.error;
            if (responsabiliRes.error) throw responsabiliRes.error;

            setEnti(entiRes.data || []);
            const responsabili = responsabiliRes.data || [];

            // Cast tipo from string to union literal type
            const typedResponsabili = responsabili.map(r => ({
                ...r,
                tipo: r.tipo as 'direttore' | 'supervisore' | 'responsabile_cert'
            }));

            setDirettori(typedResponsabili.filter(r => r.tipo === 'direttore'));
            setSupervisori(typedResponsabili.filter(r => r.tipo === 'supervisore'));
            setResponsabiliCert(typedResponsabili.filter(r => r.tipo === 'responsabile_cert'));
        } catch (error: any) {
            console.error("Error loading data:", error);
            toast.error("Errore caricamento dati: " + error.message);
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
        if (!formData.ente_accreditato_id) {
            toast.error("Seleziona un Ente Accreditato");
            return;
        }

        if (!formData.direttore_id) {
            toast.error("Seleziona un Direttore");
            return;
        }

        if (!formData.supervisore_id) {
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

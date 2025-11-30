import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { CourseData, EnteAccreditato, ResponsabileCorso } from "@/types/courseData";

interface CompletionSelectionProps {
    formData: CourseData;
    updateFormData: (updates: Partial<CourseData>) => void;
    enti: EnteAccreditato[];
    direttori: ResponsabileCorso[];
    supervisori: ResponsabileCorso[];
    responsabiliCert: ResponsabileCorso[];
}

export const CompletionSelection = ({
    formData,
    updateFormData,
    enti,
    direttori,
    supervisori,
    responsabiliCert,
}: CompletionSelectionProps) => {
    const formatEnteLabel = (ente: EnteAccreditato) => {
        const location = [ente.comune, ente.provincia].filter(Boolean).join(" ");
        if (location) return `${ente.nome} - ${location}`;
        if (ente.via) return `${ente.nome} - ${ente.via}`;
        return ente.nome;
    };

    const handleCourseIdChange = (value: string) => {
        updateFormData({
            corso: { ...formData.corso, id: value },
            moduli: formData.moduli.map((mod) => ({
                ...mod,
                id_corso: value
            }))
        });
    };

    const handleFirstSectionChange = (value: string) => {
        const updatedModuli = [...formData.moduli];
        if (updatedModuli[0]) {
            updatedModuli[0] = { ...updatedModuli[0], id_sezione: value };
        }
        updateFormData({ moduli: updatedModuli });
    };

    return (
        <AccordionItem value="selezione" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
                <span className="text-lg font-semibold">📋 Selezione Enti e Responsabili</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/40 rounded-md">
                    <div className="space-y-2">
                        <Label htmlFor="id-corso">ID Corso</Label>
                        <Input
                            id="id-corso"
                            value={formData.corso.id}
                            onChange={(e) => handleCourseIdChange(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Aggiorna il codice corso: viene propagato anche ai moduli.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="id-sezione">ID Sezione (modulo 1)</Label>
                        <Input
                            id="id-sezione"
                            value={formData.moduli[0]?.id_sezione || ""}
                            onChange={(e) => handleFirstSectionChange(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Gli altri moduli possono essere aggiornati nel riquadro Moduli.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {/* Ente Accreditato */}
                    <div>
                        <Label htmlFor="ente">Ente Accreditato *</Label>
                        {formData.ente_accreditato_id ? (
                            <div className="space-y-1">
                                <Input
                                    value={enti.find(e => e.id === formData.ente_accreditato_id)?.nome || "Ente Selezionato"}
                                    disabled
                                    className="bg-muted text-muted-foreground"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Selezionato nel passaggio precedente (Dati Aggiuntivi).
                                    <button
                                        onClick={() => updateFormData({ ente_accreditato_id: undefined })}
                                        className="ml-1 text-primary hover:underline"
                                        type="button"
                                    >
                                        Modifica
                                    </button>
                                </p>
                            </div>
                        ) : (
                            <>
                                <Select
                                    value={formData.ente_accreditato_id || ""}
                                    onValueChange={(value) => updateFormData({ ente_accreditato_id: value })}
                                >
                                    <SelectTrigger id="ente">
                                        <SelectValue placeholder="Seleziona ente accreditato" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {enti.map(ente => (
                                            <SelectItem key={ente.id} value={ente.id}>
                                                {formatEnteLabel(ente)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {enti.length === 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Nessun ente disponibile. Contatta l'amministratore.
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Direttore */}
                    <div>
                        <Label htmlFor="direttore">Direttore del Corso *</Label>
                        <Select
                            value={formData.direttore_id || ""}
                            onValueChange={(value) => updateFormData({ direttore_id: value })}
                        >
                            <SelectTrigger id="direttore">
                                <SelectValue placeholder="Seleziona direttore" />
                            </SelectTrigger>
                            <SelectContent>
                                {direttori.map(dir => (
                                    <SelectItem key={dir.id} value={dir.id}>
                                        {dir.nome} {dir.cognome} {dir.qualifica ? `- ${dir.qualifica}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {direttori.length === 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Nessun direttore disponibile. Contatta l'amministratore.
                            </p>
                        )}
                    </div>

                    {/* Supervisore */}
                    <div>
                        <Label htmlFor="supervisore">Supervisore *</Label>
                        <Select
                            value={formData.supervisore_id || ""}
                            onValueChange={(value) => updateFormData({ supervisore_id: value })}
                        >
                            <SelectTrigger id="supervisore">
                                <SelectValue placeholder="Seleziona supervisore" />
                            </SelectTrigger>
                            <SelectContent>
                                {supervisori.map(sup => (
                                    <SelectItem key={sup.id} value={sup.id}>
                                        {sup.nome} {sup.cognome} {sup.qualifica ? `- ${sup.qualifica}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {supervisori.length === 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Nessun supervisore disponibile. Contatta l'amministratore.
                            </p>
                        )}
                    </div>

                    {/* Responsabile Certificazione */}
                    <div>
                        <Label htmlFor="resp_cert">Responsabile Certificazione (opzionale)</Label>
                        <Select
                            value={formData.responsabile_cert_id || ""}
                            onValueChange={(value) => updateFormData({ responsabile_cert_id: value })}
                        >
                            <SelectTrigger id="resp_cert">
                                <SelectValue placeholder="Seleziona responsabile certificazione" />
                            </SelectTrigger>
                            <SelectContent>
                                {responsabiliCert.map(resp => (
                                    <SelectItem key={resp.id} value={resp.id}>
                                        {resp.nome} {resp.cognome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

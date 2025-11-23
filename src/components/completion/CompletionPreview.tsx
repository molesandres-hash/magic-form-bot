import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { CourseData } from "@/types/courseData";

interface CompletionPreviewProps {
    formData: CourseData;
}

export const CompletionPreview = ({ formData }: CompletionPreviewProps) => {
    return (
        <AccordionItem value="preview" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
                <span className="text-lg font-semibold">👁️ Riepilogo Dati Corso</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">📚 Corso</h4>
                        <p><span className="text-muted-foreground">ID:</span> {formData.corso.id}</p>
                        <p><span className="text-muted-foreground">Titolo:</span> {formData.corso.titolo}</p>
                        <p><span className="text-muted-foreground">Tipo:</span> {formData.corso.tipo}</p>
                        <p><span className="text-muted-foreground">Date:</span> {formData.corso.data_inizio} - {formData.corso.data_fine}</p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-2">📖 Moduli</h4>
                        <p><span className="text-muted-foreground">Totale moduli:</span> {formData.moduli.length}</p>
                        <p><span className="text-muted-foreground">Ore totali corso:</span> {
                            formData.moduli.reduce((sum, mod) => {
                                const ore = parseInt(mod.ore_totali) || 0;
                                return sum + ore;
                            }, 0)
                        } ore</p>
                        <p><span className="text-muted-foreground">Sessioni totali:</span> {
                            formData.moduli.reduce((sum, mod) => sum + mod.numero_sessioni, 0)
                        }</p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-2">👥 Partecipanti</h4>
                        <p><span className="text-muted-foreground">Totale:</span> {formData.partecipanti_count}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formData.partecipanti.slice(0, 3).map(p => p.nome_completo).join(", ")}
                            {formData.partecipanti.length > 3 && "..."}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-2">📅 Registro</h4>
                        <p><span className="text-muted-foreground">Sessioni totali:</span> {formData.sessioni.length}</p>
                        <p><span className="text-muted-foreground">In presenza:</span> {formData.sessioni_presenza.length}</p>
                        <p><span className="text-muted-foreground">Pagine registro:</span> {formData.registro.numero_pagine}</p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Wand2, Plus, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";
import { getStoredApiKey } from "@/components/settings/ApiKeySettings";
import type { Modulo } from "@/types/courseData";

interface CompletionModulesProps {
    modules: Modulo[];
    onUpdate?: (updatedModules: Modulo[]) => void;
}

export const CompletionModules = ({ modules, onUpdate }: CompletionModulesProps) => {
    const [newArg, setNewArg] = useState<string>("");
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const canEdit = Boolean(onUpdate);

    const handleAddArg = (moduleIndex: number) => {
        if (!newArg.trim() || !onUpdate) return;

        const updatedModules = [...modules];
        const currentArgs = updatedModules[moduleIndex].argomenti || [];
        updatedModules[moduleIndex] = {
            ...updatedModules[moduleIndex],
            argomenti: [...currentArgs, newArg.trim()]
        };

        onUpdate(updatedModules);
        setNewArg("");
    };

    const handleRemoveArg = (moduleIndex: number, argIndex: number) => {
        if (!onUpdate) return;

        const updatedModules = [...modules];
        const currentArgs = updatedModules[moduleIndex].argomenti || [];
        updatedModules[moduleIndex] = {
            ...updatedModules[moduleIndex],
            argomenti: currentArgs.filter((_, idx) => idx !== argIndex)
        };

        onUpdate(updatedModules);
    };

    const handleGenerateAI = async (moduleIndex: number, moduleTitle: string) => {
        if (!onUpdate) return;

        const apiKey = getStoredApiKey();
        if (!apiKey) {
            toast.error("API Key non trovata. Configurala nelle impostazioni.");
            return;
        }

        setGeneratingId(modules[moduleIndex].id);
        toast.info("Generazione argomenti in corso...");

        try {
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `Genera una lista di 5-7 argomenti didattici dettagliati per un modulo formativo intitolato: "${moduleTitle}".
            Restituisci SOLO un elenco puntato semplice, senza numeri o prefissi. Esempio:
            Argomento 1
            Argomento 2
            Argomento 3`;

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const text = result.text || "";

            const generatedArgs = text.split('\n')
                .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
                .filter(line => line.length > 0);

            if (generatedArgs.length > 0) {
                const updatedModules = [...modules];
                const currentArgs = updatedModules[moduleIndex].argomenti || [];
                // Merge avoiding duplicates
                const newArgs = [...new Set([...currentArgs, ...generatedArgs])];

                updatedModules[moduleIndex] = {
                    ...updatedModules[moduleIndex],
                    argomenti: newArgs
                };

                onUpdate(updatedModules);
                toast.success("Argomenti generati con successo!");
            } else {
                toast.warning("Nessun argomento generato.");
            }
        } catch (error) {
            console.error("AI Generation error:", error);
            toast.error("Errore durante la generazione AI.");
        } finally {
            setGeneratingId(null);
        }
    };

    const handleModuleFieldChange = (moduleIndex: number, field: keyof Modulo, value: string) => {
        if (!onUpdate) return;
        const updatedModules = [...modules];
        updatedModules[moduleIndex] = {
            ...updatedModules[moduleIndex],
            [field]: value
        };
        onUpdate(updatedModules);
    };

    return (
        <AccordionItem value="moduli" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
                <span className="text-lg font-semibold">📚 Moduli del Corso ({modules.length})</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {modules.map((modulo, idx) => (
                        <AccordionItem key={modulo.id} value={`modulo-${idx}`} className="border rounded-md">
                            <AccordionTrigger className="px-4 hover:no-underline">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="font-semibold">Modulo {idx + 1}</span>
                                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {modulo.titolo}
                                    </span>
                                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                                        ID Corso: {modulo.id_corso}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-4 space-y-6">
                                    {/* Identificativi editabili */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/20 p-3 rounded-md">
                                        <div className="space-y-1">
                                            <Label htmlFor={`id-corso-${idx}`} className="text-xs font-semibold">
                                                ID Corso
                                            </Label>
                                            <Input
                                                id={`id-corso-${idx}`}
                                                value={modulo.id_corso}
                                                onChange={(e) => handleModuleFieldChange(idx, "id_corso", e.target.value)}
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`id-sezione-${idx}`} className="text-xs font-semibold">
                                                ID Sezione
                                            </Label>
                                            <Input
                                                id={`id-sezione-${idx}`}
                                                value={modulo.id_sezione}
                                                onChange={(e) => handleModuleFieldChange(idx, "id_sezione", e.target.value)}
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="space-y-1 md:col-span-1">
                                            <Label htmlFor={`titolo-${idx}`} className="text-xs font-semibold">
                                                Titolo Modulo
                                            </Label>
                                            <Input
                                                id={`titolo-${idx}`}
                                                value={modulo.titolo}
                                                onChange={(e) => handleModuleFieldChange(idx, "titolo", e.target.value)}
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </div>

                                    {/* Dati Generali */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">Date</p>
                                            <p className="text-sm text-muted-foreground">
                                                {modulo.data_inizio} - {modulo.data_fine}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Ore Totali</p>
                                            <p className="text-sm text-muted-foreground">{modulo.ore_totali}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Sessioni</p>
                                            <p className="text-sm text-muted-foreground">
                                                {modulo.numero_sessioni} totali ({modulo.sessioni_presenza.length} in presenza)
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Stato</p>
                                            <p className="text-sm text-muted-foreground">{modulo.stato}</p>
                                        </div>
                                    </div>

                                    {/* Gestione Argomenti */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Argomenti Didattici
                                            </h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleGenerateAI(idx, modulo.titolo)}
                                                disabled={generatingId === modulo.id || !onUpdate}
                                            >
                                                <Wand2 className={`mr-2 h-3 w-3 ${generatingId === modulo.id ? 'animate-spin' : ''}`} />
                                                {generatingId === modulo.id ? 'Generazione...' : 'Genera con AI'}
                                            </Button>
                                        </div>

                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Aggiungi argomento manualmente..."
                                                value={newArg}
                                                onChange={(e) => setNewArg(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddArg(idx);
                                                    }
                                                }}
                                                disabled={!onUpdate}
                                            />
                                            <Button size="icon" onClick={() => handleAddArg(idx)} disabled={!onUpdate}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-accent/5 rounded-lg border border-dashed">
                                            {(modulo.argomenti && modulo.argomenti.length > 0) ? (
                                                modulo.argomenti.map((arg, argIdx) => (
                                                    <Badge key={argIdx} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                                        {arg}
                                                        {onUpdate && (
                                                            <button
                                                                onClick={() => handleRemoveArg(idx, argIdx)}
                                                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic w-full text-center py-2">
                                                    Nessun argomento inserito. Usa l'AI o aggiungili manualmente.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lista sessioni del modulo */}
                                    <div>
                                        <p className="text-sm font-semibold mb-2">Dettaglio Sessioni:</p>
                                        <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
                                            {modulo.sessioni.map((sess, sIdx) => (
                                                <div key={sIdx} className="text-xs p-2 hover:bg-accent/50 rounded flex justify-between items-center">
                                                    <span className="font-medium">{sess.data_completa}</span>
                                                    <span className="text-muted-foreground">{sess.ora_inizio_giornata} - {sess.ora_fine_giornata}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sess.is_fad ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                                        }`}>
                                                        {sess.is_fad ? "FAD" : "Presenza"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </AccordionContent>
        </AccordionItem>
    );
};

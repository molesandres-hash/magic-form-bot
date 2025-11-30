import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Brain,
    Plus,
    Trash2,
    Save,
    RotateCcw,
    Code,
    FileJson,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    getSystemInstruction,
    saveSystemInstruction,
    resetToDefaults
} from '@/services/configService';
import {
    getMappings,
    saveMapping,
    deleteMapping,
} from '@/services/mappingService';
import type { FieldMapping } from '@/services/localDb';

export const ExtractionSettings = () => {
    // System Instruction State
    const [systemInstruction, setSystemInstruction] = useState('');
    const [isLoadingInstruction, setIsLoadingInstruction] = useState(true);

    // Mappings State
    const [mappings, setMappings] = useState<FieldMapping[]>([]);
    const [newMapping, setNewMapping] = useState<Partial<FieldMapping>>({});
    const [isLoadingMappings, setIsLoadingMappings] = useState(true);

    // Load Data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const instruction = await getSystemInstruction();
            setSystemInstruction(instruction);
            setIsLoadingInstruction(false);

            const loadedMappings = await getMappings();
            setMappings(loadedMappings);
            setIsLoadingMappings(false);
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Errore nel caricamento delle impostazioni');
        }
    };

    // System Instruction Handlers
    const handleSaveInstruction = async () => {
        try {
            await saveSystemInstruction(systemInstruction);
            toast.success('System prompt salvato!');
        } catch (error) {
            toast.error('Errore durante il salvataggio');
        }
    };

    const handleResetDefaults = async () => {
        if (!confirm('Sei sicuro di voler ripristinare le impostazioni predefinite?')) return;
        try {
            await resetToDefaults();
            await loadData();
            toast.success('Impostazioni ripristinate!');
        } catch (error) {
            toast.error('Errore durante il ripristino');
        }
    };

    // Mappings Handlers
    const handleAddMapping = async () => {
        if (!newMapping.placeholder || !newMapping.path) {
            toast.error('Placeholder e Percorso JSON sono obbligatori');
            return;
        }

        try {
            const mapping: FieldMapping = {
                placeholder: newMapping.placeholder.toUpperCase(),
                path: newMapping.path,
                description: newMapping.description || '',
            };

            await saveMapping(mapping);
            setNewMapping({});
            await loadData(); // Reload to get ID
            toast.success('Mapping aggiunto!');
        } catch (error) {
            toast.error('Errore durante il salvataggio del mapping');
        }
    };

    const handleDeleteMapping = async (id: number) => {
        if (!confirm('Sei sicuro di voler eliminare questo mapping?')) return;
        try {
            await deleteMapping(id);
            await loadData();
            toast.success('Mapping rimosso');
        } catch (error) {
            toast.error('Errore durante la rimozione');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-primary" />
                                Configurazione AI & Estrazione
                            </CardTitle>
                            <CardDescription>
                                Gestisci il prompt dell'AI e la mappatura dei campi per i documenti
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleResetDefaults} className="gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Ripristina Default
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <Accordion type="multiple" defaultValue={['mappings']} className="space-y-4">
                {/* SYSTEM PROMPT */}
                <AccordionItem value="prompt">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Code className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">System Prompt</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Istruzioni per l'estrazione dati (Gemini AI)
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Istruzioni di Sistema</Label>
                                    <Textarea
                                        value={systemInstruction}
                                        onChange={(e) => setSystemInstruction(e.target.value)}
                                        className="min-h-[300px] font-mono text-sm"
                                        placeholder="Inserisci qui il prompt di sistema..."
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveInstruction} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        Salva Prompt
                                    </Button>
                                </div>
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                {/* FIELD MAPPINGS */}
                <AccordionItem value="mappings">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <FileJson className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">Mappatura Campi</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Collega i placeholder dei documenti ai campi JSON estratti
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                {/* Add New Form */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-accent/5 rounded-lg">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Placeholder (es. NOME_CORSO)</Label>
                                        <Input
                                            placeholder="NOME_CORSO"
                                            value={newMapping.placeholder || ''}
                                            onChange={(e) => setNewMapping({ ...newMapping, placeholder: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Percorso JSON (es. corso.titolo)</Label>
                                        <Input
                                            placeholder="corso.titolo"
                                            value={newMapping.path || ''}
                                            onChange={(e) => setNewMapping({ ...newMapping, path: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Descrizione</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Descrizione opzionale"
                                                value={newMapping.description || ''}
                                                onChange={(e) => setNewMapping({ ...newMapping, description: e.target.value })}
                                            />
                                            <Button onClick={handleAddMapping} size="icon">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="border rounded-lg divide-y">
                                    {mappings.length > 0 ? (
                                        mappings.map((mapping) => (
                                            <div
                                                key={mapping.id}
                                                className="flex items-center justify-between p-3 hover:bg-accent/5 transition-colors"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                                    <div className="font-mono text-sm font-medium text-primary">
                                                        {`{{${mapping.placeholder}}}`}
                                                    </div>
                                                    <div className="font-mono text-sm text-muted-foreground">
                                                        {mapping.path}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground truncate">
                                                        {mapping.description}
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => mapping.id && handleDeleteMapping(mapping.id)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive ml-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-sm text-muted-foreground py-8">
                                            Nessun mapping configurato
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

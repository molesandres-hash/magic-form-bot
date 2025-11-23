/**
 * Predefined Data Settings Component
 *
 * Purpose: Manage predefined data for common fields that cannot be auto-extracted
 * Provides dropdown options for: locations, entities, responsables, supervisors, trainers, platforms
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Database,
    Plus,
    Trash2,
    Save,
    MapPin,
    Building2,
    UserCheck,
    Users,
    GraduationCap,
    Video,
    Edit2,
    Check,
    X,
    Download,
    Upload,
    BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import {
    loadPredefinedData,
    savePredefinedData,
    generatePredefinedDataId,
    validateCodiceFiscale,
    validateDateFormat,
    exportPredefinedData,
    importPredefinedData,
} from '@/utils/predefinedDataUtils';
import type {
    PredefinedDataSettings,
    PredefinedLocation,
    PredefinedEntity,
    PredefinedResponsabile,
    PredefinedSupervisor,
    PredefinedTrainer,
    PredefinedPlatform,
    PredefinedArgumentList,
} from '@/types/userSettings';

// ============================================================================
// COMPONENT
// ============================================================================

const PredefinedDataSettings = () => {
    const [data, setData] = useState<PredefinedDataSettings>(loadPredefinedData());
    const [editingId, setEditingId] = useState<string | null>(null);

    // Argument Lists State
    const [newArgListName, setNewArgListName] = useState('');
    const [newArgListContent, setNewArgListContent] = useState(''); // Newline separated

    // ========================================================================
    // SAVE HANDLER
    // ========================================================================

    const handleSave = () => {
        try {
            savePredefinedData(data);
            toast.success('Dati predefiniti salvati!');
        } catch (error) {
            toast.error('Errore durante il salvataggio');
        }
    };

    const handleExport = () => {
        try {
            exportPredefinedData();
            toast.success('Dati esportati con successo!');
        } catch (error) {
            toast.error('Errore durante l\'esportazione');
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const importedData = await importPredefinedData(file);
            setData(importedData);
            toast.success('Dati importati con successo!');
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(`Errore durante l'importazione: ${error.message || 'File non valido'}`);
        }

        // Reset input to allow re-importing the same file
        event.target.value = '';
    };

    // ========================================================================
    // LOCATIONS
    // ========================================================================

    const [newLocation, setNewLocation] = useState<Partial<PredefinedLocation>>({});

    const handleAddLocation = () => {
        if (!newLocation.name || !newLocation.address) {
            toast.error('Nome e indirizzo sono obbligatori');
            return;
        }

        const location: PredefinedLocation = {
            id: generatePredefinedDataId('location'),
            name: newLocation.name,
            address: newLocation.address,
            enabled: true,
        };

        setData((prev) => ({
            ...prev,
            locations: [...prev.locations, location],
        }));

        setNewLocation({});
        toast.success('Sede aggiunta!');
    };

    const handleRemoveLocation = (id: string) => {
        setData((prev) => ({
            ...prev,
            locations: prev.locations.filter((l) => l.id !== id),
        }));
        toast.success('Sede rimossa');
    };

    const handleToggleLocation = (id: string) => {
        setData((prev) => ({
            ...prev,
            locations: prev.locations.map((l) =>
                l.id === id ? { ...l, enabled: !l.enabled } : l
            ),
        }));
    };

    // ========================================================================
    // ENTITIES
    // ========================================================================

    const [newEntity, setNewEntity] = useState<Partial<PredefinedEntity>>({});

    const handleAddEntity = () => {
        if (!newEntity.name || !newEntity.address) {
            toast.error('Nome e indirizzo sono obbligatori');
            return;
        }

        const entity: PredefinedEntity = {
            id: generatePredefinedDataId('entity'),
            name: newEntity.name,
            address: newEntity.address,
            enabled: true,
        };

        setData((prev) => ({
            ...prev,
            entities: [...prev.entities, entity],
        }));

        setNewEntity({});
        toast.success('Ente aggiunto!');
    };

    const handleRemoveEntity = (id: string) => {
        setData((prev) => ({
            ...prev,
            entities: prev.entities.filter((e) => e.id !== id),
        }));
        toast.success('Ente rimosso');
    };

    const handleToggleEntity = (id: string) => {
        setData((prev) => ({
            ...prev,
            entities: prev.entities.map((e) =>
                e.id === id ? { ...e, enabled: !e.enabled } : e
            ),
        }));
    };

    // ========================================================================
    // TRAINERS
    // ========================================================================

    const [newTrainer, setNewTrainer] = useState<Partial<PredefinedTrainer>>({});

    const handleAddTrainer = () => {
        if (!newTrainer.nome || !newTrainer.cognome || !newTrainer.codiceFiscale) {
            toast.error('Nome, cognome e codice fiscale sono obbligatori');
            return;
        }

        if (!validateCodiceFiscale(newTrainer.codiceFiscale)) {
            toast.error('Codice fiscale non valido');
            return;
        }

        const trainer: PredefinedTrainer = {
            id: generatePredefinedDataId('trainer'),
            nome: newTrainer.nome,
            cognome: newTrainer.cognome,
            codiceFiscale: newTrainer.codiceFiscale.toUpperCase(),
            enabled: true,
        };

        setData((prev) => ({
            ...prev,
            trainers: [...prev.trainers, trainer],
        }));

        setNewTrainer({});
        toast.success('Trainer aggiunto!');
    };

    const handleRemoveTrainer = (id: string) => {
        setData((prev) => ({
            ...prev,
            trainers: prev.trainers.filter((t) => t.id !== id),
        }));
        toast.success('Trainer rimosso');
    };

    const handleToggleTrainer = (id: string) => {
        setData((prev) => ({
            ...prev,
            trainers: prev.trainers.map((t) =>
                t.id === id ? { ...t, enabled: !t.enabled } : t
            ),
        }));
    };

    // ========================================================================
    // PLATFORMS
    // ========================================================================

    const [newPlatform, setNewPlatform] = useState<Partial<PredefinedPlatform>>({});

    const handleAddPlatform = () => {
        if (!newPlatform.name) {
            toast.error('Nome piattaforma obbligatorio');
            return;
        }

        const platform: PredefinedPlatform = {
            id: generatePredefinedDataId('platform'),
            name: newPlatform.name,
            link: newPlatform.link || undefined,
            enabled: true,
        };

        setData((prev) => ({
            ...prev,
            platforms: [...prev.platforms, platform],
        }));

        setNewPlatform({});
        toast.success('Piattaforma aggiunta!');
    };

    const handleRemovePlatform = (id: string) => {
        setData((prev) => ({
            ...prev,
            platforms: prev.platforms.filter((p) => p.id !== id),
        }));
        toast.success('Piattaforma rimossa');
    };

    const handleTogglePlatform = (id: string) => {
        setData((prev) => ({
            ...prev,
            platforms: prev.platforms.map((p) =>
                p.id === id ? { ...p, enabled: !p.enabled } : p
            ),
        }));
    };

    // ========================================================================
    // ARGUMENT LISTS
    // ========================================================================

    const handleAddArgList = () => {
        if (!newArgListName.trim()) {
            toast.error('Nome della lista obbligatorio');
            return;
        }

        const argumentsArray = newArgListContent
            .split('\n')
            .map((arg) => arg.trim())
            .filter((arg) => arg.length > 0);

        if (argumentsArray.length === 0) {
            toast.error('Inserisci almeno un argomento');
            return;
        }

        const argList: PredefinedArgumentList = {
            id: generatePredefinedDataId('arglist'),
            name: newArgListName.trim(),
            arguments: argumentsArray,
            enabled: true,
        };

        setData((prev) => ({
            ...prev,
            argumentLists: [...(prev.argumentLists || []), argList],
        }));

        setNewArgListName('');
        setNewArgListContent('');
        toast.success('Lista argomenti aggiunta!');
    };

    const handleRemoveArgList = (id: string) => {
        setData((prev) => ({
            ...prev,
            argumentLists: (prev.argumentLists || []).filter((a) => a.id !== id),
        }));
        toast.success('Lista argomenti rimossa');
    };

    const handleToggleArgList = (id: string) => {
        setData((prev) => ({
            ...prev,
            argumentLists: (prev.argumentLists || []).map((a) =>
                a.id === id ? { ...a, enabled: !a.enabled } : a
            ),
        }));
    };

    // ========================================================================
    // RESPONSABILI
    // ========================================================================

    const [newResponsabile, setNewResponsabile] = useState<Partial<PredefinedResponsabile>>({});

    const handleAddResponsabile = () => {
        if (!newResponsabile.nome || !newResponsabile.cognome || !newResponsabile.documento) {
            toast.error('Nome, cognome e documento sono obbligatori');
            return;
        }

        const responsabile: PredefinedResponsabile = {
            id: generatePredefinedDataId('responsabile'),
            nome: newResponsabile.nome,
            cognome: newResponsabile.cognome,
            dataNascita: newResponsabile.dataNascita || '',
            cittaNascita: newResponsabile.cittaNascita || '',
            provinciaNascita: newResponsabile.provinciaNascita || '',
            cittaResidenza: newResponsabile.cittaResidenza || '',
            viaResidenza: newResponsabile.viaResidenza || '',
            numeroCivico: newResponsabile.numeroCivico || '',
            documento: newResponsabile.documento,
            enabled: true,
        };

        setData((prev) => ({
            ...prev,
            responsabili: [...prev.responsabili, responsabile],
        }));

        setNewResponsabile({});
        toast.success('Responsabile aggiunto!');
    };

    const handleRemoveResponsabile = (id: string) => {
        setData((prev) => ({
            ...prev,
            responsabili: prev.responsabili.filter((r) => r.id !== id),
        }));
        toast.success('Responsabile rimosso');
    };

    const handleToggleResponsabile = (id: string) => {
        setData((prev) => ({
            ...prev,
            responsabili: prev.responsabili.map((r) =>
                r.id === id ? { ...r, enabled: !r.enabled } : r
            ),
        }));
    };

    // ========================================================================
    // SUPERVISORI
    // ========================================================================

    const [newSupervisor, setNewSupervisor] = useState<Partial<PredefinedSupervisor>>({});

    const handleAddSupervisor = () => {
        if (!newSupervisor.nomeCompleto || !newSupervisor.qualifica) {
            toast.error('Nome completo e qualifica sono obbligatori');
            return;
        }

        const supervisor: PredefinedSupervisor = {
            id: generatePredefinedDataId('supervisor'),
            nomeCompleto: newSupervisor.nomeCompleto,
            qualifica: newSupervisor.qualifica,
            enabled: true,
        };

        setData((prev) => ({
            ...prev,
            supervisors: [...prev.supervisors, supervisor],
        }));

        setNewSupervisor({});
        toast.success('Supervisore aggiunto!');
    };

    const handleRemoveSupervisor = (id: string) => {
        setData((prev) => ({
            ...prev,
            supervisors: prev.supervisors.filter((s) => s.id !== id),
        }));
        toast.success('Supervisore rimosso');
    };

    const handleToggleSupervisor = (id: string) => {
        setData((prev) => ({
            ...prev,
            supervisors: prev.supervisors.map((s) =>
                s.id === id ? { ...s, enabled: !s.enabled } : s
            ),
        }));
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Dati Predefiniti
                            </CardTitle>
                            <CardDescription>
                                Configura dati riutilizzabili che appariranno come opzioni nei menu a tendina del wizard
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Importa
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                                <Download className="h-4 w-4" />
                                Esporta
                            </Button>
                            <Button onClick={handleSave} size="sm" className="gap-2">
                                <Save className="h-4 w-4" />
                                Salva
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Accordion for Categories */}
            <Accordion type="multiple" className="space-y-4">
                {/* LOCATIONS */}
                <AccordionItem value="locations">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">Sedi Accreditate</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {data.locations.length} sedi configurate
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                {/* Add New Form */}
                                <div className="grid grid-cols-2 gap-3 p-4 bg-accent/5 rounded-lg">
                                    <Input
                                        placeholder="Nome sede"
                                        value={newLocation.name || ''}
                                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Indirizzo completo"
                                        value={newLocation.address || ''}
                                        onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                                    />
                                    <Button onClick={handleAddLocation} size="sm" className="col-span-2">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Aggiungi Sede
                                    </Button>
                                </div>

                                {/* List */}
                                {data.locations.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.locations.map((location) => (
                                            <div
                                                key={location.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{location.name}</p>
                                                    <p className="text-sm text-muted-foreground">{location.address}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={location.enabled}
                                                        onCheckedChange={() => handleToggleLocation(location.id)}
                                                    />
                                                    <Button
                                                        onClick={() => handleRemoveLocation(location.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        Nessuna sede configurata
                                    </p>
                                )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                {/* ENTITIES */}
                <AccordionItem value="entities">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">Enti</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {data.entities.length} enti configurati
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                {/* Add New Form */}
                                <div className="grid grid-cols-2 gap-3 p-4 bg-accent/5 rounded-lg">
                                    <Input
                                        placeholder="Nome ente"
                                        value={newEntity.name || ''}
                                        onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Indirizzo completo"
                                        value={newEntity.address || ''}
                                        onChange={(e) => setNewEntity({ ...newEntity, address: e.target.value })}
                                    />
                                    <Button onClick={handleAddEntity} size="sm" className="col-span-2">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Aggiungi Ente
                                    </Button>
                                </div>

                                {/* List */}
                                {data.entities.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.entities.map((entity) => (
                                            <div
                                                key={entity.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{entity.name}</p>
                                                    <p className="text-sm text-muted-foreground">{entity.address}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={entity.enabled}
                                                        onCheckedChange={() => handleToggleEntity(entity.id)}
                                                    />
                                                    <Button
                                                        onClick={() => handleRemoveEntity(entity.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        Nessun ente configurato
                                    </p>
                                )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                {/* RESPONSABILI */}
                <AccordionItem value="responsabili">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <UserCheck className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">Responsabili Certificazione</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {data.responsabili.length} responsabili configurati
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                {/* Add New Form */}
                                <div className="grid grid-cols-2 gap-3 p-4 bg-accent/5 rounded-lg">
                                    <Input
                                        placeholder="Nome"
                                        value={newResponsabile.nome || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, nome: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Cognome"
                                        value={newResponsabile.cognome || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, cognome: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Data di Nascita (GG/MM/AAAA)"
                                        value={newResponsabile.dataNascita || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, dataNascita: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Città di Nascita"
                                        value={newResponsabile.cittaNascita || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, cittaNascita: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Provincia Nascita"
                                        value={newResponsabile.provinciaNascita || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, provinciaNascita: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Città Residenza"
                                        value={newResponsabile.cittaResidenza || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, cittaResidenza: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Via Residenza"
                                        value={newResponsabile.viaResidenza || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, viaResidenza: e.target.value })}
                                    />
                                    <Input
                                        placeholder="N. Civico"
                                        value={newResponsabile.numeroCivico || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, numeroCivico: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Documento Identità"
                                        className="col-span-2"
                                        value={newResponsabile.documento || ''}
                                        onChange={(e) => setNewResponsabile({ ...newResponsabile, documento: e.target.value })}
                                    />
                                    <Button onClick={handleAddResponsabile} size="sm" className="col-span-2">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Aggiungi Responsabile
                                    </Button>
                                </div>

                                {/* List */}
                                {data.responsabili.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.responsabili.map((resp) => (
                                            <div
                                                key={resp.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">
                                                        {resp.nome} {resp.cognome}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {resp.documento}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={resp.enabled}
                                                        onCheckedChange={() => handleToggleResponsabile(resp.id)}
                                                    />
                                                    <Button
                                                        onClick={() => handleRemoveResponsabile(resp.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        Nessun responsabile configurato
                                    </p>
                                )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                {/* SUPERVISORI */}
                <AccordionItem value="supervisors">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">Supervisori</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {data.supervisors.length} supervisori configurati
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                {/* Add New Form */}
                                <div className="grid grid-cols-2 gap-3 p-4 bg-accent/5 rounded-lg">
                                    <Input
                                        placeholder="Nome Completo"
                                        value={newSupervisor.nomeCompleto || ''}
                                        onChange={(e) => setNewSupervisor({ ...newSupervisor, nomeCompleto: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Qualifica"
                                        value={newSupervisor.qualifica || ''}
                                        onChange={(e) => setNewSupervisor({ ...newSupervisor, qualifica: e.target.value })}
                                    />
                                    <Button onClick={handleAddSupervisor} size="sm" className="col-span-2">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Aggiungi Supervisore
                                    </Button>
                                </div>

                                {/* List */}
                                {data.supervisors.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.supervisors.map((sup) => (
                                            <div
                                                key={sup.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{sup.nomeCompleto}</p>
                                                    <p className="text-sm text-muted-foreground">{sup.qualifica}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={sup.enabled}
                                                        onCheckedChange={() => handleToggleSupervisor(sup.id)}
                                                    />
                                                    <Button
                                                        onClick={() => handleRemoveSupervisor(sup.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        Nessun supervisore configurato
                                    </p>
                                )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                {/* TRAINERS */}
                <AccordionItem value="trainers">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">Trainer/Docenti</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {data.trainers.length} trainer configurati
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                {/* Add New Form */}
                                <div className="grid grid-cols-3 gap-3 p-4 bg-accent/5 rounded-lg">
                                    <Input
                                        placeholder="Nome"
                                        value={newTrainer.nome || ''}
                                        onChange={(e) => setNewTrainer({ ...newTrainer, nome: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Cognome"
                                        value={newTrainer.cognome || ''}
                                        onChange={(e) => setNewTrainer({ ...newTrainer, cognome: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Codice Fiscale"
                                        className="font-mono uppercase"
                                        maxLength={16}
                                        value={newTrainer.codiceFiscale || ''}
                                        onChange={(e) =>
                                            setNewTrainer({ ...newTrainer, codiceFiscale: e.target.value.toUpperCase() })
                                        }
                                    />
                                    <Button onClick={handleAddTrainer} size="sm" className="col-span-3">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Aggiungi Trainer
                                    </Button>
                                </div>

                                {/* List */}
                                {data.trainers.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.trainers.map((trainer) => (
                                            <div
                                                key={trainer.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">
                                                        {trainer.nome} {trainer.cognome}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground font-mono">
                                                        {trainer.codiceFiscale}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={trainer.enabled}
                                                        onCheckedChange={() => handleToggleTrainer(trainer.id)}
                                                    />
                                                    <Button
                                                        onClick={() => handleRemoveTrainer(trainer.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        Nessun trainer configurato
                                    </p>
                                )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                {/* PLATFORMS */}
                <AccordionItem value="platforms">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Video className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">Piattaforme FAD</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {data.platforms.length} piattaforme configurate
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                {/* Add New Form */}
                                <div className="grid gap-3 p-4 bg-accent/5 rounded-lg">
                                    <Input
                                        placeholder="Nome piattaforma (es: Zoom, Teams)"
                                        value={newPlatform.name || ''}
                                        onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Link piattaforma (es: https://zoom.us/j/123456789)"
                                        value={newPlatform.link || ''}
                                        onChange={(e) => setNewPlatform({ ...newPlatform, link: e.target.value })}
                                    />
                                    <Button onClick={handleAddPlatform} size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Aggiungi Piattaforma
                                    </Button>
                                </div>

                                {/* List */}
                                {data.platforms.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.platforms.map((platform) => (
                                            <div
                                                key={platform.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{platform.name}</p>
                                                    {platform.link && (
                                                        <p className="text-sm text-muted-foreground truncate max-w-[400px]">
                                                            {platform.link}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={platform.enabled}
                                                        onCheckedChange={() => handleTogglePlatform(platform.id)}
                                                    />
                                                    <Button
                                                        onClick={() => handleRemovePlatform(platform.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        Nessuna piattaforma configurata
                                    </p>
                                )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                {/* ARGUMENT LISTS SECTION */}
                <AccordionItem value="arglists">
                    <Card>
                        <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <h3 className="font-semibold">Liste Argomenti</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {(data.argumentLists || []).length} liste configurate
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-4">
                                {/* Add New Form */}
                                <div className="space-y-4 p-4 bg-accent/5 rounded-lg">
                                    <div className="space-y-2">
                                        <Label>Nome Lista</Label>
                                        <Input
                                            placeholder="Es. Logistica Base"
                                            value={newArgListName}
                                            onChange={(e) => setNewArgListName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Argomenti (uno per riga)</Label>
                                        <textarea
                                            className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Argomento 1&#10;Argomento 2&#10;Argomento 3"
                                            value={newArgListContent}
                                            onChange={(e) => setNewArgListContent(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleAddArgList} className="w-full gap-2">
                                        <Plus className="h-4 w-4" /> Aggiungi Lista
                                    </Button>
                                </div>

                                {/* List of Existing Lists */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Liste Disponibili
                                    </h4>
                                    <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                                        {(data.argumentLists || []).length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                Nessuna lista configurata
                                            </div>
                                        ) : (
                                            (data.argumentLists || []).map((list) => (
                                                <div
                                                    key={list.id}
                                                    className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${list.enabled
                                                        ? 'bg-card hover:border-primary/50'
                                                        : 'bg-muted/50 opacity-60'
                                                        }`}
                                                >
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{list.name}</span>
                                                            {!list.enabled && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Disabilitata
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {list.arguments.length} argomenti
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {list.arguments.slice(0, 3).map((arg, i) => (
                                                                <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                                    {arg.length > 20 ? arg.substring(0, 20) + '...' : arg}
                                                                </Badge>
                                                            ))}
                                                            {list.arguments.length > 3 && (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                                    +{list.arguments.length - 3}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        <Switch
                                                            checked={list.enabled}
                                                            onCheckedChange={() => handleToggleArgList(list.id)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveArgList(list.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default PredefinedDataSettings;

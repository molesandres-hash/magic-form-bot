/**
 * Placeholder Settings Component
 *
 * Purpose: Manage placeholder configurations and custom template variables
 * - View common placeholders
 * - Add custom placeholders
 * - Configure extraction hints for AI
 * - Manage default values
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Variable,
  Plus,
  Trash2,
  Save,
  Info,
  Code,
  FileText,
  Table,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// TYPES
// ============================================================================

interface CustomPlaceholder {
  id: string;
  name: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  defaultValue?: string;
  extractionHint?: string;
  category: 'corso' | 'partecipanti' | 'moduli' | 'ente' | 'altro';
}

interface PlaceholderConfig {
  customPlaceholders: CustomPlaceholder[];
}

// ============================================================================
// COMMON PLACEHOLDERS
// ============================================================================

const COMMON_PLACEHOLDERS = [
  { name: 'TITOLO_CORSO', category: 'Corso', description: 'Titolo del corso' },
  { name: 'ID_CORSO', category: 'Corso', description: 'Codice identificativo del corso' },
  { name: 'DATA_INIZIO', category: 'Corso', description: 'Data di inizio del corso' },
  { name: 'DATA_FINE', category: 'Corso', description: 'Data di fine del corso' },
  { name: 'ORE_TOTALI', category: 'Corso', description: 'Ore totali del corso' },
  { name: 'NOME_ENTE', category: 'Ente', description: 'Nome dell\'ente accreditato' },
  { name: 'INDIRIZZO_ENTE', category: 'Ente', description: 'Indirizzo completo dell\'ente' },
  { name: 'PARTECIPANTI', category: 'Partecipanti', description: 'Lista partecipanti (array)' },
  { name: 'NUMERO_PARTECIPANTI', category: 'Partecipanti', description: 'Numero totale di partecipanti' },
  { name: 'NOME_DOCENTE', category: 'Docente', description: 'Nome del docente' },
  { name: 'COGNOME_DOCENTE', category: 'Docente', description: 'Cognome del docente' },
  { name: 'CF_DOCENTE', category: 'Docente', description: 'Codice fiscale del docente' },
  { name: 'MODULI', category: 'Moduli', description: 'Lista moduli del corso (array)' },
  { name: 'SESSIONI', category: 'Sessioni', description: 'Lista sessioni didattiche (array)' },
];

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = 'placeholderSettings';

function loadSettings(): PlaceholderConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading placeholder settings:', error);
  }
  return { customPlaceholders: [] };
}

function saveSettings(settings: PlaceholderConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving placeholder settings:', error);
    throw error;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

const PlaceholderSettings = () => {
  const [config, setConfig] = useState<PlaceholderConfig>(loadSettings());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPlaceholder, setNewPlaceholder] = useState<Partial<CustomPlaceholder>>({
    type: 'string',
    category: 'altro',
  });

  /**
   * Saves configuration to localStorage
   */
  const handleSave = () => {
    try {
      saveSettings(config);
      toast.success('Configurazione salvata!');
    } catch (error) {
      toast.error('Errore durante il salvataggio');
    }
  };

  /**
   * Adds a new custom placeholder
   */
  const handleAddPlaceholder = () => {
    if (!newPlaceholder.name || !newPlaceholder.label) {
      toast.error('Nome e Etichetta sono obbligatori');
      return;
    }

    const placeholder: CustomPlaceholder = {
      id: `custom_${Date.now()}`,
      name: newPlaceholder.name.toUpperCase().replace(/\s+/g, '_'),
      label: newPlaceholder.label,
      description: newPlaceholder.description || '',
      type: newPlaceholder.type || 'string',
      defaultValue: newPlaceholder.defaultValue,
      extractionHint: newPlaceholder.extractionHint,
      category: newPlaceholder.category || 'altro',
    };

    setConfig((prev) => ({
      ...prev,
      customPlaceholders: [...prev.customPlaceholders, placeholder],
    }));

    setNewPlaceholder({
      type: 'string',
      category: 'altro',
    });
    setIsAddingNew(false);
    toast.success('Placeholder aggiunto!');
  };

  /**
   * Removes a custom placeholder
   */
  const handleRemovePlaceholder = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      customPlaceholders: prev.customPlaceholders.filter((p) => p.id !== id),
    }));
    toast.success('Placeholder rimosso');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Variable className="h-5 w-5 text-primary" />
                Gestione Placeholder
              </CardTitle>
              <CardDescription>
                Visualizza i placeholder comuni e aggiungi variabili personalizzate per i tuoi template
              </CardDescription>
            </div>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Save className="mr-2 h-4 w-4" />
              Salva
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          I placeholder sono variabili che vengono sostituite con i dati reali nei template.
          Usa la sintassi <code className="bg-muted px-1 py-0.5 rounded">{'{{'}</code>NOME_VARIABILE<code className="bg-muted px-1 py-0.5 rounded">{'}}'}</code> nei tuoi documenti Word.
        </AlertDescription>
      </Alert>

      {/* Common Placeholders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code className="h-4 w-4" />
            Placeholder Predefiniti
          </CardTitle>
          <CardDescription>
            Placeholder comunemente utilizzati nei template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMON_PLACEHOLDERS.map((placeholder) => (
              <div
                key={placeholder.name}
                className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
              >
                <FileText className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono font-semibold text-foreground">
                      {'{{'}{placeholder.name}{'}}'}
                    </code>
                    <Badge variant="outline" className="text-xs">
                      {placeholder.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {placeholder.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Placeholders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Variable className="h-4 w-4" />
                Placeholder Personalizzati
              </CardTitle>
              <CardDescription>
                Crea placeholder personalizzati per esigenze specifiche
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddingNew(!isAddingNew)}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Form */}
          {isAddingNew && (
            <Card className="p-4 bg-accent/5 border-primary">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Nome Variabile *</Label>
                    <Input
                      id="new-name"
                      placeholder="ES: NUMERO_PROTOCOLLO"
                      value={newPlaceholder.name || ''}
                      onChange={(e) =>
                        setNewPlaceholder((p) => ({
                          ...p,
                          name: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                        }))
                      }
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-label">Etichetta *</Label>
                    <Input
                      id="new-label"
                      placeholder="Es: Numero di Protocollo"
                      value={newPlaceholder.label || ''}
                      onChange={(e) =>
                        setNewPlaceholder((p) => ({ ...p, label: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-type">Tipo</Label>
                    <Select
                      value={newPlaceholder.type}
                      onValueChange={(value: any) =>
                        setNewPlaceholder((p) => ({ ...p, type: value }))
                      }
                    >
                      <SelectTrigger id="new-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Testo</SelectItem>
                        <SelectItem value="number">Numero</SelectItem>
                        <SelectItem value="date">Data</SelectItem>
                        <SelectItem value="boolean">Booleano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-category">Categoria</Label>
                    <Select
                      value={newPlaceholder.category}
                      onValueChange={(value: any) =>
                        setNewPlaceholder((p) => ({ ...p, category: value }))
                      }
                    >
                      <SelectTrigger id="new-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corso">Corso</SelectItem>
                        <SelectItem value="partecipanti">Partecipanti</SelectItem>
                        <SelectItem value="moduli">Moduli</SelectItem>
                        <SelectItem value="ente">Ente</SelectItem>
                        <SelectItem value="altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-description">Descrizione</Label>
                  <Input
                    id="new-description"
                    placeholder="Breve descrizione del placeholder"
                    value={newPlaceholder.description || ''}
                    onChange={(e) =>
                      setNewPlaceholder((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-hint">Suggerimento per AI (opzionale)</Label>
                  <Textarea
                    id="new-hint"
                    placeholder="Indicazioni per aiutare l'AI a estrarre correttamente questo dato"
                    value={newPlaceholder.extractionHint || ''}
                    onChange={(e) =>
                      setNewPlaceholder((p) => ({ ...p, extractionHint: e.target.value }))
                    }
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewPlaceholder({ type: 'string', category: 'altro' });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Annulla
                  </Button>
                  <Button onClick={handleAddPlaceholder} size="sm">
                    Aggiungi Placeholder
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Custom Placeholders List */}
          {config.customPlaceholders.length > 0 ? (
            <div className="space-y-2">
              {config.customPlaceholders.map((placeholder) => (
                <Card key={placeholder.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm font-mono font-semibold">
                          {'{{'}{placeholder.name}{'}}'}
                        </code>
                        <Badge variant="outline">{placeholder.category}</Badge>
                        <Badge variant="secondary">{placeholder.type}</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{placeholder.label}</p>
                      {placeholder.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {placeholder.description}
                        </p>
                      )}
                      {placeholder.extractionHint && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                          <span className="font-semibold">AI Hint:</span> {placeholder.extractionHint}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRemovePlaceholder(placeholder.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Variable className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nessun placeholder personalizzato ancora creato</p>
              <p className="text-xs mt-1">
                Clicca "Aggiungi" per creare il tuo primo placeholder
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Come Usare i Placeholder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-medium">Nei documenti Word (.docx):</p>
            <div className="bg-muted p-3 rounded font-mono text-xs">
              Il corso <code>{'{{'}</code>TITOLO_CORSO<code>{'}}'}</code> inizia il{' '}
              <code>{'{{'}</code>DATA_INIZIO<code>{'}}'}</code>
            </div>
          </div>

          <div className="text-sm space-y-2">
            <p className="font-medium">Per liste (array):</p>
            <div className="bg-muted p-3 rounded font-mono text-xs">
              <code>{'{'}</code>#PARTECIPANTI<code>{'}'}</code>
              <br />
              &nbsp;&nbsp;<code>{'{{'}</code>NOME<code>{'}}'}</code>{' '}
              <code>{'{{'}</code>COGNOME<code>{'}}'}</code>
              <br />
              <code>{'{'}</code>/PARTECIPANTI<code>{'}'}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderSettings;

/**
 * Export function to load settings (for use in other components)
 */
export function loadPlaceholderSettings(): PlaceholderConfig {
  return loadSettings();
}

/**
 * Folder Structure Settings Component
 *
 * Purpose: Allows users to configure ZIP folder structure
 * - Reorder folders
 * - Enable/disable folders
 * - Rename folders
 * - Configure ZIP generation options
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  FolderOpen,
  GripVertical,
  Trash2,
  Plus,
  Save,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FolderDefinition, FolderStructureSettings } from '@/types/userSettings';
import { DEFAULT_FOLDER_STRUCTURE } from '@/types/userSettings';
import { SYSTEM_TEMPLATES } from '@/services/templateRegistry';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplateOption {
  id: string;
  name: string;
  type: 'system' | 'local' | 'db';
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const STORAGE_KEY = 'folderStructureSettings';

function loadSettings(): FolderStructureSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading folder structure settings:', error);
  }
  return DEFAULT_FOLDER_STRUCTURE;
}

function saveSettings(settings: FolderStructureSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving folder structure settings:', error);
    throw error;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

const FolderStructureSettings = () => {
  const [settings, setSettings] = useState<FolderStructureSettings>(loadSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<TemplateOption[]>([]);

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      const options: TemplateOption[] = [];

      // 1. System Templates
      Object.values(SYSTEM_TEMPLATES).forEach(t => {
        options.push({ id: t.id, name: t.name, type: 'system' });
      });

      // 2. Local Templates
      try {
        const response = await fetch('/templates/manifest.json');
        if (response.ok) {
          const manifest = await response.json();
          if (manifest.templates) {
            manifest.templates.forEach((t: any) => {
              options.push({ id: t.id, name: t.name, type: 'local' });
            });
          }
        }
      } catch (e) {
        console.error("Failed to load local templates", e);
      }

      setAvailableTemplates(options);
    };

    loadTemplates();
  }, []);

  // Track changes
  useEffect(() => {
    const current = JSON.stringify(settings);
    const stored = JSON.stringify(loadSettings());
    setHasChanges(current !== stored);
  }, [settings]);

  /**
   * Saves settings to localStorage
   */
  const handleSave = () => {
    try {
      saveSettings(settings);
      toast.success('Impostazioni salvate!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Errore durante il salvataggio');
    }
  };

  /**
   * Resets to default settings
   */
  const handleReset = () => {
    setSettings(DEFAULT_FOLDER_STRUCTURE);
    toast.info('Impostazioni ripristinate ai valori predefiniti');
  };

  /**
   * Toggles folder enabled state
   */
  const toggleFolder = (folderId: string) => {
    setSettings((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId ? { ...f, enabled: !f.enabled } : f
      ),
    }));
  };

  /**
   * Updates folder name
   */
  const updateFolderName = (folderId: string, name: string) => {
    setSettings((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId ? { ...f, name } : f
      ),
    }));
  };

  /**
   * Moves folder up in order
   */
  const moveFolderUp = (folderId: string) => {
    setSettings((prev) => {
      const folders = [...prev.folders];
      const index = folders.findIndex((f) => f.id === folderId);
      if (index > 0) {
        [folders[index - 1], folders[index]] = [folders[index], folders[index - 1]];
        // Update order numbers
        folders.forEach((f, i) => {
          f.order = i + 1;
        });
      }
      return { ...prev, folders };
    });
  };

  /**
   * Moves folder down in order
   */
  const moveFolderDown = (folderId: string) => {
    setSettings((prev) => {
      const folders = [...prev.folders];
      const index = folders.findIndex((f) => f.id === folderId);
      if (index < folders.length - 1) {
        [folders[index], folders[index + 1]] = [folders[index + 1], folders[index]];
        // Update order numbers
        folders.forEach((f, i) => {
          f.order = i + 1;
        });
      }
      return { ...prev, folders };
    });
  };

  /**
   * Removes a folder
   */
  const removeFolder = (folderId: string) => {
    setSettings((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== folderId),
    }));
    toast.success('Cartella rimossa');
  };

  /**
   * Adds a new folder
   */
  const addFolder = () => {
    const newFolder: FolderDefinition = {
      id: `folder_${Date.now()}`,
      name: 'Nuova Cartella',
      order: settings.folders.length + 1,
      enabled: true,
      fileTypes: [],
      icon: '📁',
    };

    setSettings((prev) => ({
      ...prev,
      folders: [...prev.folders, newFolder],
    }));

    toast.success('Nuova cartella aggiunta');
  };

  /**
   * Toggles a template assignment for a folder
   */
  const toggleTemplateAssignment = (folderId: string, templateId: string) => {
    setSettings((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => {
        if (f.id !== folderId) return f;

        const currentAssigned = f.assignedTemplates || [];
        const isAssigned = currentAssigned.includes(templateId);

        let newAssigned;
        if (isAssigned) {
          newAssigned = currentAssigned.filter(id => id !== templateId);
        } else {
          newAssigned = [...currentAssigned, templateId];
        }

        return { ...f, assignedTemplates: newAssigned };
      }),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Struttura Cartelle ZIP
            </h3>
            <p className="text-sm text-muted-foreground">
              Configura l'organizzazione delle cartelle nel file ZIP generato
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={!hasChanges}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Ripristina
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={!hasChanges}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Save className="mr-2 h-4 w-4" />
              Salva
            </Button>
          </div>
        </div>
      </Card>

      {/* Folders List */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Cartelle</h4>
            <Button onClick={addFolder} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Cartella
            </Button>
          </div>

          <div className="space-y-2">
            {settings.folders
              .sort((a, b) => a.order - b.order)
              .map((folder, index) => (
                <Card
                  key={folder.id}
                  className={`p-4 border-l-4 ${folder.enabled
                      ? 'border-l-primary bg-card'
                      : 'border-l-muted bg-muted/20'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={() => moveFolderUp(folder.id)}
                        disabled={index === 0}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        ▲
                      </Button>
                      <Button
                        onClick={() => moveFolderDown(folder.id)}
                        disabled={index === settings.folders.length - 1}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        ▼
                      </Button>
                    </div>

                    {/* Icon */}
                    <span className="text-2xl">{folder.icon}</span>

                    {/* Folder Name Input */}
                    <Input
                      value={folder.name}
                      onChange={(e) =>
                        updateFolderName(folder.id, e.target.value)
                      }
                      className="flex-1 max-w-xs"
                      disabled={!folder.enabled}
                    />

                    {/* File Types Badge */}
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground">
                        {folder.fileTypes.length > 0
                          ? folder.fileTypes.join(', ')
                          : 'Nessun tipo file'}
                      </span>
                    </div>

                    {/* Enabled Toggle */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`folder-${folder.id}`}
                        className="text-sm cursor-pointer"
                      >
                        Attiva
                      </Label>
                      <Switch
                        id={`folder-${folder.id}`}
                        checked={folder.enabled}
                        onCheckedChange={() => toggleFolder(folder.id)}
                      />
                    </div>

                    {/* Delete Button */}
                    <Button
                      onClick={() => removeFolder(folder.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Template Assignment Section */}
                  {folder.enabled && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                        TEMPLATE ASSEGNATI
                      </Label>
                      <ScrollArea className="h-32 w-full rounded-md border p-2">
                        <div className="space-y-2">
                          {availableTemplates.map((template) => (
                            <div key={template.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${folder.id}-${template.id}`}
                                checked={(folder.assignedTemplates || []).includes(template.id)}
                                onCheckedChange={() => toggleTemplateAssignment(folder.id, template.id)}
                              />
                              <label
                                htmlFor={`${folder.id}-${template.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {template.name}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({template.type})
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </Card>
              ))}
          </div>
        </div>
      </Card>

      {/* General Options */}
      <Card className="p-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Opzioni Generali</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="timestamp" className="font-medium">
                  Includi Timestamp
                </Label>
                <p className="text-xs text-muted-foreground">
                  Aggiunge data e ora al nome del file ZIP
                </p>
              </div>
              <Switch
                id="timestamp"
                checked={settings.includeTimestamp}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    includeTimestamp: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="course-id" className="font-medium">
                  Includi ID Corso nei Nomi File
                </Label>
                <p className="text-xs text-muted-foreground">
                  Aggiunge l'ID del corso a ogni nome file
                </p>
              </div>
              <Switch
                id="course-id"
                checked={settings.includeCourseIdInFilenames}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    includeCourseIdInFilenames: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="readme" className="font-medium">
                  Genera README
                </Label>
                <p className="text-xs text-muted-foreground">
                  Crea un file README.txt con informazioni sul pacchetto
                </p>
              </div>
              <Switch
                id="readme"
                checked={settings.generateReadme}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    generateReadme: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="metadata" className="font-medium">
                  Genera Metadata JSON
                </Label>
                <p className="text-xs text-muted-foreground">
                  Crea un file metadata.json con i dati del corso
                </p>
              </div>
              <Switch
                id="metadata"
                checked={settings.generateMetadata}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    generateMetadata: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Changes Warning */}
      {hasChanges && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-medium">
              Hai modifiche non salvate. Clicca "Salva" per applicare le modifiche.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FolderStructureSettings;

/**
 * Export function to load settings (for use in other components)
 */
export function loadFolderStructureSettings(): FolderStructureSettings {
  return loadSettings();
}

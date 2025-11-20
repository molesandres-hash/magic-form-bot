/**
 * Data Preview & Edit Step
 *
 * Purpose: Review and edit extracted data before document generation
 * - Visual preview of all extracted fields
 * - Inline editing capabilities
 * - Validation warnings and errors
 * - Export/Import JSON
 * - Auto-save functionality
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  FileJson,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  exportDataAsJSON,
  importDataFromJSON,
  autoSaveData,
  loadAutoSavedData,
  clearAutoSavedData,
} from '@/services/jsonExportImportService';

// ============================================================================
// TYPES
// ============================================================================

interface DataPreviewStepProps {
  data: any;
  onDataChange: (updatedData: any) => void;
  onContinue: () => void;
  onBack?: () => void;
}

interface ValidationIssue {
  field: string;
  type: 'error' | 'warning' | 'info';
  message: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DataPreviewStep = ({
  data,
  onDataChange,
  onContinue,
  onBack,
}: DataPreviewStepProps) => {
  const [editedData, setEditedData] = useState(data);
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());

  // Auto-save on data change
  useEffect(() => {
    autoSaveData(editedData);
    setLastSaveTime(new Date());
  }, [editedData]);

  // Validate data on mount and when data changes
  useEffect(() => {
    const issues = validateData(editedData);
    setValidationIssues(issues);
  }, [editedData]);

  /**
   * Validates data and returns issues
   */
  const validateData = (dataToValidate: any): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // Check corso
    if (!dataToValidate.corso?.id) {
      issues.push({
        field: 'corso.id',
        type: 'error',
        message: 'ID Corso mancante',
      });
    }

    if (!dataToValidate.corso?.titolo) {
      issues.push({
        field: 'corso.titolo',
        type: 'warning',
        message: 'Titolo corso mancante',
      });
    }

    // Check partecipanti
    if (!dataToValidate.partecipanti || dataToValidate.partecipanti.length === 0) {
      issues.push({
        field: 'partecipanti',
        type: 'error',
        message: 'Nessun partecipante trovato',
      });
    } else {
      // Check for invalid codici fiscali
      dataToValidate.partecipanti.forEach((p: any, idx: number) => {
        if (p._validations && !p._validations.cf_valid) {
          issues.push({
            field: `partecipanti[${idx}].codice_fiscale`,
            type: 'warning',
            message: `CF non valido: ${p.nome} ${p.cognome}`,
          });
        }
      });
    }

    // Check sessioni
    if (!dataToValidate.sessioni || dataToValidate.sessioni.length === 0) {
      issues.push({
        field: 'sessioni',
        type: 'warning',
        message: 'Nessuna sessione trovata',
      });
    }

    // Check moduli
    if (dataToValidate.moduli && dataToValidate.moduli.length === 0) {
      issues.push({
        field: 'moduli',
        type: 'info',
        message: 'Nessun modulo definito',
      });
    }

    return issues;
  };

  /**
   * Handles JSON export
   */
  const handleExport = () => {
    try {
      exportDataAsJSON(editedData);
      toast.success('JSON esportato con successo!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /**
   * Handles JSON import
   */
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importDataFromJSON(file);
      setEditedData(importedData);
      onDataChange(importedData);
      toast.success('JSON importato con successo!');

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /**
   * Copies JSON to clipboard
   */
  const handleCopyJSON = () => {
    try {
      const jsonString = JSON.stringify(editedData, null, 2);
      navigator.clipboard.writeText(jsonString);
      toast.success('JSON copiato negli appunti!');
    } catch (error) {
      toast.error('Impossibile copiare negli appunti');
    }
  };

  // Count validation issues by type
  const errorCount = validationIssues.filter((i) => i.type === 'error').length;
  const warningCount = validationIssues.filter((i) => i.type === 'warning').length;
  const hasBlockingErrors = errorCount > 0;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Anteprima e Modifica Dati
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Verifica i dati estratti prima di generare i documenti
            </p>
          </div>

          <div className="flex gap-2">
            {/* Export JSON */}
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Esporta JSON
            </Button>

            {/* Import JSON */}
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Importa JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </Button>

            {/* Copy JSON */}
            <Button onClick={handleCopyJSON} variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Copia
            </Button>

            {/* Toggle Raw JSON */}
            <Button
              onClick={() => setShowRawJSON(!showRawJSON)}
              variant="outline"
              size="sm"
            >
              {showRawJSON ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Nascondi JSON
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Mostra JSON
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Validation Summary */}
        <div className="flex gap-3">
          {errorCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              {errorCount} {errorCount === 1 ? 'Errore' : 'Errori'}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-3 w-3" />
              {warningCount} {warningCount === 1 ? 'Avviso' : 'Avvisi'}
            </Badge>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
              <CheckCircle2 className="h-3 w-3" />
              Tutti i dati sono validi
            </Badge>
          )}
        </div>
      </Card>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-3">Problemi Rilevati</h4>
          <div className="space-y-2">
            {validationIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  issue.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                    : issue.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {issue.type === 'error' && <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />}
                {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                {issue.type === 'info' && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{issue.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Campo: {issue.field}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Raw JSON View */}
      {showRawJSON && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">JSON Completo</h4>
            <Button onClick={handleCopyJSON} variant="outline" size="sm">
              <Copy className="mr-2 h-3 w-3" />
              Copia
            </Button>
          </div>
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
            {JSON.stringify(editedData, null, 2)}
          </pre>
        </Card>
      )}

      {/* Data Sections (Accordion) */}
      <Card className="p-6">
        <Accordion type="multiple" defaultValue={['corso', 'partecipanti']} className="w-full">
          {/* Corso */}
          <AccordionItem value="corso">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Corso</span>
                {editedData.corso?.id && (
                  <Badge variant="outline">{editedData.corso.id}</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID Corso</Label>
                  <p className="font-medium">{editedData.corso?.id || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Titolo</Label>
                  <p className="font-medium">{editedData.corso?.titolo || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data Inizio</Label>
                  <p className="font-medium">{editedData.corso?.data_inizio || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data Fine</Label>
                  <p className="font-medium">{editedData.corso?.data_fine || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ore Totali</Label>
                  <p className="font-medium">{editedData.corso?.ore_totali || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Stato</Label>
                  <p className="font-medium">{editedData.corso?.stato || 'N/A'}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Partecipanti */}
          <AccordionItem value="partecipanti">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Partecipanti</span>
                <Badge variant="outline">
                  {editedData.partecipanti?.length || 0}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-4">
                {editedData.partecipanti?.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {p.numero}. {p.nome_completo}
                      </p>
                      {p._validations && (
                        <div className="flex gap-1">
                          {p._validations.cf_valid ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              CF
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <XCircle className="h-3 w-3" />
                              CF
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">CF:</span>{' '}
                        {p.codice_fiscale || 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>{' '}
                        {p.email || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Sessioni */}
          <AccordionItem value="sessioni">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Sessioni</span>
                <Badge variant="outline">
                  {editedData.sessioni?.length || 0}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-4">
                {editedData.sessioni?.map((s: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{s.data_completa}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.ora_inizio_giornata} - {s.ora_fine_giornata}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={s.is_fad ? 'secondary' : 'default'}>
                          {s.is_fad ? 'FAD' : 'Presenza'}
                        </Badge>
                        <Badge variant="outline">{s.sede}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Metadata */}
          <AccordionItem value="metadata">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Metadati Estrazione</span>
                {editedData.metadata?.completamento_percentuale && (
                  <Badge variant="outline">
                    {editedData.metadata.completamento_percentuale}% completo
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Data Estrazione</Label>
                  <p className="text-sm">
                    {editedData.metadata?.data_estrazione
                      ? new Date(editedData.metadata.data_estrazione).toLocaleString('it-IT')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Versione Sistema</Label>
                  <p className="text-sm">{editedData.metadata?.versione_sistema || 'N/A'}</p>
                </div>
                {editedData.metadata?.warnings && editedData.metadata.warnings.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Avvisi Estrazione</Label>
                    <ul className="text-sm space-y-1 mt-1">
                      {editedData.metadata.warnings.map((w: string, idx: number) => (
                        <li key={idx} className="text-amber-700 dark:text-amber-400">
                          • {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Indietro
          </Button>
        )}
        <Button
          onClick={onContinue}
          disabled={hasBlockingErrors}
          className="flex-1 bg-gradient-to-r from-primary to-accent"
        >
          {hasBlockingErrors ? (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Correggi errori per continuare
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Genera Documenti
            </>
          )}
        </Button>
      </div>

      {/* Auto-save Indicator */}
      <p className="text-xs text-center text-muted-foreground">
        💾 Salvataggio automatico attivo • Ultima modifica:{' '}
        {lastSaveTime.toLocaleTimeString('it-IT')}
      </p>
    </div>
  );
};

export default DataPreviewStep;

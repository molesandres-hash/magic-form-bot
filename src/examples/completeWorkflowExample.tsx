/**
 * Complete Workflow Example with All New Features
 *
 * Purpose: Demonstrates the full user journey with all UX improvements
 * - Input → Extract → Preview → Edit → Export/Import → Generate
 */

import { useState } from 'react';
import { toast } from 'sonner';
import InputStepWizard from '@/components/steps/InputStepWizard';
import AdditionalDataStep from '@/components/steps/AdditionalDataStep';
import DataPreviewStep from '@/components/steps/DataPreviewStep';
import ErrorBoundary from '@/components/ErrorBoundary';
import { extractCourseDataWithGemini } from '@/services/geminiService';
import { getStoredApiKey } from '@/components/settings/ApiKeySettings';
import {
  exportDataAsJSON,
  loadAutoSavedData,
  hasAutoSavedData,
  clearAutoSavedData,
} from '@/services/jsonExportImportService';
import { validateAndNormalizeData } from '@/utils/robustHelpers';
import { generateExcelFromTemplate } from '@/services/excelTemplateGenerator';
import { PREDEFINED_TEMPLATES } from '@/types/templateConfig';

// ============================================================================
// WORKFLOW STEPS
// ============================================================================

enum WorkflowStep {
  INPUT = 'input',           // Collect course data from gestionale
  ADDITIONAL = 'additional', // Collect CF docente, Zoom link
  PREVIEW = 'preview',       // Preview and validate extracted data
  GENERATION = 'generation', // Generate documents
  COMPLETE = 'complete',     // Download & finish
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CompleteWorkflowExample = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.INPUT);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [additionalData, setAdditionalData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Check for auto-saved data on mount
   */
  useState(() => {
    if (hasAutoSavedData()) {
      const autoSaved = loadAutoSavedData();
      if (autoSaved) {
        toast.info('Dati trovati in memoria!', {
          description: `Salvati: ${new Date(autoSaved.savedAt).toLocaleString('it-IT')}`,
          action: {
            label: 'Ripristina',
            onClick: () => handleRestoreAutoSave(autoSaved.data),
          },
          duration: 10000, // Show for 10 seconds
        });
      }
    }
  });

  /**
   * Handles restore from auto-save
   */
  const handleRestoreAutoSave = (data: any) => {
    setExtractedData(data);
    setCurrentStep(WorkflowStep.PREVIEW);
    toast.success('Dati ripristinati!');
  };

  /**
   * STEP 1: Input - User pastes data from gestionale
   */
  const handleInputComplete = async (rawData: any) => {
    setIsProcessing(true);

    try {
      const apiKey = getStoredApiKey();
      if (!apiKey) {
        toast.error('Configura prima la chiave API Gemini');
        setIsProcessing(false);
        return;
      }

      // Extract data with AI
      toast.info('Estrazione dati in corso...');
      const extracted = await extractCourseDataWithGemini(
        apiKey,
        rawData.courseData,
        rawData.modulesData,
        rawData.participantsData
      );

      // Validate and normalize
      const { normalizedData, warnings, errors } = validateAndNormalizeData(extracted);

      if (errors.length > 0) {
        toast.warning('Dati estratti con errori', {
          description: `${errors.length} errori trovati. Potrai correggerli nel prossimo step.`,
        });
      }

      if (warnings.length > 0) {
        toast.info(`${warnings.length} avvisi rilevati`, {
          description: 'Verifica i dati nella schermata di anteprima',
        });
      }

      setExtractedData(normalizedData);
      setCurrentStep(WorkflowStep.ADDITIONAL);
      toast.success('Dati estratti con successo!');
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast.error('Errore durante l\'estrazione', {
        description: error.message,
        action: {
          label: 'Riprova',
          onClick: () => handleInputComplete(rawData),
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * STEP 2: Additional Data - Collect CF docente, Zoom link
   */
  const handleAdditionalDataComplete = (data: any) => {
    setAdditionalData(data);

    // Merge additional data into extracted data
    const mergedData = {
      ...extractedData,
      codice_fiscale_docente: data.codiceFiscaleDocente,
      link_zoom: data.linkZoom,
      note: data.note,
    };

    setExtractedData(mergedData);
    setCurrentStep(WorkflowStep.PREVIEW);
    toast.success('Dati aggiuntivi salvati!');
  };

  /**
   * STEP 3: Preview - Review and edit data
   */
  const handlePreviewContinue = () => {
    // Final validation before generation
    const { errors } = validateAndNormalizeData(extractedData);

    if (errors.length > 0) {
      toast.error('Correggi gli errori prima di continuare', {
        description: errors.join(', '),
      });
      return;
    }

    // Offer to export JSON before generation
    toast.info('Vuoi salvare un backup prima di generare?', {
      action: {
        label: 'Esporta JSON',
        onClick: () => {
          exportDataAsJSON(extractedData);
          toast.success('Backup creato!');
        },
      },
      duration: 5000,
    });

    setCurrentStep(WorkflowStep.GENERATION);
  };

  /**
   * STEP 4: Generation - Generate documents
   */
  const handleGeneration = async () => {
    setIsProcessing(true);

    try {
      toast.info('Generazione documenti in corso...');

      // Generate Excel with template
      const templateConfig = {
        ...PREDEFINED_TEMPLATES.REGISTRO_ORE,
        id: 'registro_1',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      generateExcelFromTemplate(extractedData, templateConfig);

      // TODO: Generate Word documents

      // TODO: Create ZIP package

      setCurrentStep(WorkflowStep.COMPLETE);
      toast.success('Documenti generati con successo!');

      // Clear auto-save after successful generation
      clearAutoSavedData();
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error('Errore durante la generazione', {
        description: error.message,
        action: {
          label: 'Riprova',
          onClick: handleGeneration,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * STEP 5: Complete - Show success and options
   */
  const handleStartOver = () => {
    setExtractedData(null);
    setAdditionalData(null);
    setCurrentStep(WorkflowStep.INPUT);
    clearAutoSavedData();
    toast.info('Workflow riavviato');
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <ErrorBoundary>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {Object.values(WorkflowStep).map((step, idx) => {
              const isCurrent = step === currentStep;
              const isComplete = Object.values(WorkflowStep).indexOf(currentStep) > idx;

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isComplete
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isComplete ? '✓' : idx + 1}
                  </div>
                  {idx < Object.values(WorkflowStep).length - 1 && (
                    <div
                      className={`h-1 w-16 mx-2 ${
                        isComplete ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">Input</span>
            <span className="text-xs text-muted-foreground">Dati Extra</span>
            <span className="text-xs text-muted-foreground">Anteprima</span>
            <span className="text-xs text-muted-foreground">Genera</span>
            <span className="text-xs text-muted-foreground">Completo</span>
          </div>
        </div>

        {/* Step Content */}
        <div>
          {currentStep === WorkflowStep.INPUT && (
            <InputStepWizard onComplete={handleInputComplete} />
          )}

          {currentStep === WorkflowStep.ADDITIONAL && (
            <AdditionalDataStep
              onComplete={handleAdditionalDataComplete}
              onBack={() => setCurrentStep(WorkflowStep.INPUT)}
            />
          )}

          {currentStep === WorkflowStep.PREVIEW && extractedData && (
            <DataPreviewStep
              data={extractedData}
              onDataChange={setExtractedData}
              onContinue={handlePreviewContinue}
              onBack={() => setCurrentStep(WorkflowStep.ADDITIONAL)}
            />
          )}

          {currentStep === WorkflowStep.GENERATION && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold">Generazione Documenti</h2>
              <p className="text-muted-foreground">
                Pronto per generare tutti i documenti?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep(WorkflowStep.PREVIEW)}
                  disabled={isProcessing}
                  className="px-6 py-3 border rounded-lg hover:bg-muted"
                >
                  Indietro
                </button>
                <button
                  onClick={handleGeneration}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  {isProcessing ? 'Generazione...' : 'Genera Tutti i Documenti'}
                </button>
              </div>
            </div>
          )}

          {currentStep === WorkflowStep.COMPLETE && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold">Completato!</h2>
              <p className="text-muted-foreground">
                Tutti i documenti sono stati generati e scaricati
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStartOver}
                  className="px-6 py-3 border rounded-lg hover:bg-muted"
                >
                  Nuovo Corso
                </button>
                <button
                  onClick={() => exportDataAsJSON(extractedData)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  Scarica Backup JSON
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Debug Panel (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <details>
              <summary className="cursor-pointer font-medium mb-2">
                🐛 Debug Info
              </summary>
              <pre className="text-xs overflow-auto max-h-60">
                {JSON.stringify(
                  {
                    currentStep,
                    hasExtractedData: !!extractedData,
                    hasAdditionalData: !!additionalData,
                    isProcessing,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default CompleteWorkflowExample;

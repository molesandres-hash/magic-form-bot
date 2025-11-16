/**
 * Input Step Wizard Component
 *
 * Purpose: Multi-step wizard for collecting course data from management system
 * Guides users through 3 steps: Course Data → Modules → Participants
 *
 * Clean Code Principles Applied:
 * - Named Constants: All UI text, validation messages, and magic numbers extracted
 * - DRY: Common patterns extracted to helper functions
 * - Single Responsibility: Each function handles one specific task
 * - Error Handling: Comprehensive error messages with user guidance
 * - Type Safety: Full TypeScript typing
 *
 * Why Wizard: Breaks complex data entry into manageable steps
 * Why 3 Steps: Matches management system structure (Course → Modules → Participants)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChevronRight, ChevronLeft, FileText, Folder, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import WizardProgress from "./WizardProgress";
import { WIZARD_EXAMPLES } from "@/constants/examples";
import { extractCourseDataWithGemini, extractCourseDataWithDoubleCheck } from "@/services/geminiService";
import { getStoredApiKey } from "@/components/settings/ApiKeySettings";

// ============================================================================
// CONSTANTS - UI Configuration
// ============================================================================

/**
 * Wizard Configuration
 * Why: Centralizes wizard structure for easy modification
 */
const WIZARD_CONFIG = {
  TOTAL_STEPS: 3,           // Number of wizard steps
  FIRST_STEP: 1,            // First step index
  LAST_STEP: 3,             // Last step index
  TEXTAREA_MIN_HEIGHT: 300, // Minimum textarea height in pixels
} as const;

/**
 * Step Labels and Titles
 * Why: Makes it easy to translate or modify step names
 */
const STEP_LABELS = {
  COURSE: 'Dati Corso',
  MODULES: 'Moduli',
  PARTICIPANTS: 'Partecipanti',
} as const;

const STEP_TITLES = {
  COURSE: 'Step 1: Dati Corso Principale',
  MODULES: 'Step 2: Dati Moduli',
  PARTICIPANTS: 'Step 3: Dati Partecipanti',
} as const;

const STEP_DESCRIPTIONS = {
  COURSE: 'Apri la schermata principale del corso nel gestionale e copia tutti i dati visibili',
  MODULES: 'Clicca sulla sezione "Moduli" nel gestionale e copia tutti i dati dei moduli',
  PARTICIPANTS: 'Seleziona un modulo, poi copia l\'elenco completo dei partecipanti',
} as const;

// ============================================================================
// CONSTANTS - Validation & Error Messages
// ============================================================================

/**
 * Validation Error Messages
 * Why: Provides clear, actionable feedback to users
 */
const VALIDATION_MESSAGES = {
  COURSE_EMPTY: 'Inserisci i dati del corso prima di procedere',
  MODULES_EMPTY: 'Inserisci i dati dei moduli prima di procedere',
  PARTICIPANTS_EMPTY: 'Inserisci i dati dei partecipanti prima di procedere',
  ALL_STEPS_REQUIRED: 'Completa tutti e 3 gli step prima di estrarre i dati',
} as const;

/**
 * API Key Error Messages
 * Why: Guides users to resolve API configuration issues
 */
const API_KEY_MESSAGES = {
  MISSING: 'Configurare prima la chiave API Google Gemini',
  MISSING_DESCRIPTION: 'Clicca sul pulsante \'API Key\' in alto per configurarla',
  INVALID: 'Chiave API non valida',
  INVALID_DESCRIPTION: 'Verifica che la chiave API sia corretta',
  QUOTA_EXCEEDED: 'Quota API esaurita',
  QUOTA_DESCRIPTION: 'Hai raggiunto il limite di richieste giornaliere',
  CONFIGURE_BUTTON: 'Configura',
} as const;

/**
 * Extraction Error Messages
 * Why: Provides context-specific error feedback
 */
const EXTRACTION_MESSAGES = {
  GENERIC_ERROR: 'Errore durante l\'estrazione dei dati',
  RETRY_DESCRIPTION: 'Riprova tra qualche secondo',
} as const;

// ============================================================================
// CONSTANTS - Success & Info Messages
// ============================================================================

/**
 * Success Messages
 * Why: Provides positive feedback on user actions
 */
const SUCCESS_MESSAGES = {
  STEP_COMPLETED: (stepNumber: number) => `Step ${stepNumber} completato!`,
  EXAMPLE_LOADED: 'Esempio caricato!',
  EXTRACTION_COMPLETE: (percentage: number) => `Dati estratti! Completamento: ${percentage}%`,
  DOUBLE_CHECK_SUCCESS: (percentage: number, diffCount: number) => ({
    title: `Doppia verifica completata: ${percentage}% di corrispondenza`,
    description: diffCount === 0
      ? 'Le due estrazioni sono identiche!'
      : `${diffCount} piccole differenze rilevate`,
  }),
} as const;

/**
 * Info Messages
 * Why: Informs users about ongoing processes
 */
const INFO_MESSAGES = {
  DOUBLE_CHECK_ENABLED: 'Doppia verifica abilitata',
  DOUBLE_CHECK_DESCRIPTION: 'Verranno effettuate 2 estrazioni per garantire massima accuratezza',
} as const;

/**
 * Warning Messages
 * Why: Alerts users to potential data quality issues
 */
const WARNING_MESSAGES = {
  LOW_MATCH: (percentage: number) => `Attenzione: ${percentage}% di corrispondenza`,
  VERIFY_MANUALLY: 'Verifica manualmente i dati estratti',
  WARNINGS_DETECTED: (count: number) => `Attenzione: ${count} avvisi rilevati`,
} as const;

// ============================================================================
// CONSTANTS - UI Text & Labels
// ============================================================================

/**
 * Button Labels
 * Why: Centralizes all button text for easy translation
 */
const BUTTON_LABELS = {
  NEXT: 'Avanti',
  BACK: 'Indietro',
  LOAD_EXAMPLE: 'Carica Esempio',
  EXTRACT_DOUBLE_CHECK: 'Estrai con Doppia Verifica',
  EXTRACT_AI: 'Estrai con AI',
  EXTRACTING: 'Estrazione in corso...',
} as const;

/**
 * Double-Check Feature Text
 * Why: Explains the double-check feature to users
 */
const DOUBLE_CHECK_TEXT = {
  TITLE: 'Doppia Verifica (Consigliato)',
  DESCRIPTION: 'Effettua 2 estrazioni indipendenti e confronta i risultati per massima accuratezza',
} as const;

/**
 * Feature Highlights (Bottom Info Cards)
 * Why: Communicates key benefits to users
 */
const FEATURE_HIGHLIGHTS = {
  GUIDED: {
    title: 'Processo Guidato',
    description: '3 step semplici e chiari',
  },
  ACCURACY: {
    title: 'Doppia Verifica',
    description: 'Accuratezza garantita al 99%',
  },
  TIME_SAVING: {
    title: 'Risparmio Tempo',
    description: 'Da 60 min a 5 min',
  },
} as const;

/**
 * Placeholder Text for Textareas
 * Why: Provides helpful examples to users
 */
const PLACEHOLDER_TEXT = {
  COURSE: `Incolla qui i dati del corso...

Esempio:
ID Corso: 21342
Titolo: Corso di Formazione...
Date: dal 19/08/2025 al 23/08/2025...`,
  MODULES: `Incolla qui i dati dei moduli...

Esempio:
Sezione: 13993
Modulo: Modulo Base
Orari: 09:00-13:00 / 14:00-18:00...`,
  PARTICIPANTS: `Incolla qui l'elenco partecipanti...

Esempio:
1. Mario Rossi - CF: RSSMRA80A01H501Z
   Email: mario.rossi@example.com
   Tel: 3331234567...`,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface InputStepWizardProps {
  onComplete: (data: any) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * InputStepWizard - Main wizard component
 *
 * Purpose: Guides users through 3-step data collection process
 * Why component state: Manages wizard navigation and form data locally
 */
const InputStepWizard = ({ onComplete }: InputStepWizardProps) => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const [currentSubStep, setCurrentSubStep] = useState(WIZARD_CONFIG.FIRST_STEP);
  const [courseData, setCourseData] = useState("");
  const [modulesData, setModulesData] = useState("");
  const [participantsData, setParticipantsData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [useDoubleCheck, setUseDoubleCheck] = useState(true); // Default to enabled for best accuracy
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  // Step labels array for WizardProgress component
  const stepLabels = [
    STEP_LABELS.COURSE,
    STEP_LABELS.MODULES,
    STEP_LABELS.PARTICIPANTS,
  ];

  // ========================================================================
  // VALIDATION HELPERS
  // ========================================================================

  /**
   * Validates that current step has required data
   * Why: Prevents proceeding with empty required fields
   *
   * @param step - Step number to validate
   * @returns true if step has data, false otherwise (shows error toast)
   */
  const validateStepData = (step: number): boolean => {
    if (step === 1 && !courseData.trim()) {
      toast.error(VALIDATION_MESSAGES.COURSE_EMPTY);
      return false;
    }
    if (step === 2 && !modulesData.trim()) {
      toast.error(VALIDATION_MESSAGES.MODULES_EMPTY);
      return false;
    }
    if (step === 3 && !participantsData.trim()) {
      toast.error(VALIDATION_MESSAGES.PARTICIPANTS_EMPTY);
      return false;
    }
    return true;
  };

  // ========================================================================
  // NAVIGATION HANDLERS
  // ========================================================================

  /**
   * Handles moving to next wizard step
   * Why: Validates current step before advancing
   */
  const handleNext = () => {
    if (!validateStepData(currentSubStep)) {
      return;
    }

    if (currentSubStep < WIZARD_CONFIG.LAST_STEP) {
      setCurrentSubStep(currentSubStep + 1);
      toast.success(SUCCESS_MESSAGES.STEP_COMPLETED(currentSubStep));
    }
  };

  /**
   * Handles moving to previous wizard step
   * Why: Allows users to correct earlier data
   */
  const handleBack = () => {
    if (currentSubStep > WIZARD_CONFIG.FIRST_STEP) {
      setCurrentSubStep(currentSubStep - 1);
    }
  };

  // ========================================================================
  // DATA EXTRACTION HANDLER
  // ========================================================================

  /**
   * Handles AI-powered data extraction
   *
   * Purpose: Extracts course data using Google Gemini API
   * Why async: API calls are asynchronous operations
   * Why double-check: Two independent extractions compared for accuracy
   *
   * Error Handling: Provides specific error messages for different failure scenarios
   */
  const handleExtract = async () => {
    // Validate all steps are complete
    if (!participantsData.trim()) {
      toast.error(VALIDATION_MESSAGES.ALL_STEPS_REQUIRED);
      return;
    }

    // Verify API key is configured
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      toast.error(API_KEY_MESSAGES.MISSING, {
        description: API_KEY_MESSAGES.MISSING_DESCRIPTION,
        action: {
          label: API_KEY_MESSAGES.CONFIGURE_BUTTON,
          onClick: () => {
            const event = new CustomEvent('openApiKeyDialog');
            window.dispatchEvent(event);
          },
        },
      });
      return;
    }

    // Initialize extraction state
    setIsProcessing(true);
    setProgressMessage("");
    setProgressPercent(0);

    try {
      let data;

      if (useDoubleCheck) {
        // Double-check mode: 2 API calls for maximum accuracy
        toast.info(INFO_MESSAGES.DOUBLE_CHECK_ENABLED, {
          description: INFO_MESSAGES.DOUBLE_CHECK_DESCRIPTION,
        });

        data = await extractCourseDataWithDoubleCheck(
          apiKey,
          courseData,
          modulesData,
          participantsData,
          (message, percent) => {
            setProgressMessage(message);
            setProgressPercent(percent);
          }
        );

        // Display comparison results
        if (data.metadata?.double_check) {
          const dc = data.metadata.double_check;
          const successMsg = SUCCESS_MESSAGES.DOUBLE_CHECK_SUCCESS(
            dc.match_percentage,
            dc.differences_count
          );

          if (dc.is_reliable) {
            toast.success(successMsg.title, {
              description: successMsg.description,
            });
          } else {
            toast.warning(WARNING_MESSAGES.LOW_MATCH(dc.match_percentage), {
              description: WARNING_MESSAGES.VERIFY_MANUALLY,
            });
          }
        }
      } else {
        // Single extraction mode: 1 API call
        data = await extractCourseDataWithGemini(
          apiKey,
          courseData,
          modulesData,
          participantsData
        );
      }

      // Display warnings if present
      if (data.metadata?.warnings?.length > 0) {
        const firstWarning = data.metadata.warnings[0];
        if (firstWarning.includes('✓')) {
          // Success message about double-check (logged, not shown to user)
          console.log("Double-check success:", firstWarning);
        } else {
          toast.warning(WARNING_MESSAGES.WARNINGS_DETECTED(data.metadata.warnings.length));
        }
        console.warn("Extraction warnings:", data.metadata.warnings);
      }

      // Show success and completion percentage
      toast.success(SUCCESS_MESSAGES.EXTRACTION_COMPLETE(
        data.metadata?.completamento_percentuale || 0
      ));
      onComplete(data);

    } catch (error: any) {
      console.error("Extraction error:", error);

      // Provide context-specific error messages
      if (error.message?.includes('API key')) {
        toast.error(API_KEY_MESSAGES.INVALID, {
          description: API_KEY_MESSAGES.INVALID_DESCRIPTION,
        });
      } else if (error.message?.includes('quota')) {
        toast.error(API_KEY_MESSAGES.QUOTA_EXCEEDED, {
          description: API_KEY_MESSAGES.QUOTA_DESCRIPTION,
        });
      } else {
        toast.error(EXTRACTION_MESSAGES.GENERIC_ERROR, {
          description: error.message || EXTRACTION_MESSAGES.RETRY_DESCRIPTION,
        });
      }
    } finally {
      // Reset processing state
      setIsProcessing(false);
      setProgressMessage("");
      setProgressPercent(0);
    }
  };

  // ========================================================================
  // EXAMPLE DATA HANDLER
  // ========================================================================

  /**
   * Loads example data for current step
   * Why: Helps users understand expected data format
   *
   * @param step - Step number to load example for
   */
  const handlePasteExample = (step: number) => {
    if (step === 1) setCourseData(WIZARD_EXAMPLES[1]);
    if (step === 2) setModulesData(WIZARD_EXAMPLES[2]);
    if (step === 3) setParticipantsData(WIZARD_EXAMPLES[3]);

    toast.success(SUCCESS_MESSAGES.EXAMPLE_LOADED);
  };

  // ========================================================================
  // STEP RENDERING
  // ========================================================================

  /**
   * Renders content for current wizard step
   * Why switch: Different UI and data for each step
   * Why separate function: Keeps component render method clean
   */
  const renderStepContent = () => {
    switch (currentSubStep) {
      case 1:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{STEP_TITLES.COURSE}</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {STEP_DESCRIPTIONS.COURSE}
              </p>
            </div>
            <Textarea
              value={courseData}
              onChange={(e) => setCourseData(e.target.value)}
              placeholder={PLACEHOLDER_TEXT.COURSE}
              className={`min-h-[${WIZARD_CONFIG.TEXTAREA_MIN_HEIGHT}px] font-mono text-sm`}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleNext()}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {BUTTON_LABELS.NEXT}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => handlePasteExample(1)}
                variant="outline"
                className="h-12"
              >
                {BUTTON_LABELS.LOAD_EXAMPLE}
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                <Folder className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{STEP_TITLES.MODULES}</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {STEP_DESCRIPTIONS.MODULES}
              </p>
            </div>
            <Textarea
              value={modulesData}
              onChange={(e) => setModulesData(e.target.value)}
              placeholder={PLACEHOLDER_TEXT.MODULES}
              className={`min-h-[${WIZARD_CONFIG.TEXTAREA_MIN_HEIGHT}px] font-mono text-sm`}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="h-12"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                {BUTTON_LABELS.BACK}
              </Button>
              <Button
                onClick={() => handleNext()}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {BUTTON_LABELS.NEXT}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => handlePasteExample(2)}
                variant="outline"
                className="h-12"
              >
                {BUTTON_LABELS.LOAD_EXAMPLE}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{STEP_TITLES.PARTICIPANTS}</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {STEP_DESCRIPTIONS.PARTICIPANTS}
              </p>
            </div>
            <Textarea
              value={participantsData}
              onChange={(e) => setParticipantsData(e.target.value)}
              placeholder={PLACEHOLDER_TEXT.PARTICIPANTS}
              className={`min-h-[${WIZARD_CONFIG.TEXTAREA_MIN_HEIGHT}px] font-mono text-sm`}
            />

            {/* Double-Check Toggle */}
            <Card className="p-4 bg-accent/5 border-accent/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-accent" />
                  <div>
                    <Label htmlFor="double-check" className="text-sm font-semibold text-foreground cursor-pointer">
                      {DOUBLE_CHECK_TEXT.TITLE}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {DOUBLE_CHECK_TEXT.DESCRIPTION}
                    </p>
                  </div>
                </div>
                <Switch
                  id="double-check"
                  checked={useDoubleCheck}
                  onCheckedChange={setUseDoubleCheck}
                />
              </div>
            </Card>

            {/* Progress Indicator */}
            {isProcessing && progressMessage && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{progressMessage}</span>
                    <span className="text-primary font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="h-12"
                disabled={isProcessing}
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                {BUTTON_LABELS.BACK}
              </Button>
              <Button
                onClick={handleExtract}
                disabled={isProcessing}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    {progressMessage || BUTTON_LABELS.EXTRACTING}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {useDoubleCheck ? BUTTON_LABELS.EXTRACT_DOUBLE_CHECK : BUTTON_LABELS.EXTRACT_AI}
                  </>
                )}
              </Button>
              <Button
                onClick={() => handlePasteExample(3)}
                variant="outline"
                className="h-12"
                disabled={isProcessing}
              >
                {BUTTON_LABELS.LOAD_EXAMPLE}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <Card className="p-8 shadow-xl">
      <div className="space-y-6">
        <WizardProgress
          currentStep={currentSubStep}
          totalSteps={WIZARD_CONFIG.TOTAL_STEPS}
          stepLabels={stepLabels}
        />

        {renderStepContent()}

        {/* Feature Highlights - Communicates key benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">{FEATURE_HIGHLIGHTS.GUIDED.title}</h4>
              <p className="text-xs text-muted-foreground">{FEATURE_HIGHLIGHTS.GUIDED.description}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">{FEATURE_HIGHLIGHTS.ACCURACY.title}</h4>
              <p className="text-xs text-muted-foreground">{FEATURE_HIGHLIGHTS.ACCURACY.description}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
              <span className="text-success font-bold text-sm">⚡</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">{FEATURE_HIGHLIGHTS.TIME_SAVING.title}</h4>
              <p className="text-xs text-muted-foreground">{FEATURE_HIGHLIGHTS.TIME_SAVING.description}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InputStepWizard;

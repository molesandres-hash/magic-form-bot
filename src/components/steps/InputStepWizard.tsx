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

interface InputStepWizardProps {
  onComplete: (data: any) => void;
}

const InputStepWizard = ({ onComplete }: InputStepWizardProps) => {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [courseData, setCourseData] = useState("");
  const [modulesData, setModulesData] = useState("");
  const [participantsData, setParticipantsData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [useDoubleCheck, setUseDoubleCheck] = useState(true); // Default to enabled
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  const stepLabels = ["Dati Corso", "Moduli", "Partecipanti"];

  const handleNext = () => {
    if (currentSubStep === 1 && !courseData.trim()) {
      toast.error("Inserisci i dati del corso prima di procedere");
      return;
    }
    if (currentSubStep === 2 && !modulesData.trim()) {
      toast.error("Inserisci i dati dei moduli prima di procedere");
      return;
    }
    if (currentSubStep === 3 && !participantsData.trim()) {
      toast.error("Inserisci i dati dei partecipanti prima di procedere");
      return;
    }

    if (currentSubStep < 3) {
      setCurrentSubStep(currentSubStep + 1);
      toast.success(`Step ${currentSubStep} completato!`);
    }
  };

  const handleBack = () => {
    if (currentSubStep > 1) {
      setCurrentSubStep(currentSubStep - 1);
    }
  };

  const handleExtract = async () => {
    if (!participantsData.trim()) {
      toast.error("Completa tutti e 3 gli step prima di estrarre i dati");
      return;
    }

    // Check for API key
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      toast.error("Configurare prima la chiave API Google Gemini", {
        description: "Clicca sul pulsante 'API Key' in alto per configurarla",
        action: {
          label: "Configura",
          onClick: () => {
            const event = new CustomEvent('openApiKeyDialog');
            window.dispatchEvent(event);
          },
        },
      });
      return;
    }

    setIsProcessing(true);
    setProgressMessage("");
    setProgressPercent(0);

    try {
      let data;

      if (useDoubleCheck) {
        // Use double-check mode (2 API calls)
        toast.info("Doppia verifica abilitata", {
          description: "Verranno effettuate 2 estrazioni per garantire massima accuratezza",
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

        // Show comparison results
        if (data.metadata?.double_check) {
          const dc = data.metadata.double_check;
          if (dc.is_reliable) {
            toast.success(`Doppia verifica completata: ${dc.match_percentage}% di corrispondenza`, {
              description: dc.differences_count === 0
                ? "Le due estrazioni sono identiche!"
                : `${dc.differences_count} piccole differenze rilevate`,
            });
          } else {
            toast.warning(`Attenzione: ${dc.match_percentage}% di corrispondenza`, {
              description: "Verifica manualmente i dati estratti",
            });
          }
        }
      } else {
        // Use single extraction mode
        data = await extractCourseDataWithGemini(
          apiKey,
          courseData,
          modulesData,
          participantsData
        );
      }

      // Show warnings if present
      if (data.metadata?.warnings?.length > 0) {
        const firstWarning = data.metadata.warnings[0];
        if (firstWarning.includes('✓')) {
          // Success message about double-check
          console.log("Double-check success:", firstWarning);
        } else {
          toast.warning(`Attenzione: ${data.metadata.warnings.length} avvisi rilevati`);
        }
        console.warn("Extraction warnings:", data.metadata.warnings);
      }

      toast.success(`Dati estratti! Completamento: ${data.metadata?.completamento_percentuale || 0}%`);
      onComplete(data);

    } catch (error: any) {
      console.error("Extraction error:", error);

      // Provide helpful error messages
      if (error.message?.includes('API key')) {
        toast.error("Chiave API non valida", {
          description: "Verifica che la chiave API sia corretta",
        });
      } else if (error.message?.includes('quota')) {
        toast.error("Quota API esaurita", {
          description: "Hai raggiunto il limite di richieste giornaliere",
        });
      } else {
        toast.error("Errore durante l'estrazione dei dati", {
          description: error.message || "Riprova tra qualche secondo",
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
      setProgressPercent(0);
    }
  };

  const handlePasteExample = (step: number) => {
    if (step === 1) setCourseData(WIZARD_EXAMPLES[1]);
    if (step === 2) setModulesData(WIZARD_EXAMPLES[2]);
    if (step === 3) setParticipantsData(WIZARD_EXAMPLES[3]);

    toast.success("Esempio caricato!");
  };

  const renderStepContent = () => {
    switch (currentSubStep) {
      case 1:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Step 1: Dati Corso Principale</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Apri la schermata principale del corso nel gestionale e copia tutti i dati visibili
              </p>
            </div>
            <Textarea
              value={courseData}
              onChange={(e) => setCourseData(e.target.value)}
              placeholder="Incolla qui i dati del corso...

Esempio:
ID Corso: 21342
Titolo: Corso di Formazione...
Date: dal 19/08/2025 al 23/08/2025..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleNext()}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Avanti
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => handlePasteExample(1)}
                variant="outline"
                className="h-12"
              >
                Carica Esempio
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
              <h3 className="text-xl font-bold text-foreground">Step 2: Dati Moduli</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Clicca sulla sezione "Moduli" nel gestionale e copia tutti i dati dei moduli
              </p>
            </div>
            <Textarea
              value={modulesData}
              onChange={(e) => setModulesData(e.target.value)}
              placeholder="Incolla qui i dati dei moduli...

Esempio:
Sezione: 13993
Modulo: Modulo Base
Orari: 09:00-13:00 / 14:00-18:00..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="h-12"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Indietro
              </Button>
              <Button
                onClick={() => handleNext()}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Avanti
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => handlePasteExample(2)}
                variant="outline"
                className="h-12"
              >
                Carica Esempio
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
              <h3 className="text-xl font-bold text-foreground">Step 3: Dati Partecipanti</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Seleziona un modulo, poi copia l'elenco completo dei partecipanti
              </p>
            </div>
            <Textarea
              value={participantsData}
              onChange={(e) => setParticipantsData(e.target.value)}
              placeholder="Incolla qui l'elenco partecipanti...

Esempio:
1. Mario Rossi - CF: RSSMRA80A01H501Z
   Email: mario.rossi@example.com
   Tel: 3331234567..."
              className="min-h-[300px] font-mono text-sm"
            />

            {/* Double-Check Toggle */}
            <Card className="p-4 bg-accent/5 border-accent/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-accent" />
                  <div>
                    <Label htmlFor="double-check" className="text-sm font-semibold text-foreground cursor-pointer">
                      Doppia Verifica (Consigliato)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Effettua 2 estrazioni indipendenti e confronta i risultati per massima accuratezza
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
                Indietro
              </Button>
              <Button
                onClick={handleExtract}
                disabled={isProcessing}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    {progressMessage || "Estrazione in corso..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {useDoubleCheck ? "Estrai con Doppia Verifica" : "Estrai con AI"}
                  </>
                )}
              </Button>
              <Button
                onClick={() => handlePasteExample(3)}
                variant="outline"
                className="h-12"
                disabled={isProcessing}
              >
                Carica Esempio
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-8 shadow-xl">
      <div className="space-y-6">
        <WizardProgress
          currentStep={currentSubStep}
          totalSteps={3}
          stepLabels={stepLabels}
        />

        {renderStepContent()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Processo Guidato</h4>
              <p className="text-xs text-muted-foreground">3 step semplici e chiari</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Doppia Verifica</h4>
              <p className="text-xs text-muted-foreground">Accuratezza garantita al 99%</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
              <span className="text-success font-bold text-sm">⚡</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Risparmio Tempo</h4>
              <p className="text-xs text-muted-foreground">Da 60 min a 5 min</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InputStepWizard;

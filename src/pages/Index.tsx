import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Sparkles, CheckCircle, Download, LogOut, Settings, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InputStepWizard from "@/components/steps/InputStepWizard";
import AdditionalDataStep, { AdditionalData } from "@/components/steps/AdditionalDataStep";
import CompletionStepExpanded from "@/components/steps/CompletionStepExpanded";
import GenerationStep from "@/components/steps/GenerationStep";
import SettingsDialog from "@/components/dialogs/SettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import type { CourseData } from "@/types/courseData";

type Step = "input" | "additional" | "completion" | "generation";

// Removed unused ExtractedData interface - using CourseData from types instead

const Index = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("input");
  const [extractedData, setExtractedData] = useState<CourseData | null>(null);
  const [additionalData, setAdditionalData] = useState<AdditionalData | null>(null);
  const [completedData, setCompletedData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Removed authentication requirement for main page

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    navigate("/auth");
  };

  // No loading screen needed - app is accessible without auth

  const steps = [
    { id: "input", label: "Incolla Dati", icon: FileText, completed: ["additional", "completion", "generation"].includes(currentStep) },
    { id: "additional", label: "Dati Aggiuntivi", icon: UserCheck, completed: ["completion", "generation"].includes(currentStep) },
    { id: "completion", label: "Completa Dati", icon: CheckCircle, completed: currentStep === "generation" },
    { id: "generation", label: "Genera Documenti", icon: Download, completed: false },
  ];

  const handleInputComplete = (data: CourseData) => {
    setExtractedData(data);
    setCurrentStep("additional");
  };

  const handleAdditionalComplete = (data: AdditionalData) => {
    setAdditionalData(data);

    // Merge additional data into extracted data
    if (extractedData) {
      const updatedData = {
        ...extractedData,
        trainer: {
          ...extractedData.trainer,
          nome: data.nomeDocente || extractedData.trainer?.nome,
          cognome: data.cognomeDocente || extractedData.trainer?.cognome,
          codice_fiscale: data.codiceFiscaleDocente || extractedData.trainer?.codice_fiscale,
          nome_completo: `${data.nomeDocente || ''} ${data.cognomeDocente || ''}`.trim() || extractedData.trainer?.nome_completo,
        },
        sede: {
          ...extractedData.sede,
          nome: data.sedeAccreditata || extractedData.sede?.nome,
          indirizzo: data.indirizzoSede || extractedData.sede?.indirizzo,
        },
        ente: {
          ...extractedData.ente,
          nome: data.nomeEnte || extractedData.ente?.nome,
          indirizzo: data.indirizzoEnte || extractedData.ente?.indirizzo,
        },
        fad_info: {
          ...extractedData.fad_info,
          piattaforma: data.piattaforma || extractedData.fad_info?.piattaforma,
          link_zoom: data.linkZoom, // Add link zoom if supported in types
        },
        // Add note if supported
      };
      setExtractedData(updatedData);
    }

    setCurrentStep("completion");
  };

  const handleCompletionComplete = (data: any) => {
    setCompletedData(data);
    setCurrentStep("generation");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Compilatore Documenti di Avvio Corso
                </h1>
                <p className="text-muted-foreground">
                  Sistema Automatico di Generazione Documenti Formativi
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Impostazioni
              </Button>
              {user ? (
                <>
                  {isAdmin && (
                    <Button variant="outline" onClick={() => navigate("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-6 h-0.5 bg-muted -z-10">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{
                  width: `${(steps.findIndex(s => s.id === currentStep) / (steps.length - 1)) * 100}%`
                }}
              />
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.completed;

              return (
                <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={`
                      h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive ? "bg-gradient-to-br from-primary to-accent shadow-lg scale-110" : ""}
                      ${isCompleted ? "bg-success" : ""}
                      ${!isActive && !isCompleted ? "bg-muted" : ""}
                    `}
                  >
                    <Icon className={`h-6 w-6 ${isActive || isCompleted ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === "input" && (
            <InputStepWizard onComplete={handleInputComplete} />
          )}

          {currentStep === "additional" && extractedData && (
            <AdditionalDataStep
              onComplete={handleAdditionalComplete}
              onBack={() => setCurrentStep("input")}
              initialData={{
                codiceFiscaleDocente: extractedData.trainer?.codice_fiscale,
                nomeDocente: extractedData.trainer?.nome,
                cognomeDocente: extractedData.trainer?.cognome,
                sedeAccreditata: extractedData.sede?.nome,
                indirizzoSede: extractedData.sede?.indirizzo,
                nomeEnte: extractedData.ente?.nome,
                indirizzoEnte: extractedData.ente?.indirizzo,
                piattaforma: extractedData.fad_info?.piattaforma,
              }}
            />
          )}

          {currentStep === "completion" && extractedData && (
            <CompletionStepExpanded
              extractedData={extractedData}
              onComplete={handleCompletionComplete}
              onBack={() => setCurrentStep("additional")}
            />
          )}

          {currentStep === "generation" && completedData && (
            <GenerationStep
              data={completedData}
              onBack={() => setCurrentStep("completion")}
            />
          )}
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
    </div>
  );
};

export default Index;

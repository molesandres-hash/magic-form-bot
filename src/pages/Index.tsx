import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Sparkles, CheckCircle, Download, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InputStep from "@/components/steps/InputStep";
import ExtractionStep from "@/components/steps/ExtractionStep";
import CompletionStep from "@/components/steps/CompletionStep";
import GenerationStep from "@/components/steps/GenerationStep";
import { useAuth } from "@/hooks/useAuth";

type Step = "input" | "extraction" | "completion" | "generation";

interface ExtractedData {
  corso?: {
    id: string;
    titolo: string;
    tipo: string;
    data_inizio: string;
    data_fine: string;
  };
  partecipanti?: Array<{
    nome: string;
    cognome: string;
    codice_fiscale: string;
    email: string;
  }>;
  [key: string]: any;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("input");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [completedData, setCompletedData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
    { id: "input", label: "Incolla Dati", icon: FileText, completed: ["extraction", "completion", "generation"].includes(currentStep) },
    { id: "extraction", label: "Estrazione AI", icon: Sparkles, completed: ["completion", "generation"].includes(currentStep) },
    { id: "completion", label: "Completa Dati", icon: CheckCircle, completed: currentStep === "generation" },
    { id: "generation", label: "Genera Documenti", icon: Download, completed: false },
  ];

  const handleInputComplete = (data: ExtractedData) => {
    setExtractedData(data);
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
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">DocuCompile AI</h1>
                <p className="text-sm text-muted-foreground">Sistema Automatico Compilazione Documenti Formativi</p>
              </div>
            </div>
            <div className="flex gap-2">
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
            <InputStep onComplete={handleInputComplete} />
          )}
          {currentStep === "extraction" && extractedData && (
            <ExtractionStep 
              data={extractedData} 
              onComplete={() => setCurrentStep("completion")} 
            />
          )}
          {currentStep === "completion" && extractedData && (
            <CompletionStep 
              extractedData={extractedData}
              onComplete={handleCompletionComplete}
              onBack={() => setCurrentStep("input")}
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
    </div>
  );
};

export default Index;

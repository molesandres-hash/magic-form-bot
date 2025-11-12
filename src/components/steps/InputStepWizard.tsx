import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChevronRight, ChevronLeft, FileText, Folder, Users } from "lucide-react";
import { toast } from "sonner";
import WizardProgress from "./WizardProgress";

interface InputStepWizardProps {
  onComplete: (data: any) => void;
}

const InputStepWizard = ({ onComplete }: InputStepWizardProps) => {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [courseData, setCourseData] = useState("");
  const [modulesData, setModulesData] = useState("");
  const [participantsData, setParticipantsData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
      toast.error("Completa tutti gli step prima di estrarre i dati");
      return;
    }

    setIsProcessing(true);
    
    try {
      // TODO: Replace with actual Lovable AI extraction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data
      const mockData = {
        corso: {
          id: "21342",
          titolo: "Corso di Formazione Professionale",
          tipo: "Aula",
          data_inizio: "19/08/2025",
          data_fine: "23/08/2025",
          ore_totali: "40",
        },
        modulo: {
          id: "13993",
          titolo: "Modulo Base"
        },
        partecipanti: [
          {
            id: "18145",
            nome: "Mario",
            cognome: "Rossi",
            codice_fiscale: "RSSMRA80A01H501Z",
            email: "mario.rossi@example.com",
            telefono: "3331234567"
          },
          {
            id: "18146",
            nome: "Laura",
            cognome: "Bianchi",
            codice_fiscale: "BNCLRA85B42H501W",
            email: "laura.bianchi@example.com",
            telefono: "3339876543"
          }
        ],
        sessioni: [
          {
            data: "19/08/2025",
            ora_inizio: "09:00",
            ora_fine: "13:00"
          },
          {
            data: "19/08/2025",
            ora_inizio: "14:00",
            ora_fine: "18:00"
          }
        ]
      };

      toast.success("Dati estratti con successo!");
      onComplete(mockData);
    } catch (error) {
      toast.error("Errore durante l'estrazione dei dati");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteExample = (step: number) => {
    const examples = {
      1: `ID Corso: 21342
Titolo: Corso di Formazione Professionale Avanzato
Date corso: dal 19/08/2025 al 23/08/2025
Ore totali: 40
Sede: Aula Formativa - Via Roma 123, Milano
Stato: Confermato`,
      2: `Sezione: 13993
Modulo: Modulo Base Operativo
Orari: 09:00-13:00 / 14:00-18:00
Trainer: Dott. Giovanni Verdi
Provider: Ente Formazione Professionale`,
      3: `PARTECIPANTI:
1. Mario Rossi - CF: RSSMRA80A01H501Z - Email: mario.rossi@example.com - Tel: 3331234567
2. Laura Bianchi - CF: BNCLRA85B42H501W - Email: laura.bianchi@example.com - Tel: 3339876543`
    };
    
    if (step === 1) setCourseData(examples[1]);
    if (step === 2) setModulesData(examples[2]);
    if (step === 3) setParticipantsData(examples[3]);
    
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
                onClick={handleExtract}
                disabled={isProcessing}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Estrazione in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Estrai con AI
                  </>
                )}
              </Button>
              <Button
                onClick={() => handlePasteExample(3)}
                variant="outline"
                className="h-12"
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
              <span className="text-accent font-bold text-sm">AI</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Estrazione Automatica</h4>
              <p className="text-xs text-muted-foreground">Precisione superiore al 95%</p>
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

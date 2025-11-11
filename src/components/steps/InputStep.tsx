import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

interface InputStepProps {
  onComplete: (data: any) => void;
}

const InputStep = ({ onComplete }: InputStepProps) => {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExtract = async () => {
    if (!inputText.trim()) {
      toast.error("Inserisci i dati del corso prima di procedere");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate AI extraction (will be replaced with actual Lovable AI call)
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

  const handlePasteExample = () => {
    const exampleText = `ID Corso: 21342
Sezione: 13993
Titolo: Corso di Formazione Professionale Avanzato
Modulo: Modulo Base Operativo

Date corso: dal 19/08/2025 al 23/08/2025
Orari: 09:00-13:00 / 14:00-18:00
Ore totali: 40
Sede: Aula Formativa - Via Roma 123, Milano
Stato: Confermato

PARTECIPANTI:
1. Mario Rossi - CF: RSSMRA80A01H501Z - Email: mario.rossi@example.com - Tel: 3331234567
2. Laura Bianchi - CF: BNCLRA85B42H501W - Email: laura.bianchi@example.com - Tel: 3339876543

Trainer: Dott. Giovanni Verdi
Provider: Ente Formazione Professionale`;
    
    setInputText(exampleText);
    toast.success("Esempio caricato! Clicca 'Estrai con AI' per continuare");
  };

  return (
    <Card className="p-8 shadow-xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Incolla i Dati del Corso</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Copia e incolla i dati dal gestionale formativo. L'intelligenza artificiale estrarrà automaticamente
            tutte le informazioni necessarie per generare i documenti.
          </p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Incolla qui i dati copiati dal gestionale...

Esempio:
ID Corso: 21342
Titolo: Corso di Formazione...
Partecipanti:
- Mario Rossi, CF: RSSMRA80A01H501Z..."
            className="min-h-[400px] font-mono text-sm"
          />

          <div className="flex items-center gap-3">
            <Button
              onClick={handleExtract}
              disabled={isProcessing || !inputText.trim()}
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
              onClick={handlePasteExample}
              variant="outline"
              className="h-12"
            >
              <Upload className="mr-2 h-4 w-4" />
              Carica Esempio
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Copia i dati</h4>
              <p className="text-xs text-muted-foreground">Dal tuo gestionale formativo</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="text-accent font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">AI estrae tutto</h4>
              <p className="text-xs text-muted-foreground">Automaticamente e con precisione</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
              <span className="text-success font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Completa e scarica</h4>
              <p className="text-xs text-muted-foreground">Documenti pronti in minuti</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InputStep;

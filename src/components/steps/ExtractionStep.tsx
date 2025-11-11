import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface ExtractionStepProps {
  data: any;
  onComplete: () => void;
}

const ExtractionStep = ({ data, onComplete }: ExtractionStepProps) => {
  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Card className="p-12 shadow-xl">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 animate-ping"></div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Estrazione in Corso...</h2>
          <p className="text-muted-foreground max-w-md">
            L'intelligenza artificiale sta analizzando i dati e estraendo tutte le informazioni necessarie.
            Questo richiederà solo pochi secondi.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 w-full max-w-2xl">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">✓</div>
            <div className="text-xs text-muted-foreground mt-1">Dati corso</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">✓</div>
            <div className="text-xs text-muted-foreground mt-1">Partecipanti</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary animate-pulse">...</div>
            <div className="text-xs text-muted-foreground mt-1">Sessioni</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground animate-pulse">...</div>
            <div className="text-xs text-muted-foreground mt-1">Validazione</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExtractionStep;

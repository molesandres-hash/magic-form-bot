import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText, CheckCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface GenerationStepProps {
  data: any;
  onBack: () => void;
}

const GenerationStep = ({ data, onBack }: GenerationStepProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);

  const documents = [
    {
      id: "registro",
      name: `Registro_ID_${data.corso?.id}.docx`,
      type: "Registro Didattico e Presenze",
      icon: "📋",
      generated: true,
    },
    {
      id: "verbale",
      name: `Verbale_Corso_ID_${data.corso?.id}.docx`,
      type: "Verbale di Partecipazione",
      icon: "📄",
      generated: true,
    },
    {
      id: "verbale_esame",
      name: `Verbale_Ammissione_Esame_ID_${data.corso?.id}.pdf`,
      type: "Verbale Scrutinio",
      icon: "📝",
      generated: true,
    },
    {
      id: "fad",
      name: `Modello_A_FAD_${data.corso?.id}.docx`,
      type: "Calendario E-Learning",
      icon: "💻",
      generated: data.corso?.tipo === "e-learning",
    },
  ];

  const handleDownload = (docId: string) => {
    toast.success(`Download di ${docId} iniziato`);
    // In a real implementation, this would trigger the actual file download
  };

  const handleDownloadAll = () => {
    toast.success("Download di tutti i documenti iniziato");
    // In a real implementation, this would create a ZIP and download all files
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 shadow-xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Documenti Generati!</h2>
                  <p className="text-muted-foreground">Tutti i documenti sono pronti per il download</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={onBack}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>
          </div>

          {/* Summary Card */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{data.corso?.id}</div>
                <div className="text-xs text-muted-foreground">ID Corso</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{data.partecipanti?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Partecipanti</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{documents.filter(d => d.generated).length}</div>
                <div className="text-xs text-muted-foreground">Documenti</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">✓</div>
                <div className="text-xs text-muted-foreground">Completato</div>
              </div>
            </div>
          </Card>

          {/* Documents List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground mb-4">Documenti Disponibili</h3>
            {documents.filter(doc => doc.generated).map((doc) => (
              <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{doc.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{doc.name}</h4>
                      <p className="text-sm text-muted-foreground">{doc.type}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(doc.id)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Scarica
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              onClick={handleDownloadAll}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Download className="mr-2 h-5 w-5" />
              Scarica Tutti i Documenti (ZIP)
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1 h-12"
            >
              <FileText className="mr-2 h-5 w-5" />
              Nuovo Corso
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card">
          <h4 className="font-semibold text-sm mb-2 text-foreground">⚡ Tempo Risparmiato</h4>
          <p className="text-2xl font-bold text-primary">~55 minuti</p>
          <p className="text-xs text-muted-foreground mt-1">Rispetto alla compilazione manuale</p>
        </Card>
        <Card className="p-4 bg-card">
          <h4 className="font-semibold text-sm mb-2 text-foreground">🎯 Accuratezza</h4>
          <p className="text-2xl font-bold text-success">100%</p>
          <p className="text-xs text-muted-foreground mt-1">Nessun errore di trascrizione</p>
        </Card>
        <Card className="p-4 bg-card">
          <h4 className="font-semibold text-sm mb-2 text-foreground">📊 Documenti</h4>
          <p className="text-2xl font-bold text-accent">{documents.filter(d => d.generated).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Generati automaticamente</p>
        </Card>
      </div>
    </div>
  );
};

export default GenerationStep;

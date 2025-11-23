import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ChevronLeft, ArrowRight, User, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ExtractedDataType {
  corso?: {
    id?: string;
    titolo?: string;
    data_inizio?: string;
    data_fine?: string;
  };
  partecipanti?: any[]; // Keep any for participants for now, can be refined later if needed
}

interface CompletionStepProps {
  extractedData: ExtractedDataType;
  onComplete: (data: ExtractedDataType & typeof formData) => void;
  onBack: () => void;
}

const CompletionStep = ({ extractedData, onComplete, onBack }: CompletionStepProps) => {
  const [formData, setFormData] = useState({
    direttore: "",
    supervisore: "",
    responsabile_nome: "",
    responsabile_cognome: "",
    responsabile_cf: "",
    ente_accreditato: "",
    sede_ente: "",
    argomenti_lezione_1: "",
    argomenti_lezione_2: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.direttore || !formData.responsabile_nome || !formData.responsabile_cognome) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    const completeData = {
      ...extractedData,
      ...formData,
    };

    toast.success("Dati completati con successo!");
    onComplete(completeData);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-8 shadow-xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Completa i Dati Mancanti</h2>
            <p className="text-muted-foreground">
              L'AI ha estratto la maggior parte delle informazioni. Completa i campi rimanenti.
            </p>
          </div>
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
        </div>

        {/* Extracted Data Summary */}
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-success mb-2">Dati Estratti Automaticamente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Corso ID:</span>
                  <span className="ml-2 font-medium text-foreground">{extractedData.corso?.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Titolo:</span>
                  <span className="ml-2 font-medium text-foreground">{extractedData.corso?.titolo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {extractedData.corso?.data_inizio} - {extractedData.corso?.data_fine}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Partecipanti:</span>
                  <span className="ml-2 font-medium text-foreground">{extractedData.partecipanti?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Accordion type="single" collapsible defaultValue="staff" className="space-y-4">
            {/* Staff Section */}
            <AccordionItem value="staff" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Dati Anagrafici Staff</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="direttore">Direttore del Corso *</Label>
                    <Input
                      id="direttore"
                      value={formData.direttore}
                      onChange={(e) => updateField("direttore", e.target.value)}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisore">Supervisore</Label>
                    <Input
                      id="supervisore"
                      value={formData.supervisore}
                      onChange={(e) => updateField("supervisore", e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3 text-foreground">Responsabile Certificazione</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resp_nome">Nome *</Label>
                      <Input
                        id="resp_nome"
                        value={formData.responsabile_nome}
                        onChange={(e) => updateField("responsabile_nome", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resp_cognome">Cognome *</Label>
                      <Input
                        id="resp_cognome"
                        value={formData.responsabile_cognome}
                        onChange={(e) => updateField("responsabile_cognome", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resp_cf">Codice Fiscale</Label>
                      <Input
                        id="resp_cf"
                        value={formData.responsabile_cf}
                        onChange={(e) => updateField("responsabile_cf", e.target.value.toUpperCase())}
                        placeholder="RSSMRA80A01H501Z"
                        maxLength={16}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sede Section */}
            <AccordionItem value="sede" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-accent" />
                  <span className="font-semibold">Ente e Sede</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ente">Ente Accreditato</Label>
                    <Input
                      id="ente"
                      value={formData.ente_accreditato}
                      onChange={(e) => updateField("ente_accreditato", e.target.value)}
                      placeholder="Nome ente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sede_ente">Sede Ente</Label>
                    <Input
                      id="sede_ente"
                      value={formData.sede_ente}
                      onChange={(e) => updateField("sede_ente", e.target.value)}
                      placeholder="Indirizzo completo"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Didattica Section */}
            <AccordionItem value="didattica" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-success" />
                  <span className="font-semibold">Contenuti Didattici</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="argomenti_1">Argomenti Lezione 1 (09:00-13:00)</Label>
                    <Textarea
                      id="argomenti_1"
                      value={formData.argomenti_lezione_1}
                      onChange={(e) => updateField("argomenti_lezione_1", e.target.value)}
                      placeholder="Descrivi gli argomenti trattati..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="argomenti_2">Argomenti Lezione 2 (14:00-18:00)</Label>
                    <Textarea
                      id="argomenti_2"
                      value={formData.argomenti_lezione_2}
                      onChange={(e) => updateField("argomenti_lezione_2", e.target.value)}
                      placeholder="Descrivi gli argomenti trattati..."
                      rows={3}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end pt-6 border-t">
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Genera Documenti
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default CompletionStep;

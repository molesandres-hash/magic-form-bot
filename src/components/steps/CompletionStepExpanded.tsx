import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { CourseData } from "@/types/courseData";

interface CompletionStepExpandedProps {
  extractedData: CourseData;
  onComplete: (data: CourseData) => void;
  onBack: () => void;
}

export default function CompletionStepExpanded({ extractedData, onComplete, onBack }: CompletionStepExpandedProps) {
  const [formData, setFormData] = useState<CourseData>(extractedData);

  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.direttore.nome || !formData.direttore.cognome) {
      toast.error("Inserisci i dati del Direttore del Corso");
      return;
    }
    
    if (!formData.supervisore.nome || !formData.supervisore.cognome) {
      toast.error("Inserisci i dati del Supervisore");
      return;
    }

    // Update nome_completo fields
    formData.direttore.nome_completo = `${formData.direttore.nome} ${formData.direttore.cognome}`;
    formData.supervisore.nome_completo = `${formData.supervisore.nome} ${formData.supervisore.cognome}`;
    
    if (formData.responsabile_cert.nome && formData.responsabile_cert.cognome) {
      formData.responsabile_cert.nome_completo = `${formData.responsabile_cert.nome} ${formData.responsabile_cert.cognome}`;
      formData.responsabile_cert.indirizzo_completo = `${formData.responsabile_cert.via_residenza} ${formData.responsabile_cert.numero_civico}, ${formData.responsabile_cert.citta_residenza}`;
    }

    toast.success("Dati completati! Procedi con la generazione documenti");
    onComplete(formData);
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-primary to-primary-glow text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Completa i Dati Mancanti</CardTitle>
            <CardDescription className="text-green-50">
              Inserisci manualmente i dati che non possono essere estratti automaticamente
            </CardDescription>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Warning se ci sono validazioni fallite */}
        {extractedData.metadata?.warnings?.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Avvisi di Validazione</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  {extractedData.metadata.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <Accordion type="multiple" className="space-y-4" defaultValue={["staff"]}>
          {/* 1. STAFF */}
          <AccordionItem value="staff" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">1. Staff e Responsabili</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {/* Direttore */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Direttore del Corso *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input 
                      value={formData.direttore.nome}
                      onChange={(e) => updateField('direttore.nome', e.target.value)}
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <Label>Cognome</Label>
                    <Input 
                      value={formData.direttore.cognome}
                      onChange={(e) => updateField('direttore.cognome', e.target.value)}
                      placeholder="Cognome"
                    />
                  </div>
                </div>
              </div>

              {/* Supervisore */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Supervisore *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input 
                      value={formData.supervisore.nome}
                      onChange={(e) => updateField('supervisore.nome', e.target.value)}
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <Label>Cognome</Label>
                    <Input 
                      value={formData.supervisore.cognome}
                      onChange={(e) => updateField('supervisore.cognome', e.target.value)}
                      placeholder="Cognome"
                    />
                  </div>
                </div>
              </div>

              {/* Responsabile Certificazione */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Responsabile Certificazione (opzionale)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input 
                      value={formData.responsabile_cert.nome}
                      onChange={(e) => updateField('responsabile_cert.nome', e.target.value)}
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <Label>Cognome</Label>
                    <Input 
                      value={formData.responsabile_cert.cognome}
                      onChange={(e) => updateField('responsabile_cert.cognome', e.target.value)}
                      placeholder="Cognome"
                    />
                  </div>
                  <div>
                    <Label>Data di Nascita</Label>
                    <Input 
                      value={formData.responsabile_cert.data_nascita}
                      onChange={(e) => updateField('responsabile_cert.data_nascita', e.target.value)}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label>Città di Nascita</Label>
                    <Input 
                      value={formData.responsabile_cert.citta_nascita}
                      onChange={(e) => updateField('responsabile_cert.citta_nascita', e.target.value)}
                      placeholder="Milano"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. ENTE ACCREDITATO */}
          <AccordionItem value="ente" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">2. Ente Accreditato</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Ente</Label>
                  <Input 
                    value={formData.ente.accreditato.nome}
                    onChange={(e) => updateField('ente.accreditato.nome', e.target.value)}
                    placeholder="Nome ente accreditato"
                  />
                </div>
                <div>
                  <Label>Via</Label>
                  <Input 
                    value={formData.ente.accreditato.via}
                    onChange={(e) => updateField('ente.accreditato.via', e.target.value)}
                    placeholder="Via"
                  />
                </div>
                <div>
                  <Label>Numero Civico</Label>
                  <Input 
                    value={formData.ente.accreditato.numero_civico}
                    onChange={(e) => updateField('ente.accreditato.numero_civico', e.target.value)}
                    placeholder="N."
                  />
                </div>
                <div>
                  <Label>Comune</Label>
                  <Input 
                    value={formData.ente.accreditato.comune}
                    onChange={(e) => updateField('ente.accreditato.comune', e.target.value)}
                    placeholder="Comune"
                  />
                </div>
                <div>
                  <Label>CAP</Label>
                  <Input 
                    value={formData.ente.accreditato.cap}
                    onChange={(e) => updateField('ente.accreditato.cap', e.target.value)}
                    placeholder="CAP"
                  />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input 
                    value={formData.ente.accreditato.provincia}
                    onChange={(e) => updateField('ente.accreditato.provincia', e.target.value)}
                    placeholder="MI"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. ARGOMENTI LEZIONI */}
          <AccordionItem value="lezioni" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">3. Argomenti delle Lezioni</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {formData.sessioni.map((sessione) => (
                  <div key={sessione.numero} className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      Sessione {sessione.numero} - {sessione.data_completa} ({sessione.giorno_settimana})
                    </h4>
                    <div className="space-y-2">
                      {sessione.lezioni.map((lezione) => (
                        <div key={lezione.numero} className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground min-w-[80px]">
                            {lezione.ora_inizio}-{lezione.ora_fine}
                          </span>
                          <Input 
                            value={lezione.argomento}
                            onChange={(e) => {
                              const newSessioni = [...formData.sessioni];
                              newSessioni[sessione.numero - 1].lezioni[lezione.numero - 1].argomento = e.target.value;
                              updateField('sessioni', newSessioni);
                            }}
                            placeholder={`Argomento lezione ${lezione.numero} (${lezione.tipo})`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. PRESENZE */}
          <AccordionItem value="presenze" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">4. Registro Presenze</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {formData.sessioni.map((sessione) => (
                  <div key={sessione.numero} className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      {sessione.data_completa} - {sessione.giorno_settimana}
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">Partecipante</th>
                            <th className="p-2 text-center">Mattino</th>
                            <th className="p-2 text-center">Pomeriggio</th>
                            <th className="p-2 text-left">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessione.presenze.map((presenza, idx) => (
                            <tr key={presenza.partecipante_id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                              <td className="p-2">{presenza.nome_completo}</td>
                              <td className="p-2 text-center">
                                <Checkbox 
                                  checked={presenza.mattino.presente}
                                  onCheckedChange={(checked) => {
                                    const newSessioni = [...formData.sessioni];
                                    newSessioni[sessione.numero - 1].presenze[idx].mattino.presente = checked as boolean;
                                    newSessioni[sessione.numero - 1].presenze[idx].mattino.assente = !(checked as boolean);
                                    updateField('sessioni', newSessioni);
                                  }}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <Checkbox 
                                  checked={presenza.pomeriggio.presente}
                                  onCheckedChange={(checked) => {
                                    const newSessioni = [...formData.sessioni];
                                    newSessioni[sessione.numero - 1].presenze[idx].pomeriggio.presente = checked as boolean;
                                    newSessioni[sessione.numero - 1].presenze[idx].pomeriggio.assente = !(checked as boolean);
                                    updateField('sessioni', newSessioni);
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <Input 
                                  value={presenza.note || ""}
                                  onChange={(e) => {
                                    const newSessioni = [...formData.sessioni];
                                    newSessioni[sessione.numero - 1].presenze[idx].note = e.target.value;
                                    updateField('sessioni', newSessioni);
                                  }}
                                  placeholder="Note..."
                                  className="h-8"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. REGISTRO */}
          <AccordionItem value="registro" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">5. Informazioni Registro</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Numero Pagine</Label>
                  <Input 
                    value={formData.registro.numero_pagine}
                    onChange={(e) => updateField('registro.numero_pagine', e.target.value)}
                    placeholder="Es. 10"
                  />
                </div>
                <div>
                  <Label>Data Vidimazione</Label>
                  <Input 
                    value={formData.registro.data_vidimazione}
                    onChange={(e) => updateField('registro.data_vidimazione', e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Progress indicator */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completamento Dati</span>
            <span className="text-sm font-bold text-primary">
              {extractedData.metadata?.completamento_percentuale || 0}%
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${extractedData.metadata?.completamento_percentuale || 0}%` }}
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSubmit}
            size="lg"
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Conferma e Procedi alla Generazione
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

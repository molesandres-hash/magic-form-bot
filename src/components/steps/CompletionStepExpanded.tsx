import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CourseData, EnteAccreditato, ResponsabileCorso } from "@/types/courseData";

interface CompletionStepExpandedProps {
  extractedData: CourseData;
  onComplete: (data: CourseData) => void;
  onBack: () => void;
}

export default function CompletionStepExpanded({ extractedData, onComplete, onBack }: CompletionStepExpandedProps) {
  const [formData, setFormData] = useState<CourseData>(extractedData);
  const [enti, setEnti] = useState<EnteAccreditato[]>([]);
  const [direttori, setDirettori] = useState<ResponsabileCorso[]>([]);
  const [supervisori, setSupervisori] = useState<ResponsabileCorso[]>([]);
  const [responsabiliCert, setResponsabiliCert] = useState<ResponsabileCorso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entiRes, responsabiliRes] = await Promise.all([
        supabase.from("enti_accreditati").select("*").order("nome"),
        supabase.from("responsabili_corso").select("*").order("cognome")
      ]);

      if (entiRes.error) throw entiRes.error;
      if (responsabiliRes.error) throw responsabiliRes.error;

      setEnti(entiRes.data || []);
      const responsabili = responsabiliRes.data || [];
      
      // Cast tipo from string to union literal type
      const typedResponsabili = responsabili.map(r => ({
        ...r,
        tipo: r.tipo as 'direttore' | 'supervisore' | 'responsabile_cert'
      }));
      
      setDirettori(typedResponsabili.filter(r => r.tipo === 'direttore'));
      setSupervisori(typedResponsabili.filter(r => r.tipo === 'supervisore'));
      setResponsabiliCert(typedResponsabili.filter(r => r.tipo === 'responsabile_cert'));
    } catch (error: any) {
      toast.error("Errore caricamento dati: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.ente_accreditato_id) {
      toast.error("Seleziona un Ente Accreditato");
      return;
    }
    
    if (!formData.direttore_id) {
      toast.error("Seleziona un Direttore");
      return;
    }
    
    if (!formData.supervisore_id) {
      toast.error("Seleziona un Supervisore");
      return;
    }

    toast.success("Dati completati! Procedi con la generazione documenti");
    onComplete(formData);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="p-6">
          <p>Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-primary to-primary-glow text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Completa i Dati Mancanti</CardTitle>
            <CardDescription className="text-green-50">
              Seleziona enti e responsabili dal database
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

        <Accordion type="multiple" defaultValue={["selezione", "preview"]} className="space-y-4">
          {/* Selezione Enti e Responsabili */}
          <AccordionItem value="selezione" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-lg font-semibold">📋 Selezione Enti e Responsabili</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="ente">Ente Accreditato *</Label>
                  <Select
                    value={formData.ente_accreditato_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, ente_accreditato_id: value })}
                  >
                    <SelectTrigger id="ente">
                      <SelectValue placeholder="Seleziona ente accreditato" />
                    </SelectTrigger>
                    <SelectContent>
                      {enti.map(ente => (
                        <SelectItem key={ente.id} value={ente.id}>
                          {ente.nome} - {ente.comune} ({ente.provincia})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {enti.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Nessun ente disponibile. Contatta l'amministratore.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="direttore">Direttore del Corso *</Label>
                  <Select
                    value={formData.direttore_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, direttore_id: value })}
                  >
                    <SelectTrigger id="direttore">
                      <SelectValue placeholder="Seleziona direttore" />
                    </SelectTrigger>
                    <SelectContent>
                      {direttori.map(dir => (
                        <SelectItem key={dir.id} value={dir.id}>
                          {dir.nome} {dir.cognome} {dir.qualifica ? `- ${dir.qualifica}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {direttori.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Nessun direttore disponibile. Contatta l'amministratore.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="supervisore">Supervisore *</Label>
                  <Select
                    value={formData.supervisore_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, supervisore_id: value })}
                  >
                    <SelectTrigger id="supervisore">
                      <SelectValue placeholder="Seleziona supervisore" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisori.map(sup => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.nome} {sup.cognome} {sup.qualifica ? `- ${sup.qualifica}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {supervisori.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Nessun supervisore disponibile. Contatta l'amministratore.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="resp_cert">Responsabile Certificazione (opzionale)</Label>
                  <Select
                    value={formData.responsabile_cert_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, responsabile_cert_id: value })}
                  >
                    <SelectTrigger id="resp_cert">
                      <SelectValue placeholder="Seleziona responsabile certificazione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuno</SelectItem>
                      {responsabiliCert.map(resp => (
                        <SelectItem key={resp.id} value={resp.id}>
                          {resp.nome} {resp.cognome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Preview Dati Estratti */}
          <AccordionItem value="preview" className="border rounded-lg px-6">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-lg font-semibold">👁️ Preview Dati Estratti</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">📚 Corso</h4>
                  <p><span className="text-muted-foreground">ID:</span> {formData.corso.id}</p>
                  <p><span className="text-muted-foreground">Titolo:</span> {formData.corso.titolo}</p>
                  <p><span className="text-muted-foreground">Tipo:</span> {formData.corso.tipo}</p>
                  <p><span className="text-muted-foreground">Date:</span> {formData.corso.data_inizio} - {formData.corso.data_fine}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">📖 Modulo</h4>
                  <p><span className="text-muted-foreground">ID:</span> {formData.modulo.id}</p>
                  <p><span className="text-muted-foreground">Titolo:</span> {formData.modulo.titolo}</p>
                  <p><span className="text-muted-foreground">Sessioni:</span> {formData.modulo.numero_sessioni}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">👥 Partecipanti</h4>
                  <p><span className="text-muted-foreground">Totale:</span> {formData.partecipanti_count}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.partecipanti.slice(0, 3).map(p => p.nome_completo).join(", ")}
                    {formData.partecipanti.length > 3 && "..."}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">📅 Sessioni</h4>
                  <p><span className="text-muted-foreground">Totale:</span> {formData.sessioni.length}</p>
                  <p><span className="text-muted-foreground">In presenza:</span> {formData.sessioni_presenza.length}</p>
                  <p><span className="text-muted-foreground">Pagine registro:</span> {formData.registro.numero_pagine}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Progress Indicator */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completamento Dati</span>
            <span className="text-sm font-bold text-primary">
              {formData.metadata.completamento_percentuale}%
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${formData.metadata.completamento_percentuale}%` }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSubmit}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            Conferma e Procedi alla Generazione
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
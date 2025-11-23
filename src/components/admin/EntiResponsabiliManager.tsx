import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Building2, Users } from "lucide-react";

interface EnteAccreditato {
  id: string;
  nome: string;
  via: string;
  numero_civico: string;
  comune: string;
  cap: string;
  provincia: string;
}

interface ResponsabileCorso {
  id: string;
  tipo: string;
  nome: string;
  cognome: string;
  qualifica?: string;
  data_nascita?: string;
  citta_nascita?: string;
  provincia_nascita?: string;
  citta_residenza?: string;
  via_residenza?: string;
  numero_civico_residenza?: string;
  documento_identita?: string;
  firma?: string;
}

export function EntiResponsabiliManager() {
  const [enti, setEnti] = useState<EnteAccreditato[]>([]);
  const [responsabili, setResponsabili] = useState<ResponsabileCorso[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entiRes, responsabiliRes] = await Promise.all([
        supabase.from("enti_accreditati").select("*").order("nome"),
        supabase.from("responsabili_corso").select("*").order("cognome")
      ]);

      if (entiRes.error) throw entiRes.error;
      if (responsabiliRes.error) throw responsabiliRes.error;

      setEnti(entiRes.data || []);
      setResponsabili(responsabiliRes.data || []);
    } catch (error: Error) {
      toast.error("Errore caricamento dati: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnte = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo ente?")) return;
    
    const { error } = await supabase.from("enti_accreditati").delete().eq("id", id);
    
    if (error) {
      toast.error("Errore eliminazione: " + error.message);
    } else {
      toast.success("Ente eliminato");
      loadData();
    }
  };

  const handleDeleteResponsabile = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo responsabile?")) return;
    
    const { error } = await supabase.from("responsabili_corso").delete().eq("id", id);
    
    if (error) {
      toast.error("Errore eliminazione: " + error.message);
    } else {
      toast.success("Responsabile eliminato");
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="enti" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enti">
            <Building2 className="w-4 h-4 mr-2" />
            Enti Accreditati
          </TabsTrigger>
          <TabsTrigger value="responsabili">
            <Users className="w-4 h-4 mr-2" />
            Responsabili Corso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enti" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Enti Accreditati</CardTitle>
              <CardDescription>
                Gestisci gli enti accreditati disponibili per i corsi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <EnteDialog onSave={loadData} />
              </div>
              
              {loading ? (
                <p>Caricamento...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Indirizzo</TableHead>
                      <TableHead>Comune</TableHead>
                      <TableHead>CAP</TableHead>
                      <TableHead>Provincia</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enti.map((ente) => (
                      <TableRow key={ente.id}>
                        <TableCell className="font-medium">{ente.nome}</TableCell>
                        <TableCell>{ente.via} {ente.numero_civico}</TableCell>
                        <TableCell>{ente.comune}</TableCell>
                        <TableCell>{ente.cap}</TableCell>
                        <TableCell>{ente.provincia}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <EnteDialog ente={ente} onSave={loadData} />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEnte(ente.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {enti.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nessun ente accreditato. Aggiungi il primo!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsabili" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Responsabili Corso</CardTitle>
              <CardDescription>
                Gestisci direttori, supervisori e responsabili certificazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <ResponsabileDialog onSave={loadData} />
              </div>
              
              {loading ? (
                <p>Caricamento...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>Qualifica</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responsabili.map((resp) => (
                      <TableRow key={resp.id}>
                        <TableCell className="capitalize">{resp.tipo.replace('_', ' ')}</TableCell>
                        <TableCell>{resp.nome}</TableCell>
                        <TableCell className="font-medium">{resp.cognome}</TableCell>
                        <TableCell>{resp.qualifica || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <ResponsabileDialog responsabile={resp} onSave={loadData} />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteResponsabile(resp.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {responsabili.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nessun responsabile. Aggiungi il primo!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EnteDialog({ ente, onSave }: { ente?: EnteAccreditato; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: ente?.nome || "",
    via: ente?.via || "",
    numero_civico: ente?.numero_civico || "",
    comune: ente?.comune || "",
    cap: ente?.cap || "",
    provincia: ente?.provincia || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = ente
      ? await supabase.from("enti_accreditati").update(formData).eq("id", ente.id)
      : await supabase.from("enti_accreditati").insert([formData]);

    if (error) {
      toast.error("Errore salvataggio: " + error.message);
    } else {
      toast.success(ente ? "Ente aggiornato" : "Ente creato");
      setOpen(false);
      onSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {ente ? (
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Ente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ente ? "Modifica" : "Nuovo"} Ente Accreditato</DialogTitle>
          <DialogDescription>
            Inserisci i dati dell'ente accreditato
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Ente</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label htmlFor="via">Via</Label>
              <Input
                id="via"
                value={formData.via}
                onChange={(e) => setFormData({ ...formData, via: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="numero_civico">N°</Label>
              <Input
                id="numero_civico"
                value={formData.numero_civico}
                onChange={(e) => setFormData({ ...formData, numero_civico: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label htmlFor="comune">Comune</Label>
              <Input
                id="comune"
                value={formData.comune}
                onChange={(e) => setFormData({ ...formData, comune: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="cap">CAP</Label>
              <Input
                id="cap"
                value={formData.cap}
                onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="provincia">Provincia</Label>
            <Input
              id="provincia"
              value={formData.provincia}
              onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
              required
              maxLength={2}
            />
          </div>
          <Button type="submit" className="w-full">
            {ente ? "Aggiorna" : "Crea"} Ente
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResponsabileDialog({ responsabile, onSave }: { responsabile?: ResponsabileCorso; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: responsabile?.tipo || "direttore",
    nome: responsabile?.nome || "",
    cognome: responsabile?.cognome || "",
    qualifica: responsabile?.qualifica || "",
    data_nascita: responsabile?.data_nascita || "",
    citta_nascita: responsabile?.citta_nascita || "",
    provincia_nascita: responsabile?.provincia_nascita || "",
    citta_residenza: responsabile?.citta_residenza || "",
    via_residenza: responsabile?.via_residenza || "",
    numero_civico_residenza: responsabile?.numero_civico_residenza || "",
    documento_identita: responsabile?.documento_identita || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = responsabile
      ? await supabase.from("responsabili_corso").update(formData).eq("id", responsabile.id)
      : await supabase.from("responsabili_corso").insert([formData]);

    if (error) {
      toast.error("Errore salvataggio: " + error.message);
    } else {
      toast.success(responsabile ? "Responsabile aggiornato" : "Responsabile creato");
      setOpen(false);
      onSave();
    }
  };

  const showExtendedFields = formData.tipo === "responsabile_cert";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {responsabile ? (
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Responsabile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{responsabile ? "Modifica" : "Nuovo"} Responsabile Corso</DialogTitle>
          <DialogDescription>
            Inserisci i dati del responsabile
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tipo">Tipo Responsabile</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direttore">Direttore</SelectItem>
                <SelectItem value="supervisore">Supervisore</SelectItem>
                <SelectItem value="responsabile_cert">Responsabile Certificazione</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="cognome">Cognome</Label>
              <Input
                id="cognome"
                value={formData.cognome}
                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                required
              />
            </div>
          </div>
          {(formData.tipo === "supervisore" || formData.tipo === "direttore") && (
            <div>
              <Label htmlFor="qualifica">Qualifica</Label>
              <Input
                id="qualifica"
                value={formData.qualifica}
                onChange={(e) => setFormData({ ...formData, qualifica: e.target.value })}
              />
            </div>
          )}
          
          {showExtendedFields && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="data_nascita">Data Nascita</Label>
                  <Input
                    id="data_nascita"
                    value={formData.data_nascita}
                    onChange={(e) => setFormData({ ...formData, data_nascita: e.target.value })}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div>
                  <Label htmlFor="citta_nascita">Città Nascita</Label>
                  <Input
                    id="citta_nascita"
                    value={formData.citta_nascita}
                    onChange={(e) => setFormData({ ...formData, citta_nascita: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="provincia_nascita">Prov.</Label>
                  <Input
                    id="provincia_nascita"
                    value={formData.provincia_nascita}
                    onChange={(e) => setFormData({ ...formData, provincia_nascita: e.target.value })}
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="citta_residenza">Città Residenza</Label>
                <Input
                  id="citta_residenza"
                  value={formData.citta_residenza}
                  onChange={(e) => setFormData({ ...formData, citta_residenza: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label htmlFor="via_residenza">Via</Label>
                  <Input
                    id="via_residenza"
                    value={formData.via_residenza}
                    onChange={(e) => setFormData({ ...formData, via_residenza: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="numero_civico_residenza">N°</Label>
                  <Input
                    id="numero_civico_residenza"
                    value={formData.numero_civico_residenza}
                    onChange={(e) => setFormData({ ...formData, numero_civico_residenza: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="documento_identita">Documento Identità</Label>
                <Input
                  id="documento_identita"
                  value={formData.documento_identita}
                  onChange={(e) => setFormData({ ...formData, documento_identita: e.target.value })}
                  placeholder="Es: Carta d'Identità n. 123456"
                />
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full">
            {responsabile ? "Aggiorna" : "Crea"} Responsabile
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Trash2, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Template {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_name: string;
  template_type: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

const templateTypes = [
  { value: "registro", label: "Registro Didattico" },
  { value: "verbale", label: "Verbale Partecipazione" },
  { value: "verbale_esame", label: "Verbale Scrutinio" },
  { value: "fad", label: "Modello FAD" },
];

const TemplateManager = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template_type: "",
    file: null as File | null,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error("Errore nel caricamento dei template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".docx")) {
        toast.error("Solo file .docx sono supportati");
        e.target.value = "";
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.name || !formData.template_type) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessione scaduta");
        return;
      }

      // Upload file to storage
      const fileExt = formData.file.name.split(".").pop();
      const fileName = `${formData.template_type}_${Date.now()}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("document-templates")
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from("document_templates")
        .insert({
          name: formData.name,
          description: formData.description || null,
          file_path: filePath,
          file_name: formData.file.name,
          template_type: formData.template_type,
          created_by: session.user.id,
        });

      if (dbError) throw dbError;

      toast.success("Template caricato con successo!");
      setFormData({ name: "", description: "", template_type: "", file: null });
      
      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      loadTemplates();
    } catch (error: any) {
      toast.error("Errore durante il caricamento");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const template = templates.find((t) => t.id === deleteId);
      if (!template) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("document-templates")
        .remove([template.file_path]);

      if (storageError) console.error("Storage delete error:", storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from("document_templates")
        .delete()
        .eq("id", deleteId);

      if (dbError) throw dbError;

      toast.success("Template eliminato");
      loadTemplates();
    } catch (error: any) {
      toast.error("Errore durante l'eliminazione");
      console.error(error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleDownload = async (template: Template) => {
    try {
      const { data, error } = await supabase.storage
        .from("document-templates")
        .download(template.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Errore durante il download");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Carica Nuovo Template
        </h3>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es: Registro 2025"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Tipo Template *</Label>
              <Select
                value={formData.template_type}
                onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Note aggiuntive sul template..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">File Template (.docx) *</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={uploading}
            className="w-full bg-gradient-to-r from-primary to-accent"
          >
            {uploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Carica Template
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Templates List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Template Disponibili
        </h3>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Caricamento...</p>
        ) : templates.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessun template disponibile. Carica il primo!
          </p>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {templateTypes.find((t) => t.value === template.template_type)?.label} - 
                      Versione {template.version}
                    </p>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      File: {template.file_name}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(template)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo template? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateManager;

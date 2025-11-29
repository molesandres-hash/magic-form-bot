/**
 * Document Generation Step
 * Final step where users can download all generated documents
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText, CheckCircle, ChevronLeft, Loader2, FileType } from "lucide-react";
import { toast } from "sonner";
import type { CourseData } from "@/types/courseData";
import {
  generateRegistroDidattico,
  generateVerbalePartecipazione,
  generateVerbaleScrutinio,
  generateModelloFAD,
  downloadWordDocument,
} from "@/services/wordDocumentGenerator";
import {
  generateParticipantsExcel,
  generateAttendanceExcel,
  generateCourseReportExcel,
} from "@/services/excelGenerator";
import { createCompleteZIPPackage, setGeneratePDF, isGeneratePDFEnabled } from "@/services/zipPackager";
import { generateAllFADRegistries } from "@/services/fadMultiFileGenerator";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Mail, Calendar } from "lucide-react";
import {
  getStudentTaxCodes,
  generateEmailData,
  generateICSContent
} from "@/utils/generationUtils";

interface GenerationStepProps {
  data: CourseData;
  onBack: () => void;
}

const GenerationStep = ({ data, onBack }: GenerationStepProps) => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isGeneratingZIP, setIsGeneratingZIP] = useState(false);
  const [includePDF, setIncludePDF] = useState(isGeneratePDFEnabled());

  // Determine which documents should be available
  const hasFADSessions = (data.sessioni || []).some((s) => s.is_fad);
  const shouldGenerateFAD = hasFADSessions || data.corso?.tipo?.toLowerCase().includes('fad');

  const documents = [
    {
      id: "registro",
      name: `Registro_Didattico_${data.corso?.id}.docx`,
      type: "Registro Didattico e Presenze",
      icon: "📋",
      generated: true,
      category: "word",
    },
    {
      id: "verbale",
      name: `Verbale_Partecipazione_${data.corso?.id}.docx`,
      type: "Verbale di Partecipazione",
      icon: "📄",
      generated: true,
      category: "word",
    },
    {
      id: "verbale_scrutinio",
      name: `Verbale_Scrutinio_${data.corso?.id}.docx`,
      type: "Verbale Scrutinio",
      icon: "📝",
      generated: true,
      category: "word",
    },
    {
      id: "fad_registries",
      name: `Registri_FAD/`,
      type: `Registri Presenze FAD (${(data.sessioni || []).filter(s => s.is_fad).length} giorni)`,
      icon: "📁",
      generated: shouldGenerateFAD,
      category: "folder",
      isFolder: true,
    },
    {
      id: "excel_partecipanti",
      name: `Partecipanti_${data.corso?.id}.xlsx`,
      type: "Elenco Partecipanti (Excel)",
      icon: "📊",
      generated: true,
      category: "excel",
    },
    {
      id: "excel_presenze",
      name: `Presenze_${data.corso?.id}.xlsx`,
      type: "Registro Presenze (Excel)",
      icon: "📅",
      generated: true,
      category: "excel",
    },
    {
      id: "excel_report",
      name: `Report_Completo_${data.corso?.id}.xlsx`,
      type: "Report Completo (Excel)",
      icon: "📈",
      generated: true,
      category: "excel",
    },
  ];

  /**
   * Handles individual document download
   */
  const handleDownload = async (docId: string) => {
    setIsGenerating(docId);

    try {
      switch (docId) {
        case "registro":
          {
            const blob = await generateRegistroDidattico(data);
            await downloadWordDocument(blob, documents.find((d) => d.id === docId)!.name);
            toast.success("Registro Didattico scaricato!");
          }
          break;

        case "verbale":
          {
            const blob = await generateVerbalePartecipazione(data);
            await downloadWordDocument(blob, documents.find((d) => d.id === docId)!.name);
            toast.success("Verbale di Partecipazione scaricato!");
          }
          break;

        case "verbale_scrutinio":
          {
            const blob = await generateVerbaleScrutinio(data);
            await downloadWordDocument(blob, documents.find((d) => d.id === docId)!.name);
            toast.success("Verbale Scrutinio scaricato!");
          }
          break;

        case "fad_registries":
          {
            toast.info("Generazione ZIP Registri FAD...", {
              description: "Creazione del pacchetto in corso"
            });

            try {
              // Generate all FAD registry files
              const fadFiles = await generateAllFADRegistries(data);

              // Create ZIP with FAD files
              const zip = new JSZip();
              const fadFolder = zip.folder("Registri_FAD");

              if (fadFolder) {
                fadFiles.forEach(({ filename, blob }) => {
                  fadFolder.file(filename, blob);
                });
              }

              // Generate and download ZIP
              const zipBlob = await zip.generateAsync({ type: "blob" });
              const zipFilename = `Registri_FAD_${data.corso?.id}_${new Date().toISOString().split('T')[0]}.zip`;
              saveAs(zipBlob, zipFilename);

              toast.success("Registri FAD scaricati!", {
                description: `${fadFiles.length} file inclusi nel ZIP`
              });
            } catch (error: any) {
              console.error("Error generating FAD ZIP:", error);
              toast.error("Errore durante la generazione", {
                description: error.message || "Riprova"
              });
            }
          }
          break;

        case "excel_partecipanti":
          generateParticipantsExcel(data);
          toast.success("Excel Partecipanti scaricato!");
          break;

        case "excel_presenze":
          generateAttendanceExcel(data);
          toast.success("Excel Presenze scaricato!");
          break;

        case "excel_report":
          generateCourseReportExcel(data);
          toast.success("Report Excel scaricato!");
          break;

        default:
          toast.error("Documento non trovato");
      }
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast.error("Errore durante il download", {
        description: error.message || "Riprova",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  /**
   * Handles downloading all documents as ZIP
   */
  const handleDownloadAll = async () => {
    setIsGeneratingZIP(true);

    try {
      // Set PDF generation preference before creating ZIP
      setGeneratePDF(includePDF);

      const formatInfo = includePDF ? "Word + PDF" : "Solo Word";
      toast.info("Generazione ZIP in corso...", {
        description: `Potrebbe richiedere alcuni secondi (${formatInfo})`,
      });

      await createCompleteZIPPackage(data);

      toast.success("ZIP scaricato con successo!", {
        description: includePDF
          ? "Tutti i documenti sono stati inclusi (Word + PDF)"
          : "Tutti i documenti Word sono stati inclusi",
      });
    } catch (error: any) {
      console.error("Error creating ZIP:", error);
      toast.error("Errore durante la creazione del ZIP", {
        description: error.message || "Riprova",
      });
    } finally {
      setIsGeneratingZIP(false);
    }
  };

  const taxCodes = getStudentTaxCodes(data);
  const emailData = generateEmailData(data);

  const handleCopyTaxCodes = () => {
    navigator.clipboard.writeText(taxCodes);
    toast.success("Codici fiscali copiati!");
  };

  const handleDownloadCalendar = () => {
    const icsContent = generateICSContent(data);
    if (!icsContent.includes("BEGIN:VEVENT")) {
      toast.warning("Nessuna data utile trovata per il calendario.");
      return;
    }
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, 'calendario_presenze.ics');
    toast.success("Evento calendario scaricato!");
  };

  const handleSendEmail = () => {
    const { to, bcc, subject, body } = emailData;
    const mailtoLink = `mailto:${to}?bcc=${bcc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleCopyEmailBody = () => {
    navigator.clipboard.writeText(emailData.body);
    toast.success("Testo email copiato!");
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
                  <h2 className="text-2xl font-bold text-foreground">Documenti Pronti!</h2>
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
                <div className="text-2xl font-bold text-primary">
                  {documents.filter((d) => d.generated).length}
                </div>
                <div className="text-xs text-muted-foreground">Documenti</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">✓</div>
                <div className="text-xs text-muted-foreground">Completato</div>
              </div>
            </div>
          </Card>

          {/* Word Documents Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground mb-4">📄 Documenti Word</h3>
            {documents
              .filter((doc) => doc.category === "word" && doc.generated)
              .map((doc) => (
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
                      disabled={isGenerating === doc.id}
                    >
                      {isGenerating === doc.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generazione...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Scarica
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
          </div>

          {/* Excel Documents Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground mb-4">📊 Fogli Excel</h3>
            {documents
              .filter((doc) => doc.category === "excel" && doc.generated)
              .map((doc) => (
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
                      disabled={isGenerating === doc.id}
                    >
                      {isGenerating === doc.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generazione...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Scarica
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
          </div>

          {/* Strumenti Utili Section */}
          <div className="space-y-6 pt-6 border-t">
            <h3 className="font-semibold text-foreground">🛠️ Strumenti Utili</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Codici Fiscali */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Codici Fiscali per Ricerca su 360</h4>
                  <Button variant="ghost" size="sm" onClick={handleCopyTaxCodes}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copia
                  </Button>
                </div>
                <Textarea
                  value={taxCodes}
                  readOnly
                  className="font-mono text-xs h-32 resize-none bg-muted"
                />
              </Card>

              {/* Azioni Rapide */}
              <div className="space-y-4">
                {/* Calendario */}
                <Card className="p-4">
                  <h4 className="font-medium text-sm mb-3">📅 Calendario</h4>
                  <Button variant="outline" className="w-full justify-start" onClick={handleDownloadCalendar}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Scarica Evento "Inserire Presenze"
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Scarica un evento .ics per l'ultimo giovedì del corso (10:15)
                  </p>
                </Card>

                {/* Email */}
                <Card className="p-4">
                  <h4 className="font-medium text-sm mb-3">📧 Comunicazione Docente</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={handleSendEmail}>
                      <Mail className="h-4 w-4 mr-2" />
                      Invia Email con Link Lezione
                    </Button>

                    <div className="pt-2 border-t mt-2">
                      <p className="text-xs font-medium mb-1">Template Messaggio:</p>
                      <div className="relative">
                        <Textarea
                          value={emailData.body}
                          readOnly
                          className="text-xs h-20 resize-none bg-muted pr-8"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={handleCopyEmailBody}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* PDF Format Option */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border mt-4">
            <div className="flex items-center gap-3">
              <FileType className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="pdf-toggle" className="text-sm font-medium cursor-pointer">
                  Includi versioni PDF
                </Label>
                <p className="text-xs text-muted-foreground">
                  Genera anche le versioni PDF di tutti i documenti Word
                </p>
              </div>
            </div>
            <Switch
              id="pdf-toggle"
              checked={includePDF}
              onCheckedChange={(checked) => {
                setIncludePDF(checked);
                setGeneratePDF(checked);
                toast.info(
                  checked
                    ? "PDF abilitati - saranno inclusi nello ZIP"
                    : "PDF disabilitati - solo documenti Word",
                  { duration: 2000 }
                );
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              onClick={handleDownloadAll}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={isGeneratingZIP}
            >
              {isGeneratingZIP ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creazione ZIP in corso...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Scarica Tutti i Documenti (ZIP)
                </>
              )}
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="flex-1 h-12">
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
          <p className="text-2xl font-bold text-accent">{documents.filter((d) => d.generated).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Generati automaticamente</p>
        </Card>
      </div>
    </div>
  );
};

export default GenerationStep;

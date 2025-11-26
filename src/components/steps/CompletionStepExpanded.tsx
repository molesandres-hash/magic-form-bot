/**
 * Completion Step Component
 *
 * Purpose: Allows users to review extracted data and select official entities/responsibles
 *
 * Clean Code Principles Applied:
 * - Separation of Concerns: Logic moved to useCompletionData hook
 * - Component Composition: UI split into smaller, reusable components
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { ChevronLeft, Save, AlertCircle, FileSpreadsheet } from "lucide-react";
import { useCompletionData } from "@/hooks/useCompletionData";
import { CompletionSelection } from "@/components/completion/CompletionSelection";
import { CompletionModules } from "@/components/completion/CompletionModules";
import { CompletionPreview } from "@/components/completion/CompletionPreview";
import { ParticipantReorder } from "@/components/completion/ParticipantReorder";
import { generateAttendanceRegister } from "@/services/excelGenerator";
import { toast } from "sonner";
import type { CourseData } from "@/types/courseData";

interface CompletionStepExpandedProps {
  extractedData: CourseData;
  onComplete: (data: CourseData) => void;
  onBack: () => void;
}

export default function CompletionStepExpanded({ extractedData, onComplete, onBack }: CompletionStepExpandedProps) {
  const {
    formData,
    enti,
    direttori,
    supervisori,
    responsabiliCert,
    loading,
    updateFormData,
    validateAndSubmit
  } = useCompletionData(extractedData, onComplete);

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

        <Accordion type="multiple" defaultValue={["selezione", "moduli", "preview"]} className="space-y-4">
          {/* Selezione Enti e Responsabili */}
          <CompletionSelection
            formData={formData}
            updateFormData={updateFormData}
            enti={enti}
            direttori={direttori}
            supervisori={supervisori}
            responsabiliCert={responsabiliCert}
          />

          {/* Ordinamento Partecipanti */}
          <ParticipantReorder
            participants={formData.partecipanti}
            onReorder={(newOrder) => updateFormData('partecipanti', newOrder)}
          />

          {/* Moduli del Corso */}
          <CompletionModules
            modules={formData.moduli}
            onUpdate={(updatedModules) => updateFormData({ moduli: updatedModules })}
          />

          {/* Preview Dati Estratti */}
          <CompletionPreview formData={formData} />
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
        <div className="mt-6 flex justify-between items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={async () => {
              try {
                await generateAttendanceRegister(formData);
                toast.success('Registro presenze esportato con successo!');
              } catch (error) {
                console.error('Export error:', error);
                toast.error('Errore durante l\'esportazione del registro');
              }
            }}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Esporta Registro Presenze (Excel)
          </Button>

          <Button
            onClick={validateAndSubmit}
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

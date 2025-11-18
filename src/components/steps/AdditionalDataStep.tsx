/**
 * Additional Data Step Component
 *
 * Purpose: Collects additional data not available in the gestionale
 * - Codice Fiscale Docente (teacher's tax code)
 * - Link Zoom (for online sessions)
 * - Any other manual inputs required for document generation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, Video, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const VALIDATION_PATTERNS = {
  CODICE_FISCALE: /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/,
  ZOOM_LINK: /^https?:\/\/.+/,
} as const;

const ERROR_MESSAGES = {
  INVALID_CF: 'Codice Fiscale non valido. Deve essere 16 caratteri (es: RSSMRA80A01H501Z)',
  INVALID_ZOOM: 'Link Zoom non valido. Deve iniziare con http:// o https://',
  EMPTY_CF: 'Inserisci il Codice Fiscale del docente',
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface AdditionalDataStepProps {
  onComplete: (data: AdditionalData) => void;
  onBack?: () => void;
  initialData?: Partial<AdditionalData>;
}

export interface AdditionalData {
  codiceFiscaleDocente: string;
  linkZoom?: string;
  note?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const AdditionalDataStep = ({
  onComplete,
  onBack,
  initialData,
}: AdditionalDataStepProps) => {
  const [codiceFiscaleDocente, setCodiceFiscaleDocente] = useState(
    initialData?.codiceFiscaleDocente || ''
  );
  const [linkZoom, setLinkZoom] = useState(initialData?.linkZoom || '');
  const [note, setNote] = useState(initialData?.note || '');

  /**
   * Validates Codice Fiscale format
   */
  const validateCodiceFiscale = (cf: string): boolean => {
    const cfUpper = cf.toUpperCase().trim();
    if (!VALIDATION_PATTERNS.CODICE_FISCALE.test(cfUpper)) {
      toast.error(ERROR_MESSAGES.INVALID_CF);
      return false;
    }
    return true;
  };

  /**
   * Validates Zoom link format (optional field)
   */
  const validateZoomLink = (link: string): boolean => {
    if (!link.trim()) return true; // Optional field

    if (!VALIDATION_PATTERNS.ZOOM_LINK.test(link.trim())) {
      toast.error(ERROR_MESSAGES.INVALID_ZOOM);
      return false;
    }
    return true;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = () => {
    // Validate required field
    if (!codiceFiscaleDocente.trim()) {
      toast.error(ERROR_MESSAGES.EMPTY_CF);
      return;
    }

    // Validate format
    if (!validateCodiceFiscale(codiceFiscaleDocente)) {
      return;
    }

    // Validate optional Zoom link
    if (!validateZoomLink(linkZoom)) {
      return;
    }

    // All validations passed
    const data: AdditionalData = {
      codiceFiscaleDocente: codiceFiscaleDocente.toUpperCase().trim(),
      linkZoom: linkZoom.trim() || undefined,
      note: note.trim() || undefined,
    };

    onComplete(data);
  };

  /**
   * Auto-formats Codice Fiscale to uppercase
   */
  const handleCFChange = (value: string) => {
    setCodiceFiscaleDocente(value.toUpperCase());
  };

  return (
    <Card className="p-8 shadow-xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Dati Aggiuntivi
          </h3>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Inserisci le informazioni che non possono essere estratte dal
            gestionale
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Codice Fiscale Docente - REQUIRED */}
          <div className="space-y-2">
            <Label htmlFor="codice-fiscale" className="text-base font-semibold">
              Codice Fiscale Docente *
            </Label>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Input
                id="codice-fiscale"
                value={codiceFiscaleDocente}
                onChange={(e) => handleCFChange(e.target.value)}
                placeholder="RSSMRA80A01H501Z"
                className="font-mono text-sm uppercase"
                maxLength={16}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Codice fiscale del docente/trainer che tiene il corso (16 caratteri)
            </p>
          </div>

          {/* Link Zoom - OPTIONAL */}
          <div className="space-y-2">
            <Label htmlFor="link-zoom" className="text-base font-semibold">
              Link Zoom (opzionale)
            </Label>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Input
                id="link-zoom"
                value={linkZoom}
                onChange={(e) => setLinkZoom(e.target.value)}
                placeholder="https://zoom.us/j/123456789"
                className="text-sm"
                type="url"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Link della sessione Zoom per le lezioni online (se applicabile)
            </p>
          </div>

          {/* Note - OPTIONAL */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-base font-semibold">
              Note Aggiuntive (opzionale)
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Eventuali note o informazioni aggiuntive..."
              className="text-sm min-h-[80px]"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="h-12"
            >
              Indietro
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            Continua
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Info Box */}
        <Card className="p-4 bg-accent/5 border-accent/20">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="text-accent font-bold text-sm">ℹ️</span>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground">
                Perché questi dati?
              </h4>
              <p className="text-xs text-muted-foreground">
                Il <strong>Codice Fiscale del Docente</strong> è richiesto per i registri
                ufficiali di formazione. Il <strong>Link Zoom</strong> può essere
                aggiunto ai documenti per le sessioni online. Questi dati non sono
                disponibili nel gestionale e devono essere inseriti manualmente.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default AdditionalDataStep;

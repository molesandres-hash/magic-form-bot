/**
 * Additional Data Step Component
 *
 * Purpose: Collects additional data not available in the gestionale
 * - Codice Fiscale Docente (teacher's tax code) - with predefined dropdown
 * - Link Zoom (for online sessions) - with platform dropdown
 * - Sede Accreditata (location) - with predefined dropdown
 * - Ente (entity) - with predefined dropdown
 * - Any other manual inputs required for document generation
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, Video, ChevronRight, MapPin, Building2, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getEnabledTrainers,
  getEnabledLocations,
  getEnabledEntities,
  getEnabledPlatforms,
  findTrainerById,
  findLocationById,
  findEntityById,
  validateCodiceFiscale as utilValidateCodiceFiscale,
} from '@/utils/predefinedDataUtils';

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
  EMPTY_LOCATION: 'Seleziona una sede accreditata',
  EMPTY_ENTITY: 'Seleziona un ente',
} as const;

const CUSTOM_OPTION_VALUE = '__CUSTOM__';

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
  nomeDocente?: string;
  cognomeDocente?: string;
  linkZoom?: string;
  piattaforma?: string;
  sedeAccreditata?: string;
  indirizzoSede?: string;
  nomeEnte?: string;
  indirizzoEnte?: string;
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
  // State for predefined data
  const [availableTrainers, setAvailableTrainers] = useState(getEnabledTrainers());
  const [availableLocations, setAvailableLocations] = useState(getEnabledLocations());
  const [availableEntities, setAvailableEntities] = useState(getEnabledEntities());
  const [availablePlatforms, setAvailablePlatforms] = useState(getEnabledPlatforms());

  // State for selections
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(CUSTOM_OPTION_VALUE);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(CUSTOM_OPTION_VALUE);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(CUSTOM_OPTION_VALUE);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  // State for manual inputs
  const [codiceFiscaleDocente, setCodiceFiscaleDocente] = useState(
    initialData?.codiceFiscaleDocente || ''
  );
  const [nomeDocente, setNomeDocente] = useState(initialData?.nomeDocente || '');
  const [cognomeDocente, setCognomeDocente] = useState(initialData?.cognomeDocente || '');
  const [linkZoom, setLinkZoom] = useState(initialData?.linkZoom || '');
  const [sedeAccreditata, setSedeAccreditata] = useState(initialData?.sedeAccreditata || '');
  const [indirizzoSede, setIndirizzoSede] = useState(initialData?.indirizzoSede || '');
  const [nomeEnte, setNomeEnte] = useState(initialData?.nomeEnte || '');
  const [indirizzoEnte, setIndirizzoEnte] = useState(initialData?.indirizzoEnte || '');
  const [note, setNote] = useState(initialData?.note || '');

  /**
   * Handles trainer selection from dropdown
   */
  const handleTrainerSelect = (value: string) => {
    setSelectedTrainerId(value);

    if (value !== CUSTOM_OPTION_VALUE) {
      const trainer = findTrainerById(value);
      if (trainer) {
        setCodiceFiscaleDocente(trainer.codiceFiscale);
        setNomeDocente(trainer.nome);
        setCognomeDocente(trainer.cognome);
      }
    } else {
      // Clear fields when "Custom" is selected
      setCodiceFiscaleDocente('');
      setNomeDocente('');
      setCognomeDocente('');
    }
  };

  /**
   * Handles location selection from dropdown
   */
  const handleLocationSelect = (value: string) => {
    setSelectedLocationId(value);

    if (value !== CUSTOM_OPTION_VALUE) {
      const location = findLocationById(value);
      if (location) {
        setSedeAccreditata(location.name);
        setIndirizzoSede(location.address);
      }
    } else {
      setSedeAccreditata('');
      setIndirizzoSede('');
    }
  };

  /**
   * Handles entity selection from dropdown
   */
  const handleEntitySelect = (value: string) => {
    setSelectedEntityId(value);

    if (value !== CUSTOM_OPTION_VALUE) {
      const entity = findEntityById(value);
      if (entity) {
        setNomeEnte(entity.name);
        setIndirizzoEnte(entity.address);
      }
    } else {
      setNomeEnte('');
      setIndirizzoEnte('');
    }
  };

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
    // Validate required fields
    if (!codiceFiscaleDocente.trim()) {
      toast.error(ERROR_MESSAGES.EMPTY_CF);
      return;
    }

    if (!validateCodiceFiscale(codiceFiscaleDocente)) {
      return;
    }

    if (!validateZoomLink(linkZoom)) {
      return;
    }

    // All validations passed
    const data: AdditionalData = {
      codiceFiscaleDocente: codiceFiscaleDocente.toUpperCase().trim(),
      nomeDocente: nomeDocente.trim() || undefined,
      cognomeDocente: cognomeDocente.trim() || undefined,
      linkZoom: linkZoom.trim() || undefined,
      piattaforma: (selectedPlatform && selectedPlatform !== 'NONE') ? selectedPlatform : undefined,
      sedeAccreditata: sedeAccreditata.trim() || undefined,
      indirizzoSede: indirizzoSede.trim() || undefined,
      nomeEnte: nomeEnte.trim() || undefined,
      indirizzoEnte: indirizzoEnte.trim() || undefined,
      note: note.trim() || undefined,
    };

    onComplete(data);
  };

  /**
   * Auto-formats Codice Fiscale to uppercase
   */
  const handleCFChange = (value: string) => {
    setCodiceFiscaleDocente(value.toUpperCase());
    // Reset trainer selection if manually editing
    if (selectedTrainerId !== CUSTOM_OPTION_VALUE) {
      setSelectedTrainerId(CUSTOM_OPTION_VALUE);
    }
  };

  const hasTrainers = availableTrainers.length > 0;
  const hasLocations = availableLocations.length > 0;
  const hasEntities = availableEntities.length > 0;
  const hasPlatforms = availablePlatforms.length > 0;

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
          {/* TRAINER/DOCENTE - with predefined dropdown */}
          <div className="space-y-3 p-4 border rounded-lg bg-accent/5">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Docente/Trainer *
              </Label>
              {hasTrainers && (
                <span className="text-xs text-muted-foreground">
                  {availableTrainers.length} predefiniti disponibili
                </span>
              )}
            </div>

            {hasTrainers && (
              <div className="space-y-2">
                <Label htmlFor="trainer-select" className="text-sm">Seleziona da predefiniti</Label>
                <Select value={selectedTrainerId} onValueChange={handleTrainerSelect}>
                  <SelectTrigger id="trainer-select">
                    <SelectValue placeholder="Scegli un trainer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CUSTOM_OPTION_VALUE}>
                      ✏️ Inserimento manuale
                    </SelectItem>
                    {availableTrainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.nome} {trainer.cognome} - {trainer.codiceFiscale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nome-docente" className="text-sm">Nome</Label>
                <Input
                  id="nome-docente"
                  value={nomeDocente}
                  onChange={(e) => setNomeDocente(e.target.value)}
                  placeholder="Mario"
                  disabled={selectedTrainerId !== CUSTOM_OPTION_VALUE && hasTrainers}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognome-docente" className="text-sm">Cognome</Label>
                <Input
                  id="cognome-docente"
                  value={cognomeDocente}
                  onChange={(e) => setCognomeDocente(e.target.value)}
                  placeholder="Rossi"
                  disabled={selectedTrainerId !== CUSTOM_OPTION_VALUE && hasTrainers}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codice-fiscale" className="text-sm font-semibold">
                Codice Fiscale *
              </Label>
              <Input
                id="codice-fiscale"
                value={codiceFiscaleDocente}
                onChange={(e) => handleCFChange(e.target.value)}
                placeholder="RSSMRA80A01H501Z"
                className="font-mono text-sm uppercase"
                maxLength={16}
                required
                disabled={selectedTrainerId !== CUSTOM_OPTION_VALUE && hasTrainers}
              />
              <p className="text-xs text-muted-foreground">
                Codice fiscale del docente/trainer (16 caratteri)
              </p>
            </div>
          </div>

          {/* SEDE ACCREDITATA - with predefined dropdown */}
          <div className="space-y-3 p-4 border rounded-lg bg-accent/5">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Sede Accreditata (opzionale)
              </Label>
              {hasLocations && (
                <span className="text-xs text-muted-foreground">
                  {availableLocations.length} sedi disponibili
                </span>
              )}
            </div>

            {hasLocations && (
              <div className="space-y-2">
                <Label htmlFor="location-select" className="text-sm">Seleziona sede</Label>
                <Select value={selectedLocationId} onValueChange={handleLocationSelect}>
                  <SelectTrigger id="location-select">
                    <SelectValue placeholder="Scegli una sede..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CUSTOM_OPTION_VALUE}>
                      ✏️ Inserimento manuale
                    </SelectItem>
                    {availableLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sede-nome" className="text-sm">Nome Sede</Label>
              <Input
                id="sede-nome"
                value={sedeAccreditata}
                onChange={(e) => setSedeAccreditata(e.target.value)}
                placeholder="Sede Milano"
                disabled={selectedLocationId !== CUSTOM_OPTION_VALUE && hasLocations}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sede-indirizzo" className="text-sm">Indirizzo</Label>
              <Input
                id="sede-indirizzo"
                value={indirizzoSede}
                onChange={(e) => setIndirizzoSede(e.target.value)}
                placeholder="Via Roma 1, Milano"
                disabled={selectedLocationId !== CUSTOM_OPTION_VALUE && hasLocations}
              />
            </div>
          </div>

          {/* ENTE - with predefined dropdown */}
          <div className="space-y-3 p-4 border rounded-lg bg-accent/5">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Ente (opzionale)
              </Label>
              {hasEntities && (
                <span className="text-xs text-muted-foreground">
                  {availableEntities.length} enti disponibili
                </span>
              )}
            </div>

            {hasEntities && (
              <div className="space-y-2">
                <Label htmlFor="entity-select" className="text-sm">Seleziona ente</Label>
                <Select value={selectedEntityId} onValueChange={handleEntitySelect}>
                  <SelectTrigger id="entity-select">
                    <SelectValue placeholder="Scegli un ente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CUSTOM_OPTION_VALUE}>
                      ✏️ Inserimento manuale
                    </SelectItem>
                    {availableEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name} - {entity.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ente-nome" className="text-sm">Nome Ente</Label>
              <Input
                id="ente-nome"
                value={nomeEnte}
                onChange={(e) => setNomeEnte(e.target.value)}
                placeholder="AK GROUP SRL"
                disabled={selectedEntityId !== CUSTOM_OPTION_VALUE && hasEntities}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ente-indirizzo" className="text-sm">Indirizzo</Label>
              <Input
                id="ente-indirizzo"
                value={indirizzoEnte}
                onChange={(e) => setIndirizzoEnte(e.target.value)}
                placeholder="Via Milano 2, Roma"
                disabled={selectedEntityId !== CUSTOM_OPTION_VALUE && hasEntities}
              />
            </div>
          </div>

          {/* PIATTAFORMA FAD + LINK ZOOM */}
          <div className="space-y-3 p-4 border rounded-lg bg-accent/5">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              Piattaforma FAD (opzionale)
            </Label>

            {hasPlatforms && (
              <div className="space-y-2">
                <Label htmlFor="platform-select" className="text-sm">Piattaforma</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger id="platform-select">
                    <SelectValue placeholder="Seleziona piattaforma..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Nessuna</SelectItem>
                    {availablePlatforms.map((platform) => (
                      <SelectItem key={platform.id} value={platform.name}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="link-zoom" className="text-sm">Link Sessione Online</Label>
              <Input
                id="link-zoom"
                value={linkZoom}
                onChange={(e) => setLinkZoom(e.target.value)}
                placeholder="https://zoom.us/j/123456789"
                className="text-sm"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Link della sessione (Zoom, Teams, Google Meet, ecc.)
              </p>
            </div>
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
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <SettingsIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground">
                💡 Suggerimento
              </h4>
              <p className="text-xs text-muted-foreground">
                Configura i dati predefiniti nelle <strong>Impostazioni</strong> per avere
                un accesso rapido a trainer, sedi ed enti ricorrenti. Questo velocizzerà
                il processo di compilazione!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default AdditionalDataStep;

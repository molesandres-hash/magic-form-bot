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

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, Video, ChevronRight, MapPin, Settings as SettingsIcon } from 'lucide-react';
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
  getEnabledPlatforms,
  findTrainerById,
  findLocationById,
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
const MATCH_THRESHOLD = 0.55;
const TRAINER_NAME_THRESHOLD = 0.6;

const normalizeText = (value?: string) => {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const similarityScore = (a?: string, b?: string) => {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const tokensA = new Set(normA.split(' '));
  const tokensB = new Set(normB.split(' '));
  let common = 0;
  tokensA.forEach(token => {
    if (tokensB.has(token)) {
      common += 1;
    }
  });

  return common / Math.max(tokensA.size, tokensB.size);
};

type MatchResult<T> = { item: T; score: number } | null;

const findBestMatch = <T,>(
  items: T[],
  targets: Array<string | undefined>,
  toStrings: (item: T) => string[],
  minScore = MATCH_THRESHOLD
): MatchResult<T> => {
  const validTargets = targets.filter(Boolean) as string[];
  if (!validTargets.length) return null;

  let best: MatchResult<T> = null;

  items.forEach(item => {
    const parts = toStrings(item).filter(Boolean);
    if (!parts.length) return;

    const score = Math.max(
      ...parts.map(part => Math.max(...validTargets.map(target => similarityScore(part, target))))
    );

    if (!best || score > best.score) {
      best = { item, score };
    }
  });

  if (best && best.score >= minScore) {
    return best;
  }

  return null;
};

const normalizeCodiceFiscale = (cf?: string) => (cf || '').toUpperCase().replace(/\s+/g, '');

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
  idRiunione?: string;
  passcode?: string;
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
  const [availableTrainers] = useState(getEnabledTrainers());
  const [availableLocations] = useState(getEnabledLocations());
  const [availablePlatforms] = useState(getEnabledPlatforms());

  // State for selections
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(CUSTOM_OPTION_VALUE);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(CUSTOM_OPTION_VALUE);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialData?.piattaforma || '');

  // State for manual inputs
  const [codiceFiscaleDocente, setCodiceFiscaleDocente] = useState(
    initialData?.codiceFiscaleDocente || ''
  );
  const [nomeDocente, setNomeDocente] = useState(initialData?.nomeDocente || '');
  const [cognomeDocente, setCognomeDocente] = useState(initialData?.cognomeDocente || '');
  const [linkZoom, setLinkZoom] = useState(initialData?.linkZoom || '');
  const [idRiunione, setIdRiunione] = useState(initialData?.idRiunione || '');
  const [passcode, setPasscode] = useState(initialData?.passcode || '');
  const [sedeAccreditata, setSedeAccreditata] = useState(initialData?.sedeAccreditata || '');
  const [indirizzoSede, setIndirizzoSede] = useState(initialData?.indirizzoSede || '');
  const [nomeEnte] = useState(initialData?.nomeEnte || '');
  const [indirizzoEnte] = useState(initialData?.indirizzoEnte || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [autoMatchApplied, setAutoMatchApplied] = useState(false);

  const initialSignature = useMemo(
    () => JSON.stringify({
      trainer: `${initialData?.codiceFiscaleDocente || ''}|${initialData?.nomeDocente || ''}|${initialData?.cognomeDocente || ''}`,
      location: `${initialData?.sedeAccreditata || ''}|${initialData?.indirizzoSede || ''}`,
      entity: `${initialData?.nomeEnte || ''}|${initialData?.indirizzoEnte || ''}`,
      platform: initialData?.piattaforma || '',
    }),
    [initialData]
  );

  // Reset auto-match guard when new extracted data arrives
  useEffect(() => {
    setAutoMatchApplied(false);
  }, [initialSignature]);

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
      idRiunione: idRiunione.trim() || undefined,
      passcode: passcode.trim() || undefined,
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

  // Auto-select predefined options using the closest match from extracted data
  useEffect(() => {
    if (autoMatchApplied || !initialData) return;

    const trainerMatch =
      availableTrainers.find(
        (trainer) => normalizeCodiceFiscale(trainer.codiceFiscale) === normalizeCodiceFiscale(initialData.codiceFiscaleDocente)
      ) ||
      findBestMatch(
        availableTrainers,
        [
          `${initialData.nomeDocente || ''} ${initialData.cognomeDocente || ''}`,
          initialData.codiceFiscaleDocente
        ],
        (trainer) => [
          `${trainer.nome || ''} ${trainer.cognome || ''}`,
          trainer.nomeCompleto || '',
          trainer.codiceFiscale || ''
        ],
        TRAINER_NAME_THRESHOLD
      )?.item;

    if (trainerMatch) {
      handleTrainerSelect(trainerMatch.id);
    }

    const locationMatch = findBestMatch(
      availableLocations,
      [initialData.sedeAccreditata, initialData.indirizzoSede],
      (location) => [location.name, location.address]
    );

    if (locationMatch) {
      handleLocationSelect(locationMatch.item.id);
    }

    const platformMatch = findBestMatch(
      availablePlatforms,
      [initialData.piattaforma],
      (platform) => [platform.name],
      0.5
    );

    if (platformMatch) {
      setSelectedPlatform(platformMatch.item.name);
    } else if (initialData.piattaforma && !selectedPlatform) {
      setSelectedPlatform(initialData.piattaforma);
    }

    setAutoMatchApplied(true);
  }, [
    availableLocations,
    availablePlatforms,
    availableTrainers,
    autoMatchApplied,
    handleLocationSelect,
    handleTrainerSelect,
    initialData,
    selectedPlatform
  ]);

  const hasTrainers = availableTrainers.length > 0;
  const hasLocations = availableLocations.length > 0;
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
                Direttore del Corso / Docente *
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
            <p className="text-xs text-muted-foreground">
              Il docente indicato verrà usato come riferimento per il direttore del corso.
            </p>

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
                Codice fiscale del docente/direttore (16 caratteri)
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

          <p className="text-xs text-muted-foreground italic px-1">
            La scelta dell&apos;ente accreditato avverrà nel prossimo step di completamento dati.
          </p>

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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="id-riunione" className="text-sm">ID Riunione</Label>
                <Input
                  id="id-riunione"
                  value={idRiunione}
                  onChange={(e) => setIdRiunione(e.target.value)}
                  placeholder="123 456 7890"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passcode" className="text-sm">Passcode</Label>
                <Input
                  id="passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="123456"
                  className="text-sm"
                />
              </div>
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

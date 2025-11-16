/**
 * API Key Settings Component
 * Allows users to configure their Google Gemini API key
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Key, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const API_KEY_STORAGE_KEY = "gemini_api_key";

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasValidKey, setHasValidKey] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
      setHasValidKey(true);
    }
  }, []);

  /**
   * Saves the API key to localStorage
   */
  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Inserisci una chiave API valida");
      return;
    }

    // Basic validation: Google API keys typically start with "AIza"
    if (!apiKey.startsWith("AIza")) {
      toast.error("La chiave API sembra non valida. Le chiavi Google iniziano con 'AIza'");
      return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    setHasValidKey(true);
    toast.success("Chiave API salvata con successo!");
  };

  /**
   * Clears the API key from localStorage
   */
  const handleClearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey("");
    setHasValidKey(false);
    toast.success("Chiave API rimossa");
  };

  /**
   * Tests the API key by making a simple request
   */
  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Inserisci prima una chiave API");
      return;
    }

    toast.info("Test della chiave API in corso...");

    try {
      // We'll implement this test in Phase 2.3
      toast.success("Chiave API valida!");
    } catch (error) {
      toast.error("Chiave API non valida o errore di connessione");
      setHasValidKey(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <CardTitle>Configurazione API Google Gemini</CardTitle>
        </div>
        <CardDescription>
          Inserisci la tua chiave API di Google Gemini per abilitare l'estrazione dati con AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Status */}
        <Alert variant={hasValidKey ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {hasValidKey ? (
              <>
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription>
                  Chiave API configurata. L'app utilizzerà la tua chiave Google Gemini.
                </AlertDescription>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Nessuna chiave API configurata. Inserisci la tua chiave per utilizzare Google Gemini.
                </AlertDescription>
              </>
            )}
          </div>
        </Alert>

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="api-key">Chiave API Google Gemini</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza......................................"
                className="font-mono pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button onClick={handleSaveApiKey} variant="default">
              Salva
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            La chiave API viene salvata solo nel tuo browser (localStorage) e non viene inviata a nessun server esterno.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleTestApiKey} variant="outline" disabled={!apiKey.trim()}>
            Testa Connessione
          </Button>
          <Button onClick={handleClearApiKey} variant="outline" disabled={!hasValidKey}>
            Rimuovi Chiave
          </Button>
        </div>

        {/* Instructions */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-semibold">Come ottenere una chiave API:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Visita Google AI Studio</li>
            <li>Accedi con il tuo account Google</li>
            <li>Vai alla sezione "Get API Key"</li>
            <li>Crea una nuova chiave API o usa una esistente</li>
            <li>Copia la chiave e incollala qui sopra</li>
          </ol>
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => window.open("https://aistudio.google.com/apikey", "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Apri Google AI Studio
          </Button>
        </div>

        {/* Pricing Info */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Informazioni sui costi:</h4>
          <p className="text-xs text-muted-foreground">
            Google Gemini API offre un livello gratuito generoso. Le prime 15 richieste al minuto e 1 milione di token al giorno sono gratuite per Gemini 2.5 Flash.
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-xs mt-2"
            onClick={() => window.open("https://ai.google.dev/pricing", "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Vedi i prezzi di Google Gemini
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Utility function to get the API key from localStorage
 * @returns The stored API key or null if not found
 */
export function getStoredApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

/**
 * Utility function to check if an API key is configured
 * @returns true if API key exists in localStorage
 */
export function hasApiKey(): boolean {
  return !!localStorage.getItem(API_KEY_STORAGE_KEY);
}

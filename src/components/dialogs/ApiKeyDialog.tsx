/**
 * API Key Dialog Component
 * Modal dialog that prompts users to configure their Google Gemini API key
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ApiKeySettings from "@/components/settings/ApiKeySettings";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurazione Richiesta</DialogTitle>
          <DialogDescription>
            Per utilizzare l'estrazione dati con Google Gemini AI, devi configurare la tua chiave API.
          </DialogDescription>
        </DialogHeader>
        <ApiKeySettings />
      </DialogContent>
    </Dialog>
  );
}

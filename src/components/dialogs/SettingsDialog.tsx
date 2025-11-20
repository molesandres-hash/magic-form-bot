/**
 * Settings Dialog Component
 * Centralized settings menu with multiple tabs for managing all application settings
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Key, FolderOpen, FileText, Building2, Variable } from "lucide-react";
import ApiKeySettings from "@/components/settings/ApiKeySettings";
import FolderStructureSettings from "@/components/settings/FolderStructureSettings";
import PlaceholderSettings from "@/components/settings/PlaceholderSettings";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

export default function SettingsDialog({ open, onOpenChange, defaultTab = "general" }: SettingsDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const handleNavigateToAdmin = () => {
    onOpenChange(false);
    navigate("/admin");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <DialogTitle>Impostazioni</DialogTitle>
          </div>
          <DialogDescription>
            Gestisci tutte le configurazioni dell'applicazione
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Generali</span>
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Cartelle</span>
            </TabsTrigger>
            <TabsTrigger value="placeholders" className="flex items-center gap-2">
              <Variable className="h-4 w-4" />
              <span className="hidden sm:inline">Placeholder</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2" disabled={!isAdmin && !user}>
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Template & Enti</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <TabsContent value="general" className="mt-0">
              <div className="space-y-6">
                <ApiKeySettings />
              </div>
            </TabsContent>

            <TabsContent value="folders" className="mt-0">
              <FolderStructureSettings />
            </TabsContent>

            <TabsContent value="placeholders" className="mt-0">
              <PlaceholderSettings />
            </TabsContent>

            <TabsContent value="admin" className="mt-0">
              <div className="space-y-6">
                {isAdmin ? (
                  <div className="text-center py-12 space-y-4">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Gestione Template ed Enti
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Per gestire i template dei documenti e gli enti accreditati,
                        accedi al pannello amministrativo completo.
                      </p>
                      <Button onClick={handleNavigateToAdmin} size="lg" className="bg-gradient-to-r from-primary to-accent">
                        <Building2 className="mr-2 h-5 w-5" />
                        Apri Pannello Admin
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Accesso Limitato
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        La gestione di template ed enti è disponibile solo per gli amministratori.
                        {!user && " Effettua il login per verificare i tuoi permessi."}
                      </p>
                      {!user && (
                        <Button
                          onClick={() => {
                            onOpenChange(false);
                            navigate("/auth");
                          }}
                          variant="outline"
                          className="mt-4"
                        >
                          Vai al Login
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

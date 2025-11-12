import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Settings, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import TemplateManager from "@/components/admin/TemplateManager";
import { EntiResponsabiliManager } from "@/components/admin/EntiResponsabiliManager";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Devi effettuare il login");
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || "");

      // Check if user has admin role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking admin role:", error);
        toast.error("Errore nel verificare i permessi");
        navigate("/");
        return;
      }

      if (!roleData) {
        toast.error("Non hai i permessi per accedere a questa sezione");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error in checkAdminAccess:", error);
      toast.error("Errore durante la verifica dei permessi");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Verifica permessi...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Area Amministrazione</h1>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                <FileText className="mr-2 h-4 w-4" />
                Torna all'App
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Area Amministrazione</h2>
                <p className="text-muted-foreground">
                  Gestisci template, enti accreditati e responsabili dei corsi
                </p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">
                <FileText className="w-4 h-4 mr-2" />
                Template Documenti
              </TabsTrigger>
              <TabsTrigger value="enti">
                <Settings className="w-4 h-4 mr-2" />
                Enti e Responsabili
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="mt-6">
              <TemplateManager />
            </TabsContent>
            
            <TabsContent value="enti" className="mt-6">
              <EntiResponsabiliManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;

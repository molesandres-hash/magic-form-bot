-- Crea tabella per enti accreditati
CREATE TABLE public.enti_accreditati (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  via TEXT NOT NULL,
  numero_civico TEXT NOT NULL,
  comune TEXT NOT NULL,
  cap TEXT NOT NULL,
  provincia TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crea tabella per responsabili corso (direttori, supervisori, responsabili certificazione)
CREATE TABLE public.responsabili_corso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo app_role NOT NULL CHECK (tipo::text IN ('direttore', 'supervisore', 'responsabile_cert')),
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  qualifica TEXT,
  -- Campi specifici per responsabile_cert
  data_nascita TEXT,
  citta_nascita TEXT,
  provincia_nascita TEXT,
  citta_residenza TEXT,
  via_residenza TEXT,
  numero_civico_residenza TEXT,
  documento_identita TEXT,
  firma TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Abilita RLS
ALTER TABLE public.enti_accreditati ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsabili_corso ENABLE ROW LEVEL SECURITY;

-- Policies per enti_accreditati: solo admin possono gestire, tutti autenticati possono leggere
CREATE POLICY "Admin can manage enti" 
ON public.enti_accreditati 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view enti" 
ON public.enti_accreditati 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Policies per responsabili_corso: solo admin possono gestire, tutti autenticati possono leggere
CREATE POLICY "Admin can manage responsabili" 
ON public.responsabili_corso 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view responsabili" 
ON public.responsabili_corso 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_enti_accreditati_updated_at
BEFORE UPDATE ON public.enti_accreditati
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_responsabili_corso_updated_at
BEFORE UPDATE ON public.responsabili_corso
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
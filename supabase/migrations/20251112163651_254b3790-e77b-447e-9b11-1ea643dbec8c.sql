-- Fix tipo column in responsabili_corso
ALTER TABLE public.responsabili_corso 
DROP CONSTRAINT IF EXISTS responsabili_corso_tipo_check;

ALTER TABLE public.responsabili_corso 
ALTER COLUMN tipo TYPE TEXT;

ALTER TABLE public.responsabili_corso 
ADD CONSTRAINT responsabili_corso_tipo_check 
CHECK (tipo IN ('direttore', 'supervisore', 'responsabile_cert'));
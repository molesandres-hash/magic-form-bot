-- Migration: Add Template Configurations
-- Purpose: Stores template configurations with variable definitions
-- This allows users to define what variables should be extracted by AI

-- ============================================================================
-- Table: template_configurations
-- ============================================================================

create table if not exists public.template_configurations (
  -- Primary key
  id uuid primary key default gen_random_uuid(),

  -- Reference to document template
  template_id uuid references public.document_templates(id) on delete cascade,

  -- Template configuration
  config_name text not null,
  config_description text,
  template_type text not null,
  format text not null check (format in ('docx', 'xlsx', 'pdf')),

  -- Variable definitions (JSON)
  variables jsonb not null default '[]'::jsonb,

  -- Custom AI prompt instructions
  custom_prompt_instructions text,

  -- Post-processing rules (JSON)
  post_processing jsonb,

  -- Metadata
  version text not null default '1.0.0',
  is_active boolean default true,
  is_system_template boolean default false, -- Prevents deletion of system templates

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),

  -- Indexes
  constraint unique_template_config_name unique (config_name)
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_template_configurations_template_id
  on public.template_configurations(template_id);

create index idx_template_configurations_template_type
  on public.template_configurations(template_type);

create index idx_template_configurations_is_active
  on public.template_configurations(is_active);

-- ============================================================================
-- RLS Policies
-- ============================================================================

alter table public.template_configurations enable row level security;

-- Users can view all active template configurations
create policy "Users can view active template configurations"
  on public.template_configurations
  for select
  using (is_active = true);

-- Authenticated users can create template configurations
create policy "Authenticated users can create template configurations"
  on public.template_configurations
  for insert
  with check (auth.role() = 'authenticated');

-- Users can update their own template configurations (not system templates)
create policy "Users can update their own template configurations"
  on public.template_configurations
  for update
  using (
    created_by = auth.uid()
    and is_system_template = false
  );

-- Users can delete their own template configurations (not system templates)
create policy "Users can delete their own template configurations"
  on public.template_configurations
  for delete
  using (
    created_by = auth.uid()
    and is_system_template = false
  );

-- ============================================================================
-- Updated_at Trigger
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_template_configurations_updated_at
  before update on public.template_configurations
  for each row
  execute function public.handle_updated_at();

-- ============================================================================
-- Seed Data: Predefined Template Configuration
-- ============================================================================

-- Insert default template configuration for "Registro Ore"
insert into public.template_configurations (
  config_name,
  config_description,
  template_type,
  format,
  variables,
  custom_prompt_instructions,
  post_processing,
  is_system_template,
  version
) values (
  'Registro Ore Lezione',
  'Registro con dettaglio orario delle lezioni (con pausa pranzo 13:00-14:00)',
  'registro_didattico',
  'xlsx',
  '[
    {
      "name": "ID_SEZIONE",
      "label": "ID Sezione",
      "description": "Identificativo della sezione del corso",
      "type": "string",
      "required": true,
      "extractionHint": "Cerca \"ID Sezione\", \"Sezione:\", \"ID:\" nei dati dei moduli"
    },
    {
      "name": "CODICE_FISCALE_DOCENTE",
      "label": "Codice Fiscale Docente",
      "description": "Codice fiscale del docente/trainer",
      "type": "string",
      "required": true,
      "validationPattern": "^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$",
      "extractionHint": "Codice fiscale del trainer/docente che tiene il corso"
    },
    {
      "name": "MATERIA",
      "label": "Materia",
      "description": "Nome della materia/corso",
      "type": "string",
      "required": true,
      "extractionHint": "Titolo o nome del corso/materia"
    },
    {
      "name": "SESSIONI",
      "label": "Sessioni",
      "description": "Array di sessioni con data, orari e luogo",
      "type": "array",
      "required": true,
      "extractionHint": "Estrai TUTTE le sessioni con: data (DD/MM/YYYY), ora_inizio (HH:MM), ora_fine (HH:MM), luogo/sede",
      "arrayItemStructure": {
        "data": {
          "name": "data",
          "label": "Data",
          "description": "Data della sessione",
          "type": "date",
          "required": true
        },
        "ora_inizio": {
          "name": "ora_inizio",
          "label": "Ora Inizio",
          "description": "Ora di inizio (HH:MM)",
          "type": "string",
          "required": true
        },
        "ora_fine": {
          "name": "ora_fine",
          "label": "Ora Fine",
          "description": "Ora di fine (HH:MM)",
          "type": "string",
          "required": true
        },
        "luogo": {
          "name": "luogo",
          "label": "Luogo",
          "description": "Sede o luogo della lezione",
          "type": "string",
          "required": true
        }
      }
    }
  ]'::jsonb,
  'IMPORTANTE: Determina TIPOLOGIA basandoti sul luogo:
- Se il luogo contiene "office", "ufficio", "presenza" → TIPOLOGIA=1, SVOLGIMENTO=1
- Se il luogo contiene "online", "FAD", "remoto" → TIPOLOGIA=4, SVOLGIMENTO=""

IMPORTANTE: Dividi ogni sessione in blocchi orari:
- Ogni blocco è di 1 ora
- SALTA il blocco 13:00-14:00 (pausa pranzo)
- Esempio: 09:00-17:00 diventa 7 blocchi (non 8)',
  '{
    "skipLunchBreak": true,
    "splitIntoHourlyBlocks": true,
    "excelColumns": [
      {"header": "ID_SEZIONE", "variableName": "ID_SEZIONE", "width": 15, "format": "text"},
      {"header": "DATA LEZIONE", "variableName": "DATA", "width": 12, "format": "text"},
      {"header": "TOTALE_ORE", "variableName": "DURATA", "width": 10, "format": "text"},
      {"header": "ORA_INIZIO", "variableName": "ORA_INIZIO", "width": 10, "format": "text"},
      {"header": "ORA_FINE", "variableName": "ORA_FINE", "width": 10, "format": "text"},
      {"header": "TIPOLOGIA", "variableName": "TIPOLOGIA", "width": 10, "format": "text"},
      {"header": "CODICE FISCALE DOCENTE", "variableName": "CODICE_FISCALE_DOCENTE", "width": 20, "format": "text"},
      {"header": "MATERIA", "variableName": "MATERIA", "width": 30, "format": "text"},
      {"header": "CONTENUTI MATERIA", "variableName": "MATERIA", "width": 30, "format": "text"},
      {"header": "SVOLGIMENTO SEDE LEZIONE", "variableName": "SVOLGIMENTO", "width": 25, "format": "text"}
    ]
  }'::jsonb,
  true,
  '1.0.0'
);

-- ============================================================================
-- Comments
-- ============================================================================

comment on table public.template_configurations is
  'Stores template configurations with variable definitions for AI extraction';

comment on column public.template_configurations.variables is
  'JSON array of variable definitions (name, type, required, extraction hints)';

comment on column public.template_configurations.post_processing is
  'JSON object with post-processing rules (Excel columns, Word formatting, etc.)';

comment on column public.template_configurations.is_system_template is
  'System templates cannot be deleted by users';

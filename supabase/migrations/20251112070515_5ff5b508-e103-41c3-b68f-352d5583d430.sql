-- Update template categories to support new specific types
-- Since template_type is already TEXT, we just need to add a check constraint

-- First, drop any existing constraint if it exists
ALTER TABLE document_templates DROP CONSTRAINT IF EXISTS valid_template_type;

-- Add new check constraint with all supported template types
ALTER TABLE document_templates 
ADD CONSTRAINT valid_template_type 
CHECK (template_type IN (
  'registro_didattico',
  'modulo_a_fad',
  'modulo_b_calendario',
  'verbale_partecipazione',
  'verbale_scrutinio',
  'attestato',
  'altro'
));

-- Update existing templates to new category names if any exist
UPDATE document_templates 
SET template_type = 'registro_didattico' 
WHERE template_type = 'registro';

UPDATE document_templates 
SET template_type = 'verbale_partecipazione' 
WHERE template_type = 'verbale';

COMMENT ON COLUMN document_templates.template_type IS 'Tipo di template: registro_didattico, modulo_a_fad, modulo_b_calendario, verbale_partecipazione, verbale_scrutinio, attestato, altro';
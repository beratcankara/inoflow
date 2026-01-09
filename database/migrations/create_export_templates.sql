-- Excel Template System Migration
-- Creates export_templates table for managing custom Excel export templates

-- Create export_templates table
CREATE TABLE IF NOT EXISTS export_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_default BOOLEAN DEFAULT FALSE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    CONSTRAINT unique_template_name UNIQUE (name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_export_templates_created_by ON export_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_export_templates_default ON export_templates(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_export_templates_created_at ON export_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_templates_config ON export_templates USING gin(config);

-- Function to ensure only one default template
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE export_templates 
        SET is_default = FALSE 
        WHERE id != NEW.id AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for default template enforcement
DROP TRIGGER IF EXISTS ensure_default_template_trigger ON export_templates;
CREATE TRIGGER ensure_default_template_trigger
    BEFORE INSERT OR UPDATE ON export_templates
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION ensure_single_default_template();

-- Enable Row Level Security
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS export_templates_select_all ON export_templates;
DROP POLICY IF EXISTS export_templates_insert_assigner ON export_templates;
DROP POLICY IF EXISTS export_templates_update_owner ON export_templates;
DROP POLICY IF EXISTS export_templates_delete_owner ON export_templates;

-- Policy: All authenticated users can read all templates
CREATE POLICY export_templates_select_all 
    ON export_templates FOR SELECT 
    USING (true);

-- Policy: Only assigners and admins can create templates
CREATE POLICY export_templates_insert_assigner 
    ON export_templates FOR INSERT 
    WITH CHECK (true); -- We'll check role in API

-- Policy: Only creator or admin can update
CREATE POLICY export_templates_update_owner 
    ON export_templates FOR UPDATE 
    USING (true); -- We'll check role + ownership in API

-- Policy: Only creator or admin can delete
CREATE POLICY export_templates_delete_owner 
    ON export_templates FOR DELETE 
    USING (true); -- We'll check role + ownership in API

-- Insert default template
INSERT INTO export_templates (name, description, config, is_default, created_by)
SELECT 
    'Standart Rapor',
    'Tüm kolonları içeren temel rapor formatı',
    '{
      "columns": ["date", "task", "client", "system", "user", "time_hours", "time_minutes", "note"],
      "grouping": {
        "enabled": false
      },
      "sorting": {
        "field": "date",
        "order": "desc"
      },
      "metrics": {
        "subtotal": [],
        "grandTotal": ["total_time", "activity_count"]
      },
      "styling": {
        "preset": "professional"
      },
      "conditionalFormat": []
    }'::jsonb,
    true,
    users.id
FROM users 
WHERE users.role = 'ADMIN' 
LIMIT 1
ON CONFLICT (name) DO NOTHING;

-- Insert sample templates for different use cases
INSERT INTO export_templates (name, description, config, is_default, created_by)
SELECT 
    'Müşteri Raporu',
    'Müşteriye sunulacak profesyonel rapor formatı',
    '{
      "columns": ["date", "day_name", "task", "client", "system", "time_hours", "note"],
      "grouping": {
        "enabled": true,
        "levels": ["client", "system"],
        "showSubtotals": true
      },
      "sorting": {
        "field": "date",
        "order": "asc"
      },
      "metrics": {
        "subtotal": ["total_time", "activity_count"],
        "grandTotal": ["total_time", "activity_count", "client_distribution"]
      },
      "styling": {
        "preset": "professional",
        "primaryColor": "#3B82F6"
      },
      "conditionalFormat": []
    }'::jsonb,
    false,
    users.id
FROM users 
WHERE users.role = 'ADMIN' 
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO export_templates (name, description, config, is_default, created_by)
SELECT 
    'Zaman Çizelgesi',
    'Ekip yönetimi için detaylı zaman takip raporu',
    '{
      "columns": ["date", "user", "task", "system", "time_hours", "time_decimal", "note"],
      "grouping": {
        "enabled": true,
        "levels": ["user"],
        "showSubtotals": true
      },
      "sorting": {
        "field": "date",
        "order": "desc"
      },
      "metrics": {
        "subtotal": ["total_time", "activity_count", "average_time", "daily_average"],
        "grandTotal": ["total_time", "activity_count", "user_distribution", "daily_average"]
      },
      "styling": {
        "preset": "colorful"
      },
      "conditionalFormat": [
        {
          "field": "time_minutes",
          "condition": "greater_than",
          "value": 480,
          "style": {
            "backgroundColor": "#FEE2E2",
            "fontColor": "#DC2626"
          }
        }
      ]
    }'::jsonb,
    false,
    users.id
FROM users 
WHERE users.role = 'ADMIN' 
LIMIT 1
ON CONFLICT (name) DO NOTHING;

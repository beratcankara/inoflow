-- =============================================================================
-- InoFlow Activity Tracking System - Schema Modification
-- Created: 2026-01-08
-- Description: Make task_id optional and add direct system_id column
-- =============================================================================

-- =============================================================================
-- STEP 1: ADD system_id COLUMN (nullable for now)
-- =============================================================================

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS system_id TEXT REFERENCES systems(id) ON DELETE RESTRICT;

COMMENT ON COLUMN activities.system_id IS 'Direct reference to system, allows activities without tasks';

-- =============================================================================
-- STEP 2: BACKFILL system_id FROM EXISTING TASKS
-- =============================================================================

-- Update all existing activities to have system_id from their task's system
UPDATE activities a
SET system_id = t.system_id
FROM tasks t
WHERE a.task_id = t.id 
  AND a.system_id IS NULL;

-- Verify backfill
SELECT 
  COUNT(*) FILTER (WHERE system_id IS NULL) AS null_system_count,
  COUNT(*) AS total_count
FROM activities;

-- =============================================================================
-- STEP 3: MAKE system_id NOT NULL
-- =============================================================================

ALTER TABLE activities 
ALTER COLUMN system_id SET NOT NULL;

-- =============================================================================
-- STEP 4: MAKE task_id NULLABLE
-- =============================================================================

ALTER TABLE activities 
ALTER COLUMN task_id DROP NOT NULL;

-- =============================================================================
-- STEP 5: ADD CONSTRAINT - Ensure logical data integrity
-- =============================================================================

-- Either task_id is provided, OR both client_id and system_id must be valid
-- This is enforced at application level, but we add a check for safety
ALTER TABLE activities
ADD CONSTRAINT activities_has_task_or_manual_info
CHECK (
  task_id IS NOT NULL 
  OR 
  (client_id IS NOT NULL AND system_id IS NOT NULL)
);

COMMENT ON CONSTRAINT activities_has_task_or_manual_info ON activities IS 
  'Ensures activity has either task_id or both client_id and system_id';

-- =============================================================================
-- STEP 6: DROP OLD INDEXES
-- =============================================================================

DROP INDEX IF EXISTS idx_activities_task_id;
DROP INDEX IF EXISTS idx_activities_composite;

-- =============================================================================
-- STEP 7: CREATE NEW INDEXES
-- =============================================================================

-- Index for task_id queries (sparse index for non-null values)
CREATE INDEX idx_activities_task_id_sparse 
  ON activities(task_id) 
  WHERE task_id IS NOT NULL;

-- Index for system_id queries
CREATE INDEX idx_activities_system_id 
  ON activities(system_id);

-- Updated composite index with system_id
CREATE INDEX idx_activities_composite_v2 
  ON activities(user_id, client_id, system_id, activity_date DESC);

-- Index for system-based reporting
CREATE INDEX idx_activities_system_date 
  ON activities(system_id, activity_date DESC);

-- =============================================================================
-- STEP 8: DROP AND RECREATE activity_summary VIEW
-- =============================================================================

DROP VIEW IF EXISTS activity_summary;

CREATE OR REPLACE VIEW activity_summary AS
SELECT 
  a.id,
  a.task_id,
  a.system_id,
  a.user_id,
  a.client_id,
  a.activity_date,
  a.time_spent_minutes,
  a.note,
  a.created_at,
  a.updated_at,
  
  -- Task (nullable)
  CASE 
    WHEN t.id IS NOT NULL THEN
      jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'status', t.status
      )
    ELSE NULL
  END AS task,
  
  -- User
  jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email
  ) AS "user",
  
  -- Client
  jsonb_build_object(
    'id', c.id,
    'name', c.name
  ) AS client,
  
  -- System (now direct, not nullable)
  jsonb_build_object(
    'id', s.id,
    'name', s.name
  ) AS system,
  
  -- Computed time fields
  ROUND(a.time_spent_minutes::NUMERIC / 60, 2) AS hours_decimal,
  (a.time_spent_minutes / 60)::INTEGER AS hours_whole,
  (a.time_spent_minutes % 60)::INTEGER AS minutes_remainder
  
FROM activities a
LEFT JOIN tasks t ON a.task_id = t.id
JOIN users u ON a.user_id = u.id
JOIN clients c ON a.client_id = c.id
JOIN systems s ON a.system_id = s.id;

COMMENT ON VIEW activity_summary IS 
  'Activity summary with all relations, supports NULL task_id';

-- =============================================================================
-- STEP 9: GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT ON activity_summary TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- 1. Check column types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'activities'
  AND column_name IN ('task_id', 'system_id', 'client_id', 'user_id')
ORDER BY column_name;

-- 2. Check constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'activities'
ORDER BY constraint_type, constraint_name;

-- 3. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'activities'
ORDER BY indexname;

-- 4. Test view
SELECT 
  COUNT(*) AS total_activities,
  COUNT(task_id) AS with_task,
  COUNT(*) - COUNT(task_id) AS without_task,
  COUNT(system_id) AS with_system
FROM activity_summary;

-- 5. Check data integrity
SELECT 
  'Activities violating constraint' AS check_name,
  COUNT(*) AS count
FROM activities
WHERE task_id IS NULL 
  AND (client_id IS NULL OR system_id IS NULL);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

SELECT 'Migration completed successfully!' AS status;

-- =============================================================================
-- InoFlow Activity Tracking System - Database Migration
-- Created: 2026-01-08
-- Description: Creates activities table with RLS policies, indexes, and triggers
-- =============================================================================

-- =============================================================================
-- 1. CREATE ACTIVITIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS activities (
  -- Primary Key
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Foreign Keys (using TEXT to match existing schema)
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  
  -- Activity Data
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_spent_minutes INTEGER NOT NULL 
    CHECK (time_spent_minutes > 0 AND time_spent_minutes <= 1440),
  note TEXT NOT NULL CHECK (length(note) > 0 AND length(note) <= 2000),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT activities_date_constraint CHECK (
    activity_date <= CURRENT_DATE AND 
    activity_date >= CURRENT_DATE - INTERVAL '15 days'
  )
);

-- =============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_task_id ON activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_activities_user_date 
  ON activities(user_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_activities_client_date 
  ON activities(client_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_activities_composite 
  ON activities(user_id, client_id, activity_date DESC);

-- =============================================================================
-- 3. CREATE AUTO-UPDATE TRIGGER
-- =============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to activities table
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. CREATE DATABASE VIEW FOR ACTIVITY SUMMARY
-- =============================================================================

CREATE OR REPLACE VIEW activity_summary AS
SELECT 
  a.id,
  a.activity_date,
  a.time_spent_minutes,
  a.note,
  a.created_at,
  a.updated_at,
  
  -- Task
  jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'status', t.status
  ) AS task,
  
  -- User
  jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email
  ) AS user,
  
  -- Client
  jsonb_build_object(
    'id', c.id,
    'name', c.name
  ) AS client,
  
  -- System (nullable)
  CASE 
    WHEN s.id IS NOT NULL THEN
      jsonb_build_object(
        'id', s.id,
        'name', s.name
      )
    ELSE NULL
  END AS system,
  
  -- Computed time fields
  ROUND(a.time_spent_minutes::NUMERIC / 60, 2) AS hours_decimal,
  (a.time_spent_minutes / 60)::INTEGER AS hours_whole,
  (a.time_spent_minutes % 60)::INTEGER AS minutes_remainder
  
FROM activities a
JOIN tasks t ON a.task_id = t.id
JOIN users u ON a.user_id = u.id
JOIN clients c ON a.client_id = c.id
LEFT JOIN systems s ON t.system_id = s.id;

-- =============================================================================
-- 5. ENABLE ROW-LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. CREATE RLS POLICIES (Simplified for NextAuth compatibility)
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "workers_view_own_activities" ON activities;
DROP POLICY IF EXISTS "users_create_activities" ON activities;
DROP POLICY IF EXISTS "users_update_own_activities" ON activities;
DROP POLICY IF EXISTS "users_delete_own_activities" ON activities;

-- POLICY 1: Allow authenticated users to view activities
-- (Application layer handles role-based filtering)
CREATE POLICY "authenticated_users_view_activities"
ON activities FOR SELECT
TO authenticated
USING (true);

-- POLICY 2: Allow authenticated users to create activities
-- (Application layer validates task ownership)
CREATE POLICY "authenticated_users_create_activities"
ON activities FOR INSERT
TO authenticated
WITH CHECK (true);

-- POLICY 3: Allow authenticated users to update activities
-- (Application layer enforces 15-day window and ownership)
CREATE POLICY "authenticated_users_update_activities"
ON activities FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- POLICY 4: Allow authenticated users to delete activities
-- (Application layer enforces 15-day window and ownership)
CREATE POLICY "authenticated_users_delete_activities"
ON activities FOR DELETE
TO authenticated
USING (true);

-- =============================================================================
-- 7. GRANT PERMISSIONS
-- =============================================================================

-- Grant authenticated users access to the activities table
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;

-- Grant access to the activity_summary view
GRANT SELECT ON activity_summary TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify table creation
SELECT 
  'activities' AS table_name,
  COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'activities';

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'activities';

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename = 'activities';

-- Verify policies
SELECT 
  policyname,
  cmd AS operation,
  qual AS using_expression
FROM pg_policies 
WHERE tablename = 'activities';

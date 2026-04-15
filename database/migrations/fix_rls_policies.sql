-- =============================================================================
-- Fix RLS Policy Issues - Disable RLS for Development
-- Run this in Supabase SQL Editor
-- =============================================================================

-- OPTION 1: Disable RLS entirely (simplest for development)
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- OPTION 2: If you want to keep RLS enabled but make it permissive:
-- First drop all existing policies
DROP POLICY IF EXISTS "workers_view_own_activities" ON activities;
DROP POLICY IF EXISTS "users_create_activities" ON activities;
DROP POLICY IF EXISTS "users_update_own_activities" ON activities;
DROP POLICY IF EXISTS "users_delete_own_activities" ON activities;
DROP POLICY IF EXISTS "authenticated_users_view_activities" ON activities;
DROP POLICY IF EXISTS "authenticated_users_create_activities" ON activities;
DROP POLICY IF EXISTS "authenticated_users_update_activities" ON activities;
DROP POLICY IF EXISTS "authenticated_users_delete_activities" ON activities;

-- Then create simple allow-all policies for authenticated users
CREATE POLICY "allow_all_for_authenticated"
ON activities
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON activities TO authenticated;
GRANT ALL ON activities TO anon;

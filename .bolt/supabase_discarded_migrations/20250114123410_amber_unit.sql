/*
  # Fix RLS Policies for Users Table

  1. Changes
    - Temporarily disables RLS for initial setup
    - Creates proper policies for authenticated users
    - Ensures proper access control for user operations
*/

-- Temporarily disable RLS to allow initial setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_all_authenticated_operations" ON users;
DROP POLICY IF EXISTS "anyone_can_view_profiles" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON users;

-- Create new policies
CREATE POLICY "users_select_all"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_own"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN privy_did_to_uuid(auth.uid()::text)
      ELSE auth.uid()::uuid
    END
  );

CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    id = CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN privy_did_to_uuid(auth.uid()::text)
      ELSE auth.uid()::uuid
    END
  )
  WITH CHECK (
    id = CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN privy_did_to_uuid(auth.uid()::text)
      ELSE auth.uid()::uuid
    END
  );

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
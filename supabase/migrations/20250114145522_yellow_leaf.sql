-- Drop existing policies
DROP POLICY IF EXISTS "authenticated_users_full_access" ON users;
DROP POLICY IF EXISTS "users_read_all" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create a completely permissive policy for authenticated users
CREATE POLICY "allow_all_authenticated_operations"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
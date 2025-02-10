-- Drop existing policies
DROP POLICY IF EXISTS "allow_authenticated_access" ON users;

-- Create separate policies for different operations
CREATE POLICY "users_read_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_access"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
        id = privy_did_to_uuid(auth.uid()::text)
      ELSE 
        id = auth.uid()::uuid
    END
    OR
    -- Fallback for cases where conversion fails
    id = uuid_generate_v5(uuid_nil(), auth.uid()::text)
  );

CREATE POLICY "users_update_access"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
        id = privy_did_to_uuid(auth.uid()::text)
      ELSE 
        id = auth.uid()::uuid
    END
    OR
    -- Fallback for cases where conversion fails
    id = uuid_generate_v5(uuid_nil(), auth.uid()::text)
  )
  WITH CHECK (
    CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
        id = privy_did_to_uuid(auth.uid()::text)
      ELSE 
        id = auth.uid()::uuid
    END
    OR
    -- Fallback for cases where conversion fails
    id = uuid_generate_v5(uuid_nil(), auth.uid()::text)
  );

-- Ensure RLS is enabled
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Update the privy_did_to_uuid function to be more resilient
CREATE OR REPLACE FUNCTION privy_did_to_uuid(did text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CASE 
    WHEN did LIKE 'did:privy:%' THEN
      -- Try to create a deterministic UUID from the DID
      uuid_generate_v5(uuid_nil(), did)
    ELSE
      -- If it's already a UUID, try to cast it
      CASE 
        WHEN did ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN did::uuid
        ELSE uuid_generate_v5(uuid_nil(), did)
      END
  END;
EXCEPTION WHEN OTHERS THEN
  -- Fallback to a deterministic UUID if all else fails
  RETURN uuid_generate_v5(uuid_nil(), did);
END;
$$;
-- Drop existing functions
DROP FUNCTION IF EXISTS initialize_user_wallet(text);
DROP FUNCTION IF EXISTS initialize_user_wallet(uuid);
DROP FUNCTION IF EXISTS sync_user_and_wallet_v2(text);
DROP FUNCTION IF EXISTS get_profile_by_identifier(text);

-- Create wallet initialization function with correct parameter name
CREATE OR REPLACE FUNCTION initialize_user_wallet(user_id text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id bigint;
BEGIN
  -- Convert text ID to UUID
  BEGIN
    v_user_id := CASE 
      WHEN user_id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_generate_v4(), user_id)
      ELSE
        user_id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := uuid_generate_v5(uuid_generate_v4(), user_id);
  END;

  -- Create or update wallet
  INSERT INTO wallets (user_id, balance)
  VALUES (v_user_id, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in initialize_user_wallet: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- Create profile lookup function
CREATE OR REPLACE FUNCTION get_profile_by_identifier(identifier text)
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  avatar_url text,
  bio text,
  followers_count integer,
  following_count integer,
  is_following boolean,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First try to find by UUID
  BEGIN
    RETURN QUERY
    SELECT 
      u.id,
      u.name,
      u.username,
      u.avatar_url,
      u.bio,
      u.followers_count,
      u.following_count,
      EXISTS (
        SELECT 1 FROM followers f 
        WHERE f.following_id = u.id 
        AND f.follower_id = auth.uid()::uuid
      ) as is_following,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE u.id = identifier::uuid;

    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If UUID cast fails, continue to username search
  END;

  -- If no results or UUID cast failed, try username
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.username,
    u.avatar_url,
    u.bio,
    u.followers_count,
    u.following_count,
    EXISTS (
      SELECT 1 FROM followers f 
      WHERE f.following_id = u.id 
      AND f.follower_id = auth.uid()::uuid
    ) as is_following,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.username = identifier;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO anon;
GRANT EXECUTE ON FUNCTION get_profile_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_by_identifier(text) TO anon;

-- Ensure RLS is enabled
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
DROP POLICY IF EXISTS "allow_all_wallet_operations" ON wallets;
CREATE POLICY "allow_all_wallet_operations"
  ON wallets
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_user_operations" ON users;
CREATE POLICY "allow_all_user_operations"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON wallets TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
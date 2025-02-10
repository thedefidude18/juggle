-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS initialize_user_wallet(text);
DROP FUNCTION IF EXISTS initialize_user_wallet(uuid);
DROP FUNCTION IF EXISTS sync_user_and_wallet_v2(text);

-- Create single function to initialize wallet with explicit type casting
CREATE OR REPLACE FUNCTION initialize_user_wallet(user_id text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Ensure user exists first
  INSERT INTO users (id, username)
  VALUES (
    v_user_id,
    'user_' || substr(md5(v_user_id::text), 1, 8)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create or update wallet
  INSERT INTO wallets (user_id, balance)
  VALUES (v_user_id, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;

-- Create function to sync user and wallet with explicit type handling
CREATE OR REPLACE FUNCTION sync_user_and_wallet_v2(input_id text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id bigint;
  v_username text;
BEGIN
  -- Convert text ID to UUID
  BEGIN
    v_user_id := CASE 
      WHEN input_id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_generate_v4(), input_id)
      ELSE
        input_id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := uuid_generate_v5(uuid_generate_v4(), input_id);
  END;

  -- Generate username
  v_username := 'user_' || substr(md5(v_user_id::text), 1, 8);

  -- Create or update user
  INSERT INTO users (
    id,
    username,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_username,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = CASE 
      WHEN users.username IS NULL OR users.username = '' 
      THEN v_username 
      ELSE users.username 
    END,
    updated_at = now();

  -- Create or update wallet
  INSERT INTO wallets (user_id, balance)
  VALUES (v_user_id, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO anon;
GRANT EXECUTE ON FUNCTION sync_user_and_wallet_v2(text) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_and_wallet_v2(text) TO anon;
-- Drop existing functions
DROP FUNCTION IF EXISTS initialize_user_wallet(text);
DROP FUNCTION IF EXISTS sync_user_and_wallet_v2(text);

-- Create improved wallet initialization function
CREATE OR REPLACE FUNCTION initialize_user_wallet(p_user_id text)
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
      WHEN p_user_id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_generate_v4(), p_user_id)
      ELSE
        p_user_id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := uuid_generate_v5(uuid_generate_v4(), p_user_id);
  END;

  -- Create or update wallet with explicit table references
  INSERT INTO wallets (user_id, balance)
  SELECT v_user_id, 10000
  WHERE EXISTS (
    SELECT 1 FROM users u WHERE u.id = v_user_id
  )
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  -- If no wallet was created/updated, user doesn't exist
  IF v_wallet_id IS NULL THEN
    -- Create user first
    INSERT INTO users (id, username)
    VALUES (
      v_user_id,
      'user_' || substr(md5(v_user_id::text), 1, 8)
    )
    ON CONFLICT (id) DO NOTHING;

    -- Then create wallet
    INSERT INTO wallets (user_id, balance)
    VALUES (v_user_id, 10000)
    RETURNING id INTO v_wallet_id;
  END IF;

  RETURN v_wallet_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in initialize_user_wallet: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO anon;
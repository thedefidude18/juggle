-- Drop existing function first
DROP FUNCTION IF EXISTS initialize_user_wallet(text);

-- Function to initialize wallet for a user
CREATE OR REPLACE FUNCTION initialize_user_wallet(user_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id uuid;
BEGIN
  -- Convert user_id to UUID
  BEGIN
    v_user_id := CASE 
      WHEN user_id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_nil(), user_id)
      ELSE
        CASE 
          WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN user_id::uuid
          ELSE uuid_generate_v5(uuid_nil(), user_id)
        END
    END;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := uuid_generate_v5(uuid_nil(), user_id);
  END;

  -- Ensure user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
    RETURN NULL;
  END IF;

  -- Create or update wallet
  INSERT INTO wallets (user_id, balance)
  VALUES (v_user_id, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;

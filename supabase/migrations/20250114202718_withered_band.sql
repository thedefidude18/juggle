-- Drop existing functions
DROP FUNCTION IF EXISTS sync_user_and_wallet(text);
DROP FUNCTION IF EXISTS sync_user_and_wallet(uuid);
DROP FUNCTION IF EXISTS sync_user_and_wallet_v2(text);

-- Create new wallet initialization function
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
        uuid_generate_v5(uuid_generate_v4(), user_id)
      ELSE
        user_id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := uuid_generate_v5(uuid_generate_v4(), user_id);
  END;

  -- Create wallet if not exists
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO anon;
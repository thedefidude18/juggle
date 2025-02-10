-- Drop existing function first
DROP FUNCTION IF EXISTS initialize_user_wallet(text);

-- Add sequence for wallet IDs
CREATE SEQUENCE IF NOT EXISTS wallet_id_seq;

-- Add new wallet initialization function with sequential IDs
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
  INSERT INTO wallets (id, user_id, balance)
  VALUES (nextval('wallet_id_seq'), v_user_id, 10000)
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
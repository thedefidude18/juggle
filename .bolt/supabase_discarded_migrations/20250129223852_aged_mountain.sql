-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS initialize_user_wallet(text);
DROP FUNCTION IF EXISTS initialize_user_wallet(uuid);

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
  WITH wallet_insert AS (
    INSERT INTO wallets (user_id, balance)
    VALUES (v_user_id, 10000)
    ON CONFLICT (user_id) DO UPDATE
    SET updated_at = now()
    RETURNING id
  )
  SELECT id INTO v_wallet_id FROM wallet_insert;

  RETURN v_wallet_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in initialize_user_wallet: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO anon;
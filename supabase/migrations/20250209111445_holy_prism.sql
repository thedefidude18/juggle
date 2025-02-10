-- Drop existing function
DROP FUNCTION IF EXISTS initialize_user_wallet(text);

-- Recreate function with proper error handling and parameter name
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

  -- Create or update wallet with retries
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO wallets (user_id, balance)
      VALUES (v_user_id, 10000)
      ON CONFLICT (user_id) DO UPDATE
      SET updated_at = now()
      RETURNING id INTO v_wallet_id;

      RETURN v_wallet_id;
    EXCEPTION WHEN OTHERS THEN
      IF i = 3 THEN
        RAISE WARNING 'Error in initialize_user_wallet after 3 attempts: %', SQLERRM;
        RETURN NULL;
      END IF;
      -- Wait a bit before retrying
      PERFORM pg_sleep(0.1 * i);
    END;
  END LOOP;

  RETURN NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO anon;
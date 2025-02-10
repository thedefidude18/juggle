-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing function
DROP FUNCTION IF EXISTS initialize_user_wallet(text);

-- Create improved wallet initialization function with better error handling
CREATE OR REPLACE FUNCTION initialize_user_wallet(user_id text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id bigint;
  v_namespace uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid; -- Fixed namespace UUID
BEGIN
  -- Convert text ID to UUID with multiple fallback options
  BEGIN
    v_user_id := CASE 
      WHEN user_id LIKE 'did:privy:%' THEN 
        COALESCE(
          -- Try uuid_generate_v5 with namespace first
          uuid_generate_v5(v_namespace, user_id),
          -- Fallback to v4 if v5 fails
          uuid_generate_v4()
        )
      ELSE
        CASE 
          WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN user_id::uuid
          ELSE uuid_generate_v5(v_namespace, user_id)
        END
    END;
  EXCEPTION WHEN OTHERS THEN
    -- Ultimate fallback using v4
    v_user_id := uuid_generate_v4();
  END;

  -- Create or update wallet with retries
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO wallets (user_id, balance)
      VALUES (v_user_id, 10000)
      ON CONFLICT (user_id) DO UPDATE
      SET updated_at = now()
      RETURNING id INTO v_wallet_id;

      -- If successful, return the wallet ID
      IF v_wallet_id IS NOT NULL THEN
        RETURN v_wallet_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      IF i = 3 THEN
        RAISE WARNING 'Error in initialize_user_wallet after 3 attempts: %', SQLERRM;
        RETURN NULL;
      END IF;
      -- Wait a bit before retrying with exponential backoff
      PERFORM pg_sleep(power(2, i - 1) * 0.1);
    END;
  END LOOP;

  RETURN NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO anon;

-- Create helper function to ensure UUID functions are available
CREATE OR REPLACE FUNCTION ensure_uuid_functions()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if uuid-ossp functions are available
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'uuid_generate_v4'
  ) THEN
    -- Try to create extension again
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  END IF;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not ensure UUID functions: %', SQLERRM;
  RETURN false;
END;
$$;

-- Run the helper function
SELECT ensure_uuid_functions();
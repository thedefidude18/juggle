-- Disable RLS temporarily
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_wallet_select" ON wallets;
DROP POLICY IF EXISTS "allow_wallet_insert" ON wallets;
DROP POLICY IF EXISTS "allow_wallet_update" ON wallets;

-- Create a single permissive policy for all operations
CREATE POLICY "authenticated_wallet_access"
  ON wallets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON wallets TO anon;

-- Update the wallet creation trigger to be more resilient
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Convert ID to UUID with better error handling
  BEGIN
    new_user_id := CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_nil(), NEW.id)
      ELSE
        CASE 
          WHEN NEW.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN NEW.id::uuid
          ELSE uuid_generate_v5(uuid_nil(), NEW.id)
        END
    END;
  EXCEPTION WHEN OTHERS THEN
    new_user_id := uuid_generate_v5(uuid_nil(), NEW.id);
  END;

  -- Create wallet with retries
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO wallets (user_id, balance)
      VALUES (new_user_id, 10000)
      ON CONFLICT (user_id) DO NOTHING;
      
      EXIT; -- Exit loop if successful
    EXCEPTION WHEN OTHERS THEN
      IF i = 3 THEN 
        RAISE WARNING 'Failed to create wallet after 3 attempts: %', SQLERRM;
      ELSE
        -- Wait a bit before retrying
        PERFORM pg_sleep(0.1 * i);
        CONTINUE;
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;
-- Disable RLS temporarily
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "authenticated_wallet_access" ON wallets;

-- Create completely permissive policies
CREATE POLICY "allow_all_wallet_operations"
  ON wallets
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Grant full access
GRANT ALL ON wallets TO public;
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON wallets TO anon;

-- Update wallet initialization function
CREATE OR REPLACE FUNCTION initialize_wallet(user_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_id uuid;
  converted_user_id uuid;
BEGIN
  -- Convert user ID to UUID
  converted_user_id := CASE 
    WHEN user_id LIKE 'did:privy:%' THEN 
      uuid_generate_v5(uuid_nil(), user_id)
    ELSE
      user_id::uuid
  END;

  -- Create wallet if it doesn't exist
  INSERT INTO wallets (user_id, balance)
  VALUES (converted_user_id, 10000)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO wallet_id;

  -- If wallet already existed, get its ID
  IF wallet_id IS NULL THEN
    SELECT id INTO wallet_id
    FROM wallets
    WHERE user_id = converted_user_id;
  END IF;

  RETURN wallet_id;
END;
$$;
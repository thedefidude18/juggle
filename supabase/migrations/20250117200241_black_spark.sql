-- Drop existing policies
DROP POLICY IF EXISTS "allow_authenticated_wallet_access" ON wallets;

-- Create completely permissive policy
CREATE POLICY "allow_all_wallet_operations"
  ON wallets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON wallets TO anon;

-- Function to initialize user wallet
CREATE OR REPLACE FUNCTION initialize_user_wallet(user_id text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id bigint;
BEGIN
  -- Create wallet if not exists
  INSERT INTO wallets (user_id, balance)
  VALUES (user_id::uuid, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in initialize_user_wallet: %', SQLERRM;
  RETURN NULL;
END;
$$;
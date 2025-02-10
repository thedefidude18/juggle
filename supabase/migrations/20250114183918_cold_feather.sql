-- Disable RLS temporarily to make changes
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "authenticated_wallet_access" ON wallets;

-- Create separate policies for different operations
CREATE POLICY "wallets_select_policy"
  ON wallets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "wallets_insert_policy"
  ON wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = user_id::text
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = user_id
      AND auth.uid()::text = id::text
    )
  );

CREATE POLICY "wallets_update_policy"
  ON wallets
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = user_id::text
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = user_id
      AND auth.uid()::text = id::text
    )
  )
  WITH CHECK (
    auth.uid()::text = user_id::text
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = user_id
      AND auth.uid()::text = id::text
    )
  );

-- Re-enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON wallets TO authenticated;
GRANT SELECT ON wallets TO anon;

-- Update the wallet creation function to handle Privy DIDs
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create wallet for new user with test funds
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 10000)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  RAISE WARNING 'Error creating wallet: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet();
-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;
DROP POLICY IF EXISTS "view_own_wallet" ON wallets;

-- Create more permissive policies for wallets
CREATE POLICY "allow_wallet_select"
  ON wallets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_wallet_insert"
  ON wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_wallet_update"
  ON wallets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Update the wallet creation function to be more permissive
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  wallet_id uuid;
BEGIN
  -- Create wallet for new user with test funds
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 10000)
  RETURNING id INTO wallet_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  RAISE WARNING 'Error creating wallet: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for wallet creation
DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet();
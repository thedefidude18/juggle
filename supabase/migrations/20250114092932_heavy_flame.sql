/*
  # Fix Wallet Authentication
  
  1. Changes
    - Update wallet policies to handle Privy DIDs
    - Add helper functions for wallet auth
*/

-- Drop and recreate wallet policies
DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;

-- Update wallet policies to handle Privy DIDs
CREATE POLICY "view_own_wallet" 
  ON wallets 
  FOR SELECT 
  TO authenticated 
  USING (
    CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
        user_id = privy_did_to_uuid(auth.uid()::text)
      ELSE 
        user_id = auth.uid()::uuid
    END
  );

-- Function to get current user's wallet ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN CASE 
    WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
      privy_did_to_uuid(auth.uid()::text)
    ELSE 
      auth.uid()::uuid
  END;
END;
$$;

-- Update transaction policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;

CREATE POLICY "view_own_transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = get_current_user_id()
    ) OR 
    recipient_wallet_id IN (
      SELECT id FROM wallets WHERE user_id = get_current_user_id()
    )
  );

CREATE POLICY "create_own_transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = get_current_user_id()
    )
  );

-- Update transfer function to use new auth helper
CREATE OR REPLACE FUNCTION transfer_funds(
  sender_wallet_id uuid,
  recipient_wallet_id uuid,
  amount integer,
  reference text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_id uuid;
  current_user_wallet_id uuid;
BEGIN
  -- Get current user's wallet ID
  SELECT id INTO current_user_wallet_id
  FROM wallets
  WHERE user_id = get_current_user_id();

  -- Verify sender is current user
  IF sender_wallet_id != current_user_wallet_id THEN
    RAISE EXCEPTION 'Unauthorized transfer attempt';
  END IF;

  -- Check if sender has sufficient funds
  IF NOT EXISTS (
    SELECT 1 FROM wallets 
    WHERE id = sender_wallet_id AND balance >= amount
  ) THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Create transaction record
  INSERT INTO transactions (
    wallet_id,
    recipient_wallet_id,
    type,
    amount,
    reference,
    status
  ) VALUES (
    sender_wallet_id,
    recipient_wallet_id,
    'transfer',
    amount,
    reference,
    'completed'
  ) RETURNING id INTO transaction_id;

  -- Update wallet balances
  UPDATE wallets 
  SET balance = balance - amount,
      updated_at = now()
  WHERE id = sender_wallet_id;

  UPDATE wallets 
  SET balance = balance + amount,
      updated_at = now()
  WHERE id = recipient_wallet_id;

  RETURN transaction_id;
END;
$$;
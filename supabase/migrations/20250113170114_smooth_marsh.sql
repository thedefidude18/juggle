/*
  # Wallet System Schema

  1. New Tables
    - `wallets`
      - Stores user wallet information
      - Tracks balance in Naira
      - Has a unique wallet ID per user
    
    - `transactions`
      - Records all wallet transactions
      - Supports deposits, withdrawals, and transfers
      - Tracks transaction status and references
    
  2. Security
    - Enable RLS on all tables
    - Users can only view and manage their own wallet
    - Transactions are protected but viewable by both sender and receiver
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id),
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  amount integer NOT NULL CHECK (amount > 0),
  reference text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  recipient_wallet_id uuid REFERENCES wallets(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON wallets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    ) OR 
    recipient_wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

-- Function to handle transfers
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
BEGIN
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
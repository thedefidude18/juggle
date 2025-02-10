-- Add coins column to wallets
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0;

-- Add system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id bigint PRIMARY KEY DEFAULT 1,
  settlement_method text NOT NULL DEFAULT 'fiat' CHECK (settlement_method IN ('fiat', 'coins')),
  coins_exchange_rate integer NOT NULL DEFAULT 100, -- 1 Coin = 100 Naira
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for system_settings
CREATE POLICY "Anyone can view system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update system settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Insert default system settings
INSERT INTO system_settings (id, settlement_method, coins_exchange_rate)
VALUES (1, 'fiat', 100)
ON CONFLICT (id) DO NOTHING;

-- Add coins_amount to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS coins_amount integer,
  ADD CONSTRAINT valid_amount_type CHECK (
    (wager_amount IS NOT NULL AND coins_amount IS NULL) OR
    (wager_amount IS NULL AND coins_amount IS NOT NULL)
  );

-- Add coins_amount to challenges
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS coins_amount integer,
  ADD CONSTRAINT valid_amount_type CHECK (
    (amount IS NOT NULL AND coins_amount IS NULL) OR
    (amount IS NULL AND coins_amount IS NOT NULL)
  );

-- Function to toggle settlement method
CREATE OR REPLACE FUNCTION toggle_settlement_method(p_use_coins boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin 
  FROM users 
  WHERE id = auth.uid();

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can change settlement method';
  END IF;

  -- Update settlement method
  UPDATE system_settings
  SET 
    settlement_method = CASE WHEN p_use_coins THEN 'coins' ELSE 'fiat' END,
    updated_at = now()
  WHERE id = 1;

  RETURN true;
END;
$$;

-- Function to exchange fiat to coins
CREATE OR REPLACE FUNCTION exchange_fiat_to_coins(p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id bigint;
  v_exchange_rate integer;
  v_coins integer;
BEGIN
  -- Get current user's wallet
  SELECT w.id, w.user_id INTO v_wallet_id, v_user_id
  FROM wallets w
  WHERE w.user_id = auth.uid()
  FOR UPDATE;

  -- Get exchange rate
  SELECT coins_exchange_rate INTO v_exchange_rate
  FROM system_settings
  WHERE id = 1;

  -- Calculate coins
  v_coins := p_amount / v_exchange_rate;

  -- Check sufficient balance
  IF NOT EXISTS (
    SELECT 1 FROM wallets 
    WHERE id = v_wallet_id 
    AND balance >= p_amount
  ) THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Perform exchange
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    coins = coins + v_coins,
    updated_at = now()
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO transactions (
    wallet_id,
    type,
    amount,
    reference,
    status,
    metadata
  ) VALUES (
    v_wallet_id,
    'exchange',
    p_amount,
    'EXC_' || floor(extract(epoch from now()))::text,
    'completed',
    jsonb_build_object(
      'coins_received', v_coins,
      'exchange_rate', v_exchange_rate,
      'direction', 'fiat_to_coins'
    )
  );

  RETURN true;
END;
$$;

-- Function to exchange coins to fiat
CREATE OR REPLACE FUNCTION exchange_coins_to_fiat(p_coins integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id bigint;
  v_exchange_rate integer;
  v_amount integer;
BEGIN
  -- Get current user's wallet
  SELECT w.id, w.user_id INTO v_wallet_id, v_user_id
  FROM wallets w
  WHERE w.user_id = auth.uid()
  FOR UPDATE;

  -- Get exchange rate
  SELECT coins_exchange_rate INTO v_exchange_rate
  FROM system_settings
  WHERE id = 1;

  -- Calculate fiat amount
  v_amount := p_coins * v_exchange_rate;

  -- Check sufficient coins
  IF NOT EXISTS (
    SELECT 1 FROM wallets 
    WHERE id = v_wallet_id 
    AND coins >= p_coins
  ) THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  -- Perform exchange
  UPDATE wallets
  SET 
    balance = balance + v_amount,
    coins = coins - p_coins,
    updated_at = now()
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO transactions (
    wallet_id,
    type,
    amount,
    reference,
    status,
    metadata
  ) VALUES (
    v_wallet_id,
    'exchange',
    v_amount,
    'EXC_' || floor(extract(epoch from now()))::text,
    'completed',
    jsonb_build_object(
      'coins_exchanged', p_coins,
      'exchange_rate', v_exchange_rate,
      'direction', 'coins_to_fiat'
    )
  );

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION toggle_settlement_method(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION exchange_fiat_to_coins(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION exchange_coins_to_fiat(integer) TO authenticated;
-- Create transactions table with Paystack integration
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id bigint REFERENCES wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  amount integer NOT NULL CHECK (amount >= 100),
  reference text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  recipient_wallet_id bigint REFERENCES wallets(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "transactions_select_policy"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()::uuid
    ) OR 
    recipient_wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "transactions_insert_policy"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()::uuid
    )
  );

-- Function to verify Paystack transaction
CREATE OR REPLACE FUNCTION verify_paystack_transaction(
  p_reference text,
  p_amount integer,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction record;
  v_wallet_id bigint;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM transactions
  WHERE reference = p_reference
  AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verify amount matches
  IF v_transaction.amount != p_amount THEN
    RETURN false;
  END IF;

  -- Update transaction status
  UPDATE transactions
  SET 
    status = p_status,
    updated_at = now()
  WHERE id = v_transaction.id;

  -- If payment successful, credit wallet
  IF p_status = 'completed' THEN
    UPDATE wallets
    SET 
      balance = balance + p_amount,
      updated_at = now()
    WHERE id = v_transaction.wallet_id;

    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      metadata
    )
    SELECT
      w.user_id,
      'deposit',
      'Deposit Successful',
      'Your wallet has been credited with ₦' || p_amount::text,
      jsonb_build_object(
        'amount', p_amount,
        'transaction_id', v_transaction.id
      )
    FROM wallets w
    WHERE w.id = v_transaction.wallet_id;
  END IF;

  RETURN true;
END;
$$;
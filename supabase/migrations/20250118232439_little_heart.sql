-- Function to verify Flutterwave transaction
CREATE OR REPLACE FUNCTION verify_flutterwave_transaction(
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
        'transaction_id', v_transaction.id,
        'provider', 'flutterwave'
      )
    FROM wallets w
    WHERE w.id = v_transaction.wallet_id;
  END IF;

  RETURN true;
END;
$$;
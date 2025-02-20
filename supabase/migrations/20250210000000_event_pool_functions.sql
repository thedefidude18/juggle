-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE wallets
  SET 
    balance = balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Insert transaction record
  INSERT INTO wallet_transactions (
    user_id,
    amount,
    type,
    status
  ) VALUES (
    p_user_id,
    p_amount,
    CASE WHEN p_amount > 0 THEN 'credit' ELSE 'debit' END,
    'completed'
  );
END;
$$;

-- Function to initialize event pool
CREATE OR REPLACE FUNCTION initialize_event_pool(
  p_event_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO event_pools (
    event_id,
    total_amount,
    admin_fee,
    winning_pool,
    losing_pool,
    status
  ) VALUES (
    p_event_id,
    0,
    0,
    0,
    0,
    'pending'
  );
END;
$$;

-- Trigger to automatically create event pool when event is created
CREATE OR REPLACE FUNCTION create_event_pool_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM initialize_event_pool(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER event_pool_creation_trigger
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION create_event_pool_trigger();
-- Add function to handle event payouts
CREATE OR REPLACE FUNCTION process_event_payout(event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_is_admin boolean;
  v_event record;
  v_winner_prediction boolean;
  v_total_pool integer;
  v_winner_count integer;
  v_payout_per_winner integer;
BEGIN
  -- Get current user
  v_admin_id := auth.uid()::uuid;
  
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can process payouts';
  END IF;

  -- Get event details
  SELECT * INTO v_event
  FROM events
  WHERE id = event_id AND status = 'completed'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or not completed';
  END IF;

  IF v_event.payout_status != 'pending' THEN
    RAISE EXCEPTION 'Event payout already processed';
  END IF;

  -- Calculate total pool and winners
  SELECT 
    SUM(e.wager_amount),
    bool_or(ep.prediction),
    COUNT(*)
  INTO 
    v_total_pool,
    v_winner_prediction,
    v_winner_count
  FROM event_participants ep
  JOIN events e ON e.id = ep.event_id
  WHERE ep.event_id = event_id
  AND ep.prediction = true
  GROUP BY ep.prediction;

  -- Calculate payout per winner
  v_payout_per_winner := v_total_pool / v_winner_count;

  -- Process payouts to winners
  WITH winners AS (
    SELECT 
      ep.user_id,
      w.id as wallet_id
    FROM event_participants ep
    JOIN wallets w ON w.user_id = ep.user_id
    WHERE ep.event_id = event_id
    AND ep.prediction = v_winner_prediction
  )
  UPDATE wallets w
  SET 
    balance = balance + v_payout_per_winner,
    updated_at = now()
  FROM winners
  WHERE w.id = winners.wallet_id;

  -- Update event payout status
  UPDATE events
  SET 
    payout_status = 'completed',
    payout_approved_at = now(),
    payout_approved_by = v_admin_id,
    updated_at = now()
  WHERE id = event_id;

  -- Record admin action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'process_payout',
    'event',
    event_id,
    jsonb_build_object(
      'total_pool', v_total_pool,
      'winner_count', v_winner_count,
      'payout_per_winner', v_payout_per_winner
    )
  );

  RETURN true;
END;
$$;

-- Function to lock funds when joining event
CREATE OR REPLACE FUNCTION lock_event_funds(
  p_user_id uuid,
  p_event_id uuid,
  p_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  -- Get user's wallet
  SELECT id INTO v_wallet_id
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Check sufficient balance
  IF NOT EXISTS (
    SELECT 1 FROM wallets 
    WHERE id = v_wallet_id 
    AND balance >= p_amount
  ) THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Lock funds
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    updated_at = now()
  WHERE id = v_wallet_id;

  -- Add to event pool
  UPDATE event_pools
  SET 
    total_amount = total_amount + p_amount,
    updated_at = now()
  WHERE event_id = p_event_id;

  RETURN true;
END;
$$;

-- Add function to cancel event and refund participants
CREATE OR REPLACE FUNCTION cancel_event(event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_is_admin boolean;
  v_event record;
BEGIN
  -- Get current user
  v_admin_id := auth.uid()::uuid;
  
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can cancel events';
  END IF;

  -- Get event details
  SELECT * INTO v_event
  FROM events
  WHERE id = event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Refund participants
  WITH refunds AS (
    SELECT 
      ep.user_id,
      w.id as wallet_id,
      e.wager_amount
    FROM event_participants ep
    JOIN wallets w ON w.user_id = ep.user_id
    JOIN events e ON e.id = ep.event_id
    WHERE ep.event_id = event_id
  )
  UPDATE wallets w
  SET 
    balance = balance + r.wager_amount,
    updated_at = now()
  FROM refunds r
  WHERE w.id = r.wallet_id;

  -- Update event status
  UPDATE events
  SET 
    status = 'cancelled',
    payout_status = 'cancelled',
    updated_at = now()
  WHERE id = event_id;

  -- Record admin action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'cancel_event',
    'event',
    event_id,
    jsonb_build_object('action', 'cancel')
  );

  RETURN true;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_payout_status ON events(payout_status);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_participants_prediction ON event_participants(prediction);
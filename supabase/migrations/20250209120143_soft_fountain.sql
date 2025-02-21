-- Add outcome management functions for admins
CREATE OR REPLACE FUNCTION admin_set_event_outcome(
  p_event_id uuid,
  p_winning_prediction boolean,
  p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
  v_match record;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = p_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can set event outcomes';
  END IF;

  -- Update event status
  UPDATE events
  SET 
    status = 'completed',
    updated_at = now()
  WHERE id = p_event_id
  AND status = 'active';

  -- Process payouts for each matched pair
  FOR v_match IN 
    SELECT * FROM bet_matches 
    WHERE event_id = p_event_id 
    AND status = 'active'
  LOOP
    -- Calculate winner's payout (total stakes minus platform fee)
    -- Platform fee is 3% of total pot
    DECLARE
      v_total_pot := v_match.wager_amount * 2;
      v_platform_fee := v_total_pot * 0.03;
      v_winner_payout := v_total_pot - v_platform_fee;
      v_winner_id uuid;
    BEGIN
      -- Determine winner based on admin's decision
      v_winner_id := CASE 
        WHEN p_winning_prediction THEN v_match.yes_participant_id
        ELSE v_match.no_participant_id
      END;

      -- Update winner's wallet
      UPDATE wallets w
      SET balance = balance + v_winner_payout
      FROM event_participants ep
      WHERE ep.id = v_winner_id
      AND w.user_id = ep.user_id;

      -- Update match status
      UPDATE bet_matches
      SET 
        status = 'completed',
        updated_at = now()
      WHERE id = v_match.id;
    END;
  END LOOP;

  -- Update all participant statuses
  UPDATE event_participants
  SET status = CASE 
    WHEN prediction = p_winning_prediction THEN 'won'
    ELSE 'lost'
  END
  WHERE event_id = p_event_id;

  -- Record admin action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    p_admin_id,
    'set_event_outcome',
    'event',
    p_event_id,
    jsonb_build_object(
      'winning_prediction', p_winning_prediction
    )
  );

  RETURN true;
END;
$$;

-- Function for admins to set challenge outcomes
CREATE OR REPLACE FUNCTION admin_set_challenge_outcome(
  p_challenge_id uuid,
  p_winner_id uuid,
  p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
  v_challenge record;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = p_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can set challenge outcomes';
  END IF;

  -- Get challenge details
  SELECT * INTO v_challenge
  FROM challenges
  WHERE id = p_challenge_id
  AND status = 'accepted'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found or not in accepted status';
  END IF;

  -- Verify winner is a participant
  IF p_winner_id NOT IN (v_challenge.challenger_id, v_challenge.challenged_id) THEN
    RAISE EXCEPTION 'Winner must be a challenge participant';
  END IF;

  -- Process challenge completion
  PERFORM complete_challenge(p_challenge_id, p_winner_id);

  -- Record admin action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    p_admin_id,
    'set_challenge_outcome',
    'challenge',
    p_challenge_id,
    jsonb_build_object(
      'winner_id', p_winner_id
    )
  );

  RETURN true;
END;
$$;

-- Function to get pending events/challenges for admin review
CREATE OR REPLACE FUNCTION get_pending_outcomes(
  p_admin_id uuid,
  p_type text DEFAULT NULL -- 'event' or 'challenge'
)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  status text,
  created_at timestamptz,
  participants jsonb,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = p_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can view pending outcomes';
  END IF;

  RETURN QUERY
  -- Get pending events
  SELECT 
    e.id,
    'event'::text as type,
    e.title,
    e.status,
    e.created_at,
    jsonb_agg(
      jsonb_build_object(
        'user_id', ep.user_id,
        'prediction', ep.prediction,
        'username', u.username
      )
    ) as participants,
    jsonb_build_object(
      'category', e.category,
      'wager_amount', e.wager_amount,
      'end_time', e.end_time
    ) as details
  FROM events e
  JOIN event_participants ep ON e.id = ep.event_id
  JOIN users u ON ep.user_id = u.id
  WHERE e.status = 'active'
  AND e.end_time <= now()
  AND (p_type IS NULL OR p_type = 'event')
  GROUP BY e.id

  UNION ALL

  -- Get pending challenges
  SELECT 
    c.id,
    'challenge'::text as type,
    'P2P Challenge'::text as title,
    c.status,
    c.created_at,
    jsonb_build_array(
      jsonb_build_object(
        'user_id', c.challenger_id,
        'username', u1.username,
        'role', 'challenger'
      ),
      jsonb_build_object(
        'user_id', c.challenged_id,
        'username', u2.username,
        'role', 'challenged'
      )
    ) as participants,
    jsonb_build_object(
      'amount', c.amount,
      'expires_at', c.expires_at,
      'message_id', c.message_id
    ) as details
  FROM challenges c
  JOIN users u1 ON c.challenger_id = u1.id
  JOIN users u2 ON c.challenged_id = u2.id
  WHERE c.status = 'accepted'
  AND (p_type IS NULL OR p_type = 'challenge')
  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_set_event_outcome(uuid, boolean, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_challenge_outcome(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_outcomes(uuid, text) TO authenticated;

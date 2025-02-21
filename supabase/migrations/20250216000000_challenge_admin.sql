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
  AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found or not in active status';
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

-- Function to add support to challenge chat
CREATE OR REPLACE FUNCTION add_support_to_challenge(
  p_challenge_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id uuid;
BEGIN
  -- Get chat ID for challenge
  SELECT message_id INTO v_chat_id
  FROM challenges
  WHERE id = p_challenge_id;

  -- Add support user to chat
  INSERT INTO chat_participants (
    chat_id,
    user_id,
    role
  ) VALUES (
    v_chat_id,
    (SELECT id FROM users WHERE is_support = true LIMIT 1),
    'support'
  );

  RETURN true;
END;
$$;
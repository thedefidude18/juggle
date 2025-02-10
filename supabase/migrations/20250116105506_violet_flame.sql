-- Create event_history table
CREATE TABLE IF NOT EXISTS event_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('challenge', 'group')),
  title text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('won', 'lost')),
  amount integer NOT NULL CHECK (amount >= 0),
  earnings integer,
  date timestamptz DEFAULT now(),
  opponent_id uuid REFERENCES users(id) ON DELETE SET NULL,
  group_id uuid REFERENCES chats(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_reference CHECK (
    (type = 'challenge' AND opponent_id IS NOT NULL AND group_id IS NULL) OR
    (type = 'group' AND group_id IS NOT NULL AND opponent_id IS NULL)
  )
);

-- Enable RLS
ALTER TABLE event_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own event history"
  ON event_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

-- Create function to record event history
CREATE OR REPLACE FUNCTION record_event_history(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_outcome text,
  p_amount integer,
  p_earnings integer DEFAULT NULL,
  p_opponent_id uuid DEFAULT NULL,
  p_group_id uuid DEFAULT NULL,
  p_event_id uuid DEFAULT NULL,
  p_challenge_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_history_id uuid;
BEGIN
  -- Validate input
  IF p_type NOT IN ('challenge', 'group') THEN
    RAISE EXCEPTION 'Invalid event type';
  END IF;

  IF p_outcome NOT IN ('won', 'lost') THEN
    RAISE EXCEPTION 'Invalid outcome';
  END IF;

  IF p_type = 'challenge' AND p_opponent_id IS NULL THEN
    RAISE EXCEPTION 'Opponent ID required for challenges';
  END IF;

  IF p_type = 'group' AND p_group_id IS NULL THEN
    RAISE EXCEPTION 'Group ID required for group events';
  END IF;

  -- Insert history record
  INSERT INTO event_history (
    user_id,
    type,
    title,
    outcome,
    amount,
    earnings,
    opponent_id,
    group_id,
    event_id,
    challenge_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_outcome,
    p_amount,
    p_earnings,
    p_opponent_id,
    p_group_id,
    p_event_id,
    p_challenge_id
  )
  RETURNING id INTO v_history_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata
  ) VALUES (
    p_user_id,
    CASE p_outcome 
      WHEN 'won' THEN 'event_win'
      ELSE 'event_loss'
    END,
    CASE p_outcome
      WHEN 'won' THEN 'Event Won!'
      ELSE 'Event Lost'
    END,
    CASE 
      WHEN p_type = 'challenge' THEN
        CASE p_outcome
          WHEN 'won' THEN 'You won the challenge against ' || (SELECT name FROM users WHERE id = p_opponent_id)
          ELSE 'You lost the challenge against ' || (SELECT name FROM users WHERE id = p_opponent_id)
        END
      ELSE
        CASE p_outcome
          WHEN 'won' THEN 'You won in ' || (SELECT group_name FROM chats WHERE id = p_group_id)
          ELSE 'You lost in ' || (SELECT group_name FROM chats WHERE id = p_group_id)
        END
    END,
    jsonb_build_object(
      'event_history_id', v_history_id,
      'amount', p_amount,
      'earnings', p_earnings,
      'type', p_type,
      'opponent_id', p_opponent_id,
      'group_id', p_group_id
    )
  );

  RETURN v_history_id;
END;
$$;

-- Create function to get user event history
CREATE OR REPLACE FUNCTION get_user_event_history(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  outcome text,
  amount integer,
  earnings integer,
  date timestamptz,
  opponent_name text,
  opponent_avatar_url text,
  group_name text,
  group_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eh.id,
    eh.type,
    eh.title,
    eh.outcome,
    eh.amount,
    eh.earnings,
    eh.date,
    u.name as opponent_name,
    u.avatar_url as opponent_avatar_url,
    c.group_name,
    c.group_avatar as group_avatar_url
  FROM event_history eh
  LEFT JOIN users u ON eh.opponent_id = u.id
  LEFT JOIN chats c ON eh.group_id = c.id
  WHERE eh.user_id = p_user_id
  ORDER BY eh.date DESC;
END;
$$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_event_history_user_id ON event_history(user_id);
CREATE INDEX IF NOT EXISTS idx_event_history_type ON event_history(type);
CREATE INDEX IF NOT EXISTS idx_event_history_date ON event_history(date);
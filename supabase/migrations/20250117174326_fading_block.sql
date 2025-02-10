-- Add security and rewards related columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS pin_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS last_active timestamptz,
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank integer;

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 0,
  earned_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

-- Function to set PIN
CREATE OR REPLACE FUNCTION set_security_pin(
  p_user_id uuid,
  p_pin text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    pin_hash = crypt(p_pin, gen_salt('bf')),
    pin_attempts = 0,
    locked_until = NULL
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Function to verify PIN
CREATE OR REPLACE FUNCTION verify_security_pin(
  p_user_id uuid,
  p_pin text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user record;
BEGIN
  -- Get user
  SELECT * INTO v_user
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if account is locked
  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > now() THEN
    RETURN false;
  END IF;

  -- Verify PIN
  IF v_user.pin_hash = crypt(p_pin, v_user.pin_hash) THEN
    -- Reset attempts on successful verification
    UPDATE users
    SET 
      pin_attempts = 0,
      locked_until = NULL,
      last_active = now()
    WHERE id = p_user_id;
    
    RETURN true;
  ELSE
    -- Increment attempts and possibly lock account
    UPDATE users
    SET 
      pin_attempts = LEAST(pin_attempts + 1, 5),
      locked_until = CASE 
        WHEN pin_attempts >= 4 THEN now() + interval '30 minutes'
        ELSE locked_until
      END
    WHERE id = p_user_id;
    
    RETURN false;
  END IF;
END;
$$;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id uuid,
  p_points integer,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user points
  UPDATE users
  SET points = points + p_points
  WHERE id = p_user_id;

  -- Create achievement record
  INSERT INTO user_achievements (
    user_id,
    type,
    title,
    description,
    points
  ) VALUES (
    p_user_id,
    'points',
    'Points Earned',
    p_reason,
    p_points
  );

  RETURN true;
END;
$$;

-- Function to update user ranks
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update ranks based on reputation score
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY reputation_score DESC) as new_rank
    FROM users
    WHERE reputation_score > 0
  )
  UPDATE users u
  SET rank = ru.new_rank
  FROM ranked_users ru
  WHERE u.id = ru.id;
END;
$$;

-- Create trigger to update ranks when reputation changes
CREATE OR REPLACE FUNCTION trigger_update_ranks()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_user_ranks();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ranks_on_reputation_change
  AFTER UPDATE OF reputation_score ON users
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_ranks();

-- Function to update user activity
CREATE OR REPLACE FUNCTION update_user_activity(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET last_active = now()
  WHERE id = user_id;
END;
$$;
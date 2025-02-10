-- Create function to ensure user stats exist
CREATE OR REPLACE FUNCTION ensure_user_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_stats (
    user_id,
    events_created,
    events_participated,
    total_wagered_yes,
    total_wagered_no,
    events_won,
    events_lost,
    current_balance,
    total_earnings,
    updated_at
  )
  VALUES (
    p_user_id,
    0, -- events_created
    0, -- events_participated
    0, -- total_wagered_yes
    0, -- total_wagered_no
    0, -- events_won
    0, -- events_lost
    0, -- current_balance
    0, -- total_earnings
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Create trigger to ensure stats exist when user is created
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM ensure_user_stats(NEW.id);
  RETURN NEW;
END;
$$;

-- Add trigger to users table
DROP TRIGGER IF EXISTS ensure_user_stats_trigger ON users;
CREATE TRIGGER ensure_user_stats_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats();

-- Ensure stats exist for all current users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users
  LOOP
    PERFORM ensure_user_stats(user_record.id);
  END LOOP;
END;
$$;
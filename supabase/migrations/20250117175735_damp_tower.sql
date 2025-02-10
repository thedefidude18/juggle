-- Drop materialized view if exists
DROP MATERIALIZED VIEW IF EXISTS user_stats;

-- Create user_stats table instead of view
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  events_created integer DEFAULT 0,
  events_participated integer DEFAULT 0,
  total_wagered_yes integer DEFAULT 0,
  total_wagered_no integer DEFAULT 0,
  events_won integer DEFAULT 0,
  events_lost integer DEFAULT 0,
  current_balance integer DEFAULT 0,
  total_earnings integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for user_stats
CREATE POLICY "Users can view all user stats"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id uuid)
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
  SELECT
    u.id as user_id,
    COUNT(DISTINCT e.id) as events_created,
    COUNT(DISTINCT ep.event_id) as events_participated,
    COALESCE(SUM(CASE WHEN ep.prediction = true THEN e.wager_amount ELSE 0 END), 0) as total_wagered_yes,
    COALESCE(SUM(CASE WHEN ep.prediction = false THEN e.wager_amount ELSE 0 END), 0) as total_wagered_no,
    COUNT(DISTINCT CASE WHEN ep.status = 'won' THEN ep.event_id END) as events_won,
    COUNT(DISTINCT CASE WHEN ep.status = 'lost' THEN ep.event_id END) as events_lost,
    COALESCE(w.balance, 0) as current_balance,
    COALESCE(SUM(CASE WHEN ep.status = 'won' THEN e.wager_amount * 2 ELSE 0 END), 0) as total_earnings,
    now() as updated_at
  FROM users u
  LEFT JOIN events e ON u.id = e.creator_id
  LEFT JOIN event_participants ep ON u.id = ep.user_id
  LEFT JOIN wallets w ON u.id = w.user_id
  WHERE u.id = p_user_id
  GROUP BY u.id, w.balance
  ON CONFLICT (user_id) DO UPDATE
  SET
    events_created = EXCLUDED.events_created,
    events_participated = EXCLUDED.events_participated,
    total_wagered_yes = EXCLUDED.total_wagered_yes,
    total_wagered_no = EXCLUDED.total_wagered_no,
    events_won = EXCLUDED.events_won,
    events_lost = EXCLUDED.events_lost,
    current_balance = EXCLUDED.current_balance,
    total_earnings = EXCLUDED.total_earnings,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Create triggers to update stats
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_user_stats(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END
  );
  RETURN NEW;
END;
$$;

-- Create triggers for relevant tables
CREATE TRIGGER update_stats_on_event_change
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats();

CREATE TRIGGER update_stats_on_participant_change
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats();

CREATE TRIGGER update_stats_on_wallet_change
  AFTER INSERT OR UPDATE OR DELETE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats();

-- Initialize stats for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users
  LOOP
    PERFORM update_user_stats(user_record.id);
  END LOOP;
END;
$$;
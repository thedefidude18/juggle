-- Add total_earnings column if it doesn't exist
ALTER TABLE user_stats 
  ADD COLUMN IF NOT EXISTS total_earnings integer DEFAULT 0;

-- Recreate the update function to include total_earnings
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
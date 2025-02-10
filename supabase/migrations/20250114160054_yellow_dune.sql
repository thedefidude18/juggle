-- Create materialized view for event statistics
CREATE MATERIALIZED VIEW event_stats AS
WITH event_totals AS (
  SELECT
    e.id as event_id,
    e.creator_id,
    e.category,
    e.wager_amount,
    COUNT(ep.id) as participant_count,
    e.wager_amount * COUNT(ep.id) as total_pool,
    (e.wager_amount * COUNT(ep.id) * 0.03) as platform_fee
  FROM events e
  LEFT JOIN event_participants ep ON e.id = ep.event_id
  GROUP BY e.id, e.creator_id, e.category, e.wager_amount
)
SELECT
  creator_id,
  category,
  COUNT(DISTINCT event_id) as total_events,
  SUM(participant_count) as total_participants,
  SUM(total_pool) as total_pool_amount,
  SUM(platform_fee) as total_platform_fees
FROM event_totals
GROUP BY creator_id, category;

-- Create materialized view for user statistics
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  u.id as user_id,
  COUNT(DISTINCT e.id) as events_created,
  COUNT(DISTINCT ep.event_id) as events_participated,
  SUM(CASE WHEN ep.prediction = true THEN e.wager_amount ELSE 0 END) as total_wagered_yes,
  SUM(CASE WHEN ep.prediction = false THEN e.wager_amount ELSE 0 END) as total_wagered_no,
  COUNT(DISTINCT CASE WHEN ep.status = 'won' THEN ep.event_id END) as events_won,
  COUNT(DISTINCT CASE WHEN ep.status = 'lost' THEN ep.event_id END) as events_lost,
  COALESCE(w.balance, 0) as current_balance
FROM users u
LEFT JOIN events e ON u.id = e.creator_id
LEFT JOIN event_participants ep ON u.id = ep.user_id
LEFT JOIN wallets w ON u.id = w.user_id
GROUP BY u.id, w.balance;

-- Create materialized view for chat/group statistics
CREATE MATERIALIZED VIEW chat_stats AS
SELECT
  c.id as chat_id,
  c.group_name,
  COUNT(DISTINCT cp.user_id) as member_count,
  COUNT(DISTINCT m.id) as message_count,
  COUNT(DISTINCT CASE WHEN m.created_at >= now() - interval '30 days' THEN m.id END) as messages_last_30d,
  COUNT(DISTINCT CASE WHEN cp.joined_at >= now() - interval '30 days' THEN cp.user_id END) as new_members_last_30d
FROM chats c
LEFT JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN messages m ON c.id = m.chat_id
WHERE c.is_group = true
GROUP BY c.id, c.group_name;

-- Function to refresh all stats views
CREATE OR REPLACE FUNCTION refresh_all_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW event_stats;
  REFRESH MATERIALIZED VIEW user_stats;
  REFRESH MATERIALIZED VIEW chat_stats;
END;
$$;

-- Function to get platform summary
CREATE OR REPLACE FUNCTION get_platform_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'total_events', (SELECT COUNT(*) FROM events),
    'total_groups', (SELECT COUNT(*) FROM chats WHERE is_group = true),
    'total_pool_amount', COALESCE((SELECT SUM(total_pool_amount) FROM event_stats), 0),
    'total_platform_fees', COALESCE((SELECT SUM(total_platform_fees) FROM event_stats), 0),
    'active_users_last_30d', (
      SELECT COUNT(DISTINCT user_id)
      FROM event_participants ep
      JOIN events e ON e.id = ep.event_id
      WHERE e.created_at >= now() - interval '30 days'
    ),
    'category_stats', (
      SELECT jsonb_agg(jsonb_build_object(
        'category', category,
        'event_count', total_events,
        'total_pool', total_pool_amount,
        'platform_fees', total_platform_fees
      ))
      FROM event_stats
      GROUP BY category
    )
  ) INTO v_summary;

  RETURN v_summary;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_joined_at ON chat_participants(joined_at);

-- Set up automatic refresh of materialized views
CREATE OR REPLACE FUNCTION refresh_stats_on_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_all_stats();
  RETURN NULL;
END;
$$;

-- Create triggers to refresh stats
CREATE TRIGGER refresh_stats_events
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_stats_on_change();

CREATE TRIGGER refresh_stats_participants
AFTER INSERT OR UPDATE OR DELETE ON event_participants
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_stats_on_change();

CREATE TRIGGER refresh_stats_messages
AFTER INSERT OR UPDATE OR DELETE ON messages
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_stats_on_change();

-- Initial refresh of materialized views
SELECT refresh_all_stats();
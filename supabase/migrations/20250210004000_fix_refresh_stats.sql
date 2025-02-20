-- Drop triggers first
DROP TRIGGER IF EXISTS refresh_stats_events ON events;
DROP TRIGGER IF EXISTS refresh_stats_participants ON event_participants;
DROP TRIGGER IF EXISTS refresh_stats_messages ON messages;

-- Then drop functions
DROP FUNCTION IF EXISTS refresh_all_stats();
DROP FUNCTION IF EXISTS refresh_stats_on_change();

-- Create new refresh function for remaining materialized views
CREATE OR REPLACE FUNCTION refresh_all_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only refresh event_stats
  REFRESH MATERIALIZED VIEW event_stats;
END;
$$;

-- Create new trigger function that doesn't refresh user_stats
CREATE OR REPLACE FUNCTION refresh_stats_on_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only refresh event_stats
  PERFORM refresh_all_stats();
  RETURN NULL;
END;
$$;

-- Recreate triggers
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

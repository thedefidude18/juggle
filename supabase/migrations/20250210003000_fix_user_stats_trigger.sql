-- Update the trigger function to use creator_id instead of user_id
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- For events table
  IF TG_TABLE_NAME = 'events' THEN
    PERFORM update_user_stats(
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.creator_id
        ELSE NEW.creator_id
      END
    );
  -- For event_participants table
  ELSIF TG_TABLE_NAME = 'event_participants' THEN
    PERFORM update_user_stats(
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.user_id
        ELSE NEW.user_id
      END
    );
  -- For wallets table
  ELSIF TG_TABLE_NAME = 'wallets' THEN
    PERFORM update_user_stats(
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.user_id
        ELSE NEW.user_id
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_stats_on_event_change ON events;
DROP TRIGGER IF EXISTS update_stats_on_participant_change ON event_participants;
DROP TRIGGER IF EXISTS update_stats_on_wallet_change ON wallets;

-- Recreate triggers with proper conditions
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
CREATE OR REPLACE FUNCTION handle_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- For new events
  IF (TG_OP = 'INSERT') THEN
    -- Update event stats
    PERFORM refresh_all_stats();
    -- Initialize event pool
    INSERT INTO event_pools (event_id, total_amount)
    VALUES (NEW.id, 0);
    RETURN NEW;
  
  -- For updated events
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Handle status changes
    IF NEW.status != OLD.status THEN
      -- If event is completed, process payouts
      IF NEW.status = 'completed' THEN
        PERFORM process_event_payout(NEW.id);
      -- If event is cancelled, handle refunds
      ELSIF NEW.status = 'cancelled' THEN
        PERFORM cancel_event(NEW.id);
      END IF;
    END IF;
    
    PERFORM refresh_all_stats();
    RETURN NEW;
  
  -- For deleted events
  ELSIF (TG_OP = 'DELETE') THEN
    -- Clean up related data if needed
    PERFORM refresh_all_stats();
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION handle_event_changes()
RETURNS TRIGGER AS $$
DECLARE
    follower_id UUID;
BEGIN
  -- For new events
  IF (TG_OP = 'INSERT') THEN
    -- Notify creator
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.creator_id,
      'event_created',
      'Event Created Successfully',
      format('Your event "%s" has been created and is now live', NEW.title),
      jsonb_build_object(
        'event_id', NEW.id,
        'event_title', NEW.title,
        'wager_amount', NEW.wager_amount
      )
    );

    -- Notify followers
    FOR follower_id IN (
      SELECT follower_id FROM followers 
      WHERE following_id = NEW.creator_id
    )
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        metadata
      ) VALUES (
        follower_id,
        'new_event',
        'New Event Available',
        format('%s created a new event: %s', (SELECT username FROM auth.users WHERE id = NEW.creator_id), NEW.title),
        jsonb_build_object(
          'event_id', NEW.id,
          'creator_id', NEW.creator_id,
          'event_title', NEW.title,
          'wager_amount', NEW.wager_amount
        )
      );
    END LOOP;

    -- Initialize event pool and continue with existing logic...
    PERFORM refresh_all_stats();
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

/*
  # Fix Event Triggers
  
  1. Changes
    - Drop existing event trigger
    - Update handle_event_changes function
    - Create new event trigger with proper pool initialization
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS event_changes_trigger ON public.events;
DROP TRIGGER IF EXISTS on_event_changes ON public.events;

-- Update the handle_event_changes function
CREATE OR REPLACE FUNCTION handle_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- For new events
  IF (TG_OP = 'INSERT') THEN
    -- Initialize event pool
    INSERT INTO event_pools (
      event_id,
      total_amount,
      admin_fee,
      winning_pool,
      losing_pool,
      status
    ) VALUES (
      NEW.id,
      0,
      0,
      0,
      0,
      'pending'
    );
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
    
    RETURN NEW;
  
  -- For deleted events
  ELSIF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER event_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION handle_event_changes();
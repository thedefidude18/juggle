-- Add missing columns to event_pools table
ALTER TABLE event_pools
ADD COLUMN IF NOT EXISTS winning_pool INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losing_pool INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Update existing pools if any
UPDATE event_pools
SET 
    winning_pool = 0,
    losing_pool = 0,
    status = 'pending'
WHERE winning_pool IS NULL;

-- Recreate the handle_event_changes function with proper column names
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
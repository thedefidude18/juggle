-- Add wager_amount column to event_participants
ALTER TABLE event_participants
ADD COLUMN IF NOT EXISTS wager_amount integer NOT NULL DEFAULT 0;

-- Create or replace function to handle participant joining
CREATE OR REPLACE FUNCTION handle_participant_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the pool amounts
    UPDATE event_pools
    SET 
        total_amount = total_amount + NEW.wager_amount,
        winning_pool = CASE 
            WHEN NEW.prediction THEN winning_pool + (NEW.wager_amount * 0.95)
            ELSE winning_pool
        END,
        losing_pool = CASE 
            WHEN NOT NEW.prediction THEN losing_pool + (NEW.wager_amount * 0.95)
            ELSE losing_pool
        END,
        admin_fee = admin_fee + (NEW.wager_amount * 0.05)
    WHERE event_id = NEW.event_id;
    
    RETURN NEW;
END;
$$;

-- Create trigger for handling participant joins
DROP TRIGGER IF EXISTS on_participant_join ON event_participants;
CREATE TRIGGER on_participant_join
    AFTER INSERT ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION handle_participant_join();
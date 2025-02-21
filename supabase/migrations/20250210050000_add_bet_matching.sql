-- First, add matching_status to event_participants
ALTER TABLE event_participants
ADD COLUMN IF NOT EXISTS matching_status TEXT DEFAULT 'waiting' 
CHECK (matching_status IN ('waiting', 'matched', 'cancelled'));

-- Create bet_matches table
CREATE TABLE IF NOT EXISTS bet_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    yes_participant_id UUID REFERENCES event_participants(id),
    no_participant_id UUID REFERENCES event_participants(id),
    wager_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matching function
CREATE OR REPLACE FUNCTION find_bet_match(participant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_prediction BOOLEAN;
    v_wager_amount INTEGER;
    v_matched_participant_id UUID;
    v_user_id UUID;
    v_matched_user_id UUID;
BEGIN
    -- Get participant details
    SELECT 
        event_id, 
        prediction,
        wager_amount,
        user_id
    INTO 
        v_event_id,
        v_prediction,
        v_wager_amount,
        v_user_id
    FROM event_participants
    WHERE id = participant_id
    AND matching_status = 'waiting';

    -- Find matching participant with opposite prediction
    SELECT id, user_id INTO v_matched_participant_id, v_matched_user_id
    FROM event_participants
    WHERE event_id = v_event_id
    AND prediction = NOT v_prediction
    AND matching_status = 'waiting'
    AND wager_amount = v_wager_amount
    LIMIT 1;

    -- If match found, create the pairing and handle wallet deductions
    IF v_matched_participant_id IS NOT NULL THEN
        -- Begin transaction
        BEGIN
            -- Deduct from first user's wallet
            UPDATE wallets
            SET balance = balance - v_wager_amount,
                locked_balance = locked_balance + v_wager_amount
            WHERE user_id = v_user_id
            AND balance >= v_wager_amount;

            -- Deduct from matched user's wallet
            UPDATE wallets
            SET balance = balance - v_wager_amount,
                locked_balance = locked_balance + v_wager_amount
            WHERE user_id = v_matched_user_id
            AND balance >= v_wager_amount;

            -- Create the bet match
            INSERT INTO bet_matches (
                event_id,
                yes_participant_id,
                no_participant_id,
                wager_amount
            ) VALUES (
                v_event_id,
                CASE WHEN v_prediction THEN participant_id ELSE v_matched_participant_id END,
                CASE WHEN v_prediction THEN v_matched_participant_id ELSE participant_id END,
                v_wager_amount
            );

            -- Update both participants' status
            UPDATE event_participants
            SET matching_status = 'matched'
            WHERE id IN (participant_id, v_matched_participant_id);

            -- Commit transaction
            COMMIT;
        EXCEPTION
            WHEN OTHERS THEN
                -- Rollback if any error occurs
                ROLLBACK;
                RETURN NULL;
        END;
    END IF;

    RETURN v_matched_participant_id;
END;
$$;

-- Enable RLS
ALTER TABLE bet_matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view matches in their events"
    ON bet_matches FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_participants ep
            WHERE ep.event_id = bet_matches.event_id
            AND ep.user_id = auth.uid()
        )
    );

-- Create trigger for automatic matching
CREATE OR REPLACE FUNCTION after_participant_created()
RETURNS TRIGGER AS $$
DECLARE
    v_matched_id UUID;
    v_matched_user_id UUID;
BEGIN
    -- Try to find a match
    v_matched_id := find_bet_match(NEW.id);
    
    -- If match found, create notification for both users
    IF v_matched_id IS NOT NULL THEN
        -- Get matched user's ID
        SELECT user_id INTO v_matched_user_id
        FROM event_participants
        WHERE id = v_matched_id;

        -- Create notification for original participant
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            metadata
        ) VALUES (
            NEW.user_id,
            'bet_matched',
            'Bet Matched!',
            'Your bet has been matched with another player',
            jsonb_build_object(
                'event_id', NEW.event_id,
                'wager_amount', NEW.wager_amount,
                'prediction', NEW.prediction
            )
        );

        -- Create notification for matched participant
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            metadata
        ) VALUES (
            v_matched_user_id,
            'bet_matched',
            'Bet Matched!',
            'Your bet has been matched with another player',
            jsonb_build_object(
                'event_id', NEW.event_id,
                'wager_amount', NEW.wager_amount,
                'prediction', NOT NEW.prediction
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER try_match_after_participant_created
    AFTER INSERT ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION after_participant_created();

-- Add RLS policies
CREATE POLICY "Users can view their own matches"
    ON bet_matches FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_participants ep
            WHERE (ep.id = bet_matches.yes_participant_id OR ep.id = bet_matches.no_participant_id)
            AND ep.user_id = auth.uid()
        )
    );

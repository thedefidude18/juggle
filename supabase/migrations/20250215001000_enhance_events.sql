-- Modify events table to add privacy settings
ALTER TABLE events ADD COLUMN is_private BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN requires_approval BOOLEAN DEFAULT false;

-- Create join requests table
CREATE TABLE event_join_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT, -- Optional message from requester
    response_message TEXT, -- Optional response from creator
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Add RLS policies for join requests
CREATE POLICY "Users can create join requests for private events"
ON event_join_requests
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM events
        WHERE id = event_id
        AND is_private = true
        AND status = 'active'
    )
);

CREATE POLICY "Users can view their own requests"
ON event_join_requests
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM events
        WHERE id = event_id
        AND creator_id = auth.uid()
    )
);

CREATE POLICY "Event creators can update request status"
ON event_join_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE id = event_id
        AND creator_id = auth.uid()
    )
);

-- Function to handle join request status changes
CREATE OR REPLACE FUNCTION handle_join_request_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for user when request is processed
    IF NEW.status != 'pending' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            metadata
        )
        VALUES (
            NEW.user_id,
            'event_join_request_' || NEW.status,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'Event Join Request Accepted'
                ELSE 'Event Join Request Declined'
            END,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'Your request to join the event has been accepted'
                ELSE 'Your request to join the event has been declined'
            END,
            jsonb_build_object(
                'event_id', NEW.event_id,
                'response_message', NEW.response_message
            )
        );

        -- If accepted, automatically create event participant entry
        IF NEW.status = 'accepted' THEN
            INSERT INTO event_participants (
                event_id,
                user_id,
                status
            )
            VALUES (
                NEW.event_id,
                NEW.user_id,
                'active'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_join_request_update
    AFTER UPDATE ON event_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_join_request_update();
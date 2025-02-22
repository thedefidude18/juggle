-- Function to generate notifications for existing events
CREATE OR REPLACE FUNCTION backfill_event_notifications()
RETURNS void AS $$
DECLARE
    event_record RECORD;
    follower_id UUID;
BEGIN
    -- Loop through all events
    FOR event_record IN 
        SELECT 
            e.id,
            e.creator_id,
            e.title,
            e.wager_amount,
            e.created_at,
            u.username
        FROM events e
        JOIN auth.users u ON e.creator_id = u.id
        WHERE NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.metadata->>'event_id' = e.id::text 
            AND n.type = 'event_created'
        )
    LOOP
        -- Create notification for event creator
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            metadata,
            created_at
        ) VALUES (
            event_record.creator_id,
            'event_created',
            'Event Created Successfully',
            format('Your event "%s" has been created and is now live', event_record.title),
            jsonb_build_object(
                'event_id', event_record.id,
                'event_title', event_record.title,
                'wager_amount', event_record.wager_amount
            ),
            event_record.created_at
        );

        -- Create notifications for followers
        FOR follower_id IN (
            SELECT follower_id FROM followers 
            WHERE following_id = event_record.creator_id
        )
        LOOP
            INSERT INTO notifications (
                user_id,
                type,
                title,
                content,
                metadata,
                created_at
            ) VALUES (
                follower_id,
                'new_event',
                'New Event Available',
                format('%s created a new event: %s', event_record.username, event_record.title),
                jsonb_build_object(
                    'event_id', event_record.id,
                    'creator_id', event_record.creator_id,
                    'event_title', event_record.title,
                    'wager_amount', event_record.wager_amount
                ),
                event_record.created_at
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the backfill function
SELECT backfill_event_notifications();
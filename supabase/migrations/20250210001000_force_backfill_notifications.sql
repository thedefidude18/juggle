-- First, clear any existing notifications that might be incomplete
DELETE FROM notifications 
WHERE type IN ('event_created', 'new_event', 'event_participation', 'event_milestone')
AND created_at < NOW();

-- Drop and recreate the backfill function with additional logging
CREATE OR REPLACE FUNCTION backfill_event_notifications()
RETURNS void AS $$
DECLARE
    event_record RECORD;
    follower_id UUID;
    notification_count INTEGER := 0;
BEGIN
    -- Loop through ALL events, regardless of existing notifications
    FOR event_record IN 
        SELECT 
            e.id,
            e.creator_id,
            e.title,
            e.wager_amount,
            e.created_at,
            u.username,
            (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) as participant_count
        FROM events e
        JOIN auth.users u ON e.creator_id = u.id
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
                'wager_amount', event_record.wager_amount,
                'participant_count', event_record.participant_count
            ),
            COALESCE(event_record.created_at, NOW())
        );
        
        notification_count := notification_count + 1;

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
                    'wager_amount', event_record.wager_amount,
                    'participant_count', event_record.participant_count
                ),
                COALESCE(event_record.created_at, NOW())
            );
            notification_count := notification_count + 1;
        END LOOP;

        -- Add milestone notifications if applicable
        IF event_record.participant_count >= 10 THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                content,
                metadata,
                created_at
            ) VALUES (
                event_record.creator_id,
                'event_milestone',
                'Event Milestone Reached! 🎉',
                format('Your event "%s" has reached %s participants!', 
                       event_record.title, event_record.participant_count),
                jsonb_build_object(
                    'event_id', event_record.id,
                    'event_title', event_record.title,
                    'participant_count', event_record.participant_count
                ),
                COALESCE(event_record.created_at, NOW())
            );
            notification_count := notification_count + 1;
        END IF;
    END LOOP;

    -- Log the results
    RAISE NOTICE 'Backfill complete: % notifications created', notification_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the backfill function
SELECT backfill_event_notifications();

-- Create a trigger for future events
DROP TRIGGER IF EXISTS event_notification_trigger ON events;
CREATE TRIGGER event_notification_trigger
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION handle_event_changes();
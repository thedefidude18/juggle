-- Create test data for development environment
DO $$ 
DECLARE
    v_user_id uuid;
    v_event_id uuid;
BEGIN
    -- Get or create test user
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'test@example.com' 
    LIMIT 1;

    -- Get or create test event
    SELECT id INTO v_event_id 
    FROM events 
    WHERE title = 'Test Event' 
    LIMIT 1;

    -- Insert test message
    INSERT INTO messages (
        sender_id,
        event_id,
        content,
        type
    ) VALUES (
        v_user_id,
        v_event_id,
        'Test event message',
        'event_message'
    );
END $$;
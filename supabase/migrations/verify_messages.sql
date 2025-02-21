-- Check the messages table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
AND table_schema = 'public';

-- Check the foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'messages'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'event_id';

-- Check if the index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'messages'
AND indexname = 'idx_messages_event_id';

-- Check RLS policies
SELECT *
FROM pg_policies
WHERE tablename = 'messages';

-- Test a message query
SELECT m.*, e.title as event_title
FROM messages m
LEFT JOIN events e ON e.id = m.event_id
WHERE m.event_id IS NOT NULL
LIMIT 1;
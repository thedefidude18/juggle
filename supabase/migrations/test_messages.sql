-- Test inserting a message
INSERT INTO messages (
  sender_id,
  event_id,
  content,
  type
) VALUES (
  'your-test-user-uuid',
  'your-test-event-uuid',
  'Test event message',
  'event_message'
) RETURNING *;

-- Verify message is queryable
SELECT m.*, 
       e.title as event_title,
       u.email as sender_email
FROM messages m
LEFT JOIN events e ON e.id = m.event_id
LEFT JOIN auth.users u ON u.id = m.sender_id
WHERE m.event_id = 'your-test-event-uuid';
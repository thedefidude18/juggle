-- Drop triggers that reference user_stats materialized view
DROP TRIGGER IF EXISTS refresh_stats_events ON events;
DROP TRIGGER IF EXISTS refresh_stats_participants ON event_participants;
DROP TRIGGER IF EXISTS refresh_stats_messages ON messages;

-- Add status column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'sleeping'));

-- Create mock users with different statuses
INSERT INTO users (id, name, username, avatar_url, status)
VALUES
  ('66666666-6666-6666-6666-666666666666', 'Sarah Wilson', 'sarahw', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'online'),
  ('77777777-7777-7777-7777-777777777777', 'David Lee', 'davidl', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', 'away'),
  ('88888888-8888-8888-8888-888888888888', 'Emma Davis', 'emmad', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', 'sleeping'),
  ('99999999-9999-9999-9999-999999999999', 'Alex Brown', 'alexb', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', 'offline')
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  status = EXCLUDED.status;

-- Create mock chats
DO $$ 
DECLARE
  chat_id1 uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  chat_id2 uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  chat_id3 uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  chat_id4 uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
BEGIN
  -- Insert chats
  INSERT INTO chats (id, created_at, updated_at, is_group, last_message)
  VALUES
    (chat_id1, now() - interval '1 hour', now() - interval '5 minutes', false, 'Hey! Are you up for a FIFA match?'),
    (chat_id2, now() - interval '2 hours', now() - interval '15 minutes', false, 'I''ll be online in 30 minutes'),
    (chat_id3, now() - interval '3 hours', now() - interval '30 minutes', false, 'Good game! Let''s play again sometime'),
    (chat_id4, now() - interval '4 hours', now() - interval '45 minutes', false, 'Zzz... catch you tomorrow')
  ON CONFLICT (id) DO UPDATE
  SET 
    last_message = EXCLUDED.last_message,
    updated_at = EXCLUDED.updated_at;

  -- Add chat participants
  INSERT INTO chat_participants (chat_id, user_id, last_read)
  VALUES
    (chat_id1, '66666666-6666-6666-6666-666666666666', now()),
    (chat_id1, '77777777-7777-7777-7777-777777777777', now() - interval '1 hour'),
    (chat_id2, '77777777-7777-7777-7777-777777777777', now()),
    (chat_id2, '88888888-8888-8888-8888-888888888888', now() - interval '1 hour'),
    (chat_id3, '88888888-8888-8888-8888-888888888888', now()),
    (chat_id3, '99999999-9999-9999-9999-999999999999', now() - interval '1 hour'),
    (chat_id4, '99999999-9999-9999-9999-999999999999', now()),
    (chat_id4, '66666666-6666-6666-6666-666666666666', now() - interval '1 hour')
  ON CONFLICT (chat_id, user_id) DO UPDATE
  SET last_read = EXCLUDED.last_read;

  -- Add mock messages
  INSERT INTO messages (chat_id, sender_id, content, created_at)
  VALUES
    (chat_id1, '66666666-6666-6666-6666-666666666666', 'Hey! Are you up for a FIFA match?', now() - interval '1 hour'),
    (chat_id1, '77777777-7777-7777-7777-777777777777', 'Sure! Give me 5 minutes', now() - interval '55 minutes'),
    (chat_id1, '66666666-6666-6666-6666-666666666666', 'Perfect! I''ll set up the game', now() - interval '50 minutes'),
    
    (chat_id2, '77777777-7777-7777-7777-777777777777', 'Hey, want to join our tournament?', now() - interval '2 hours'),
    (chat_id2, '88888888-8888-8888-8888-888888888888', 'I''ll be online in 30 minutes', now() - interval '1 hour 45 minutes'),
    
    (chat_id3, '88888888-8888-8888-8888-888888888888', 'That was an intense match!', now() - interval '3 hours'),
    (chat_id3, '99999999-9999-9999-9999-999999999999', 'Good game! Let''s play again sometime', now() - interval '2 hours 45 minutes'),
    
    (chat_id4, '99999999-9999-9999-9999-999999999999', 'Getting sleepy... 😴', now() - interval '4 hours'),
    (chat_id4, '66666666-6666-6666-6666-666666666666', 'Zzz... catch you tomorrow', now() - interval '3 hours 45 minutes')
  ON CONFLICT DO NOTHING;

  -- Create wallets for mock users if they don't exist
  INSERT INTO wallets (user_id, balance)
  VALUES
    ('66666666-6666-6666-6666-666666666666', 10000),
    ('77777777-7777-7777-7777-777777777777', 10000),
    ('88888888-8888-8888-8888-888888888888', 10000),
    ('99999999-9999-9999-9999-999999999999', 10000)
  ON CONFLICT (user_id) DO NOTHING;
END $$;
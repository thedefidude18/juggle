/*
  # Add mock data for chats and messages

  1. New Data
    - Add mock users
    - Add mock chats (both direct and group)
    - Add mock chat participants
    - Add mock messages

  2. Security
    - Maintain existing RLS policies
*/

-- Insert mock users (if they don't exist)
INSERT INTO users (id, name, username, avatar_url)
VALUES
  ('d8c7d961-f43c-4d19-b98e-e6f0ee578c67', 'John Doe', 'johndoe', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop'),
  ('e9b6c8a7-d5f4-4e3b-9c2a-1d8b7f6e4c5d', 'Jane Smith', 'janesmith', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop'),
  ('f1a2b3c4-d5e6-4f7g-8h9i-0k1l2m3n4o5p', 'Mike Johnson', 'mikejohnson', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- Insert mock chats
INSERT INTO chats (id, is_group, group_name, created_at, updated_at, last_message)
VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-1234567890ab', false, null, now() - interval '2 days', now() - interval '1 hour', 'Hey, how are you?'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-2345678901bc', true, 'Premier League Bets', now() - interval '5 days', now() - interval '30 minutes', 'Who''s betting on the Manchester derby?'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-3456789012cd', true, 'Crypto Trading Group', now() - interval '3 days', now() - interval '15 minutes', 'Bitcoin is pumping!')
ON CONFLICT (id) DO NOTHING;

-- Insert mock chat participants
INSERT INTO chat_participants (chat_id, user_id, joined_at, last_read)
VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-1234567890ab', 'd8c7d961-f43c-4d19-b98e-e6f0ee578c67', now() - interval '2 days', now() - interval '1 hour'),
  ('a1b2c3d4-e5f6-4a7b-8c9d-1234567890ab', 'e9b6c8a7-d5f4-4e3b-9c2a-1d8b7f6e4c5d', now() - interval '2 days', now() - interval '2 hours'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-2345678901bc', 'd8c7d961-f43c-4d19-b98e-e6f0ee578c67', now() - interval '5 days', now() - interval '30 minutes'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-2345678901bc', 'e9b6c8a7-d5f4-4e3b-9c2a-1d8b7f6e4c5d', now() - interval '5 days', now() - interval '1 hour'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-2345678901bc', 'f1a2b3c4-d5e6-4f7g-8h9i-0k1l2m3n4o5p', now() - interval '5 days', now() - interval '2 hours'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-3456789012cd', 'd8c7d961-f43c-4d19-b98e-e6f0ee578c67', now() - interval '3 days', now() - interval '15 minutes'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-3456789012cd', 'f1a2b3c4-d5e6-4f7g-8h9i-0k1l2m3n4o5p', now() - interval '3 days', now() - interval '1 hour')
ON CONFLICT (chat_id, user_id) DO NOTHING;

-- Insert mock messages
INSERT INTO messages (chat_id, sender_id, content, created_at, type)
VALUES
  -- Direct chat messages
  ('a1b2c3d4-e5f6-4a7b-8c9d-1234567890ab', 'd8c7d961-f43c-4d19-b98e-e6f0ee578c67', 'Hey, how are you?', now() - interval '2 hours', 'text'),
  ('a1b2c3d4-e5f6-4a7b-8c9d-1234567890ab', 'e9b6c8a7-d5f4-4e3b-9c2a-1d8b7f6e4c5d', 'I''m good! How about you?', now() - interval '1 hour 45 minutes', 'text'),
  ('a1b2c3d4-e5f6-4a7b-8c9d-1234567890ab', 'd8c7d961-f43c-4d19-b98e-e6f0ee578c67', 'Doing great! Did you see the match last night?', now() - interval '1 hour', 'text'),

  -- Premier League Bets group messages
  ('b2c3d4e5-f6a7-4b8c-9d0e-2345678901bc', 'e9b6c8a7-d5f4-4e3b-9c2a-1d8b7f6e4c5d', 'Who''s betting on the Manchester derby?', now() - interval '1 hour', 'text'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-2345678901bc', 'f1a2b3c4-d5e6-4f7g-8h9i-0k1l2m3n4o5p', 'I''m going with City, they''re in great form', now() - interval '45 minutes', 'text'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-2345678901bc', 'd8c7d961-f43c-4d19-b98e-e6f0ee578c67', 'United might surprise us though', now() - interval '30 minutes', 'text'),

  -- Crypto Trading Group messages
  ('c3d4e5f6-a7b8-4c9d-0e1f-3456789012cd', 'f1a2b3c4-d5e6-4f7g-8h9i-0k1l2m3n4o5p', 'Bitcoin is pumping!', now() - interval '45 minutes', 'text'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-3456789012cd', 'd8c7d961-f43c-4d19-b98e-e6f0ee578c67', 'Time to place some bets on the price movement', now() - interval '30 minutes', 'text'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-3456789012cd', 'f1a2b3c4-d5e6-4f7g-8h9i-0k1l2m3n4o5p', 'I''m betting it hits 50k by end of month', now() - interval '15 minutes', 'text')
ON CONFLICT DO NOTHING;
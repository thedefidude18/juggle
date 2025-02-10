-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test users with fixed UUIDs for predictability
DO $$ 
DECLARE
  john_id uuid := '11111111-1111-1111-1111-111111111111';
  jane_id uuid := '22222222-2222-2222-2222-222222222222';
  bob_id uuid := '33333333-3333-3333-3333-333333333333';
  alice_id uuid := '44444444-4444-4444-4444-444444444444';
  mike_id uuid := '55555555-5555-5555-5555-555555555555';
  pl_group_id uuid;
  af_group_id uuid;
  dm_chat_id uuid;
BEGIN
  -- Create users first and ensure they exist
  INSERT INTO auth.users (id, email)
  VALUES
    (john_id, 'john@example.com'),
    (jane_id, 'jane@example.com'),
    (bob_id, 'bob@example.com'),
    (alice_id, 'alice@example.com'),
    (mike_id, 'mike@example.com')
  ON CONFLICT (id) DO NOTHING;

  -- Create user profiles
  INSERT INTO public.users (id, name, username, avatar_url, created_at, updated_at)
  VALUES
    (john_id, 'John Doe', 'johndoe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', now(), now()),
    (jane_id, 'Jane Smith', 'janesmith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', now(), now()),
    (bob_id, 'Bob Wilson', 'bobwilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', now(), now()),
    (alice_id, 'Alice Brown', 'alicebrown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', now(), now()),
    (mike_id, 'Mike Johnson', 'mikejohnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', now(), now())
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  
  -- Create wallets for users
  INSERT INTO wallets (user_id, balance)
  VALUES
    (john_id, 10000),
    (jane_id, 10000),
    (bob_id, 10000),
    (alice_id, 10000),
    (mike_id, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = EXCLUDED.balance;

  -- Create group chats
  pl_group_id := uuid_generate_v4();
  af_group_id := uuid_generate_v4();
  
  INSERT INTO chats (id, created_at, updated_at, is_group, group_name, group_avatar)
  VALUES
    (pl_group_id, now(), now(), true, 'Premier League Bets',
     'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=800&auto=format&fit=crop'),
    (af_group_id, now(), now(), true, 'Afrobeats Predictions',
     'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop')
  ON CONFLICT (id) DO NOTHING;

  -- Add users to groups
  INSERT INTO chat_participants (chat_id, user_id)
  SELECT pl_group_id, u.id
  FROM users u
  WHERE u.id IN (john_id, jane_id, bob_id, alice_id, mike_id)
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  INSERT INTO chat_participants (chat_id, user_id)
  SELECT af_group_id, u.id
  FROM users u
  WHERE u.id IN (john_id, jane_id, bob_id, alice_id, mike_id)
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  -- Add messages to Premier League group
  INSERT INTO messages (chat_id, sender_id, content, created_at)
  VALUES
    (pl_group_id, john_id, 'Hey everyone! Who''s betting on the Manchester derby?', now() - interval '1 day'),
    (pl_group_id, jane_id, 'City looks strong this season!', now() - interval '23 hours'),
    (pl_group_id, bob_id, 'United might surprise us though', now() - interval '22 hours'),
    (pl_group_id, alice_id, 'The odds are pretty good for both teams', now() - interval '21 hours'),
    (pl_group_id, mike_id, 'Count me in for this one!', now() - interval '20 hours')
  ON CONFLICT DO NOTHING;

  -- Add messages to Afrobeats group
  INSERT INTO messages (chat_id, sender_id, content, created_at)
  VALUES
    (af_group_id, john_id, 'Predictions for the next Afrobeats hit?', now() - interval '12 hours'),
    (af_group_id, jane_id, 'Burna Boy never disappoints!', now() - interval '11 hours'),
    (af_group_id, bob_id, 'Wizkid might drop something soon', now() - interval '10 hours'),
    (af_group_id, alice_id, 'The competition is getting interesting', now() - interval '9 hours'),
    (af_group_id, mike_id, 'This category is heating up!', now() - interval '8 hours')
  ON CONFLICT DO NOTHING;

  -- Create DM chat
  dm_chat_id := uuid_generate_v4();
  
  INSERT INTO chats (id, created_at, updated_at, is_group)
  VALUES (dm_chat_id, now(), now(), false)
  ON CONFLICT DO NOTHING;

  -- Add participants to DM
  INSERT INTO chat_participants (chat_id, user_id)
  SELECT dm_chat_id, u.id
  FROM users u
  WHERE u.id IN (john_id, jane_id)
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  -- Add DM messages
  INSERT INTO messages (chat_id, sender_id, content, created_at)
  VALUES
    (dm_chat_id, john_id, 'Hey Jane, got any good tips for today?', now() - interval '1 hour'),
    (dm_chat_id, jane_id, 'Hi John! Actually yes, check out the Premier League group', now() - interval '30 minutes'),
    (dm_chat_id, john_id, 'Thanks! Will do 👍', now() - interval '15 minutes')
  ON CONFLICT DO NOTHING;

END $$;
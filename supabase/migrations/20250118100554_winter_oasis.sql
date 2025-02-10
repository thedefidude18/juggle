-- Insert mock notifications
DO $$ 
DECLARE
  john_id uuid := '11111111-1111-1111-1111-111111111111';
  jane_id uuid := '22222222-2222-2222-2222-222222222222';
  bob_id uuid := '33333333-3333-3333-3333-333333333333';
  alice_id uuid := '44444444-4444-4444-4444-444444444444';
  mike_id uuid := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- Event win notifications
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata,
    created_at
  ) VALUES
    (john_id, 'event_win', 'You won! 🎉', 'Congratulations! You won ₦10,000 in Premier League Predictions',
     jsonb_build_object('amount', 10000, 'event_type', 'sports'), now() - interval '1 hour'),
    (jane_id, 'event_win', 'Challenge Victory! 🏆', 'You won the FIFA 24 challenge against Mike',
     jsonb_build_object('amount', 5000, 'event_type', 'gaming'), now() - interval '2 hours');

  -- Event updates
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata,
    created_at
  ) VALUES
    (bob_id, 'event_update', 'Event Starting Soon ⚡', 'Your NBA 2K24 tournament starts in 30 minutes',
     jsonb_build_object('event_type', 'gaming', 'start_time', now() + interval '30 minutes'), now() - interval '3 hours'),
    (alice_id, 'event_update', 'New Event Added 🎮', 'A new Call of Duty tournament has been added',
     jsonb_build_object('event_type', 'gaming'), now() - interval '4 hours');

  -- Earnings notifications
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata,
    created_at
  ) VALUES
    (mike_id, 'earnings', 'Earnings Update 💰', 'You earned ₦15,000 from recent events',
     jsonb_build_object('amount', 15000), now() - interval '5 hours'),
    (john_id, 'earnings', 'Bonus Received! 🎁', 'You received a ₦500 referral bonus',
     jsonb_build_object('amount', 500, 'type', 'referral'), now() - interval '6 hours');

  -- Follow notifications
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata,
    created_at
  ) VALUES
    (jane_id, 'follow', 'New Follower 👥', 'John started following you',
     jsonb_build_object('follower_id', john_id), now() - interval '7 hours'),
    (bob_id, 'follow', 'New Follower 👥', 'Alice started following you',
     jsonb_build_object('follower_id', alice_id), now() - interval '8 hours');

  -- Group messages
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata,
    created_at
  ) VALUES
    (alice_id, 'group_message', 'New Group Message 💬', 'New message in Premier League Bets',
     jsonb_build_object('group_type', 'sports'), now() - interval '9 hours'),
    (mike_id, 'group_message', 'New Group Message 💬', 'New message in Afrobeats Predictions',
     jsonb_build_object('group_type', 'music'), now() - interval '10 hours');

  -- Leaderboard updates
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata,
    created_at
  ) VALUES
    (john_id, 'leaderboard_update', 'Rank Update 📈', 'You moved up to rank #3 on the leaderboard',
     jsonb_build_object('old_rank', 5, 'new_rank', 3), now() - interval '11 hours'),
    (jane_id, 'leaderboard_update', 'New Achievement 🏅', 'You reached the Top 10 in Gaming category',
     jsonb_build_object('category', 'gaming', 'rank', 7), now() - interval '12 hours');

  -- Challenge notifications
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata,
    created_at
  ) VALUES
    (bob_id, 'challenge', 'New Challenge! ⚔️', 'Mike challenged you to FIFA 24',
     jsonb_build_object('amount', 5000, 'challenger_id', mike_id), now() - interval '13 hours'),
    (alice_id, 'challenge_response', 'Challenge Accepted! 🤝', 'John accepted your FIFA 24 challenge',
     jsonb_build_object('amount', 7500, 'challenger_id', john_id), now() - interval '14 hours');

  -- System notifications
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata,
    created_at
  ) VALUES
    (mike_id, 'system', 'Security Alert 🔒', 'New login detected from Lagos, Nigeria',
     jsonb_build_object('location', 'Lagos, Nigeria', 'device', 'Mobile'), now() - interval '15 hours'),
    (john_id, 'system', 'Account Update ⚙️', 'Your email verification is pending',
     jsonb_build_object('action_required', true), now() - interval '16 hours');

END $$;
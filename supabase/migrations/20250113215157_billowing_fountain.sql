/*
  # Fix relationships for leaderboard functionality

  1. Changes
    - Add foreign key relationships between users and event_participants
    - Add foreign key relationships between users and chat_participants
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add foreign key relationships
ALTER TABLE event_participants
  DROP CONSTRAINT IF EXISTS event_participants_user_id_fkey,
  ADD CONSTRAINT event_participants_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE chat_participants
  DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey,
  ADD CONSTRAINT chat_participants_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
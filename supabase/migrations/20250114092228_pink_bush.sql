/*
  # Enhance chat system

  1. New Features
    - Add chat message reactions
    - Add message status tracking (sent, delivered, read)
    - Add typing indicators
    - Add chat message attachments support

  2. Changes
    - Add reactions table
    - Add typing_status table
    - Update messages table with new fields
    - Add appropriate indexes and policies
*/

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create typing_status table
CREATE TABLE IF NOT EXISTS typing_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_typing boolean DEFAULT false,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Add new columns to messages table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Policies for message_reactions
CREATE POLICY "view_message_reactions"
  ON message_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      JOIN messages m ON m.chat_id = cp.chat_id
      WHERE m.id = message_reactions.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "add_message_reactions"
  ON message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      JOIN messages m ON m.chat_id = cp.chat_id
      WHERE m.id = message_reactions.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "delete_own_reactions"
  ON message_reactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for typing_status
CREATE POLICY "view_typing_status"
  ON typing_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = typing_status.chat_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "insert_typing_status"
  ON typing_status
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_typing_status"
  ON typing_status
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_chat_id ON typing_status(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Function to clean up old typing status
CREATE OR REPLACE FUNCTION cleanup_typing_status() RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM typing_status
  WHERE last_updated < now() - INTERVAL '30 seconds';
END;
$$;
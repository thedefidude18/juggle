-- Add foreign key constraint for sender_id in messages table
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS fk_messages_sender;

ALTER TABLE messages
  ADD CONSTRAINT fk_messages_sender
  FOREIGN KEY (sender_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
  ON messages(sender_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON messages;

-- Create more permissive policies
CREATE POLICY "messages_select_policy"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = messages.chat_id
      AND user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "messages_insert_policy"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = messages.chat_id
      AND user_id = auth.uid()::uuid
    )
  );

-- Ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON messages TO authenticated;
GRANT SELECT ON messages TO anon;
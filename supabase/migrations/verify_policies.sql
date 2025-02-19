-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'messages';

-- If needed, recreate the essential policies
CREATE POLICY IF NOT EXISTS "messages_select_policy"
  ON messages FOR SELECT TO authenticated
  USING (
    (chat_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = messages.chat_id
      AND user_id = auth.uid()
    ))
    OR
    (event_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_id = messages.event_id
      AND user_id = auth.uid()
    ))
  );

CREATE POLICY IF NOT EXISTS "messages_insert_policy"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    (chat_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = messages.chat_id
      AND user_id = auth.uid()
    ))
    OR
    (event_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_id = messages.event_id
      AND user_id = auth.uid()
    ))
  );
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Users can view event messages" ON messages;
DROP POLICY IF EXISTS "Users can insert event messages" ON messages;

-- Event viewing policy
CREATE POLICY "Users can view events"
ON events
FOR SELECT
TO authenticated
USING (
  status = 'active' AND (
    type = 'public' OR
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_id = events.id
      AND user_id = auth.uid()
    )
  )
);

-- Message viewing policy
CREATE POLICY "Users can view event messages"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE id = messages.event_id
    AND (
      type = 'public' OR
      creator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM event_participants
        WHERE event_id = events.id
        AND user_id = auth.uid()
      )
    )
  )
);

-- Message insertion policy
CREATE POLICY "Users can insert event messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE id = messages.event_id
    AND (
      type = 'public' OR
      creator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM event_participants
        WHERE event_id = events.id
        AND user_id = auth.uid()
      )
    )
  )
);

-- Ensure event_participants policies are set correctly
DROP POLICY IF EXISTS "Users can view event participants" ON event_participants;
DROP POLICY IF EXISTS "Users can join public events" ON event_participants;

CREATE POLICY "Users can view event participants"
ON event_participants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join public events"
ON event_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE id = event_participants.event_id
    AND (
      type = 'public' OR
      creator_id = auth.uid()
    )
  )
);
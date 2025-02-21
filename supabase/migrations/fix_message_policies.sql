-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert event messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view event messages" ON public.messages;

-- Create new policies that check event type
CREATE POLICY "Users can view event messages" ON public.messages
FOR SELECT TO authenticated
USING (
    -- Allow if user is a participant
    EXISTS (
        SELECT 1 FROM event_participants ep
        WHERE ep.event_id = messages.event_id
        AND ep.user_id = auth.uid()
    )
    OR
    -- Allow if it's a public event
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = messages.event_id
        AND e.type = 'public'
    )
);

-- Create new insert policy
CREATE POLICY "Users can insert event messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
    -- Allow if user is a participant
    EXISTS (
        SELECT 1 FROM event_participants ep
        WHERE ep.event_id = messages.event_id
        AND ep.user_id = auth.uid()
    )
    OR
    -- Allow if it's a public event
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = messages.event_id
        AND e.type = 'public'
    )
);

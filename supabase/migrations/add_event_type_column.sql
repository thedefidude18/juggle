-- Add type column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'private';

-- Update existing events to be private by default
UPDATE public.events SET type = 'private' WHERE type IS NULL;

-- Add constraint to ensure type is one of the allowed values
ALTER TABLE public.events
ADD CONSTRAINT events_type_check
CHECK (type IN ('public', 'private', 'challenge'));

-- Create index for type column since we'll be querying it frequently
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

-- Update RLS policies to consider the new type column
DROP POLICY IF EXISTS "Users can view event messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert event messages" ON public.messages;

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
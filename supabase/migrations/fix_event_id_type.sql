-- First, remove any existing foreign key constraint
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS fk_event_id;

-- Change event_id column type to UUID
ALTER TABLE public.messages
ALTER COLUMN event_id TYPE UUID USING event_id::UUID;

-- Add the correct foreign key constraint
ALTER TABLE public.messages
ADD CONSTRAINT fk_messages_event_id
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE;

-- Create or update index
DROP INDEX IF EXISTS idx_messages_event_id;
CREATE INDEX idx_messages_event_id ON public.messages(event_id);

-- Update RLS policies
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;

CREATE POLICY "messages_select_policy"
ON public.messages FOR SELECT
TO authenticated
USING (
    (chat_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM chat_participants
        WHERE chat_participants.chat_id = messages.chat_id
        AND chat_participants.user_id = auth.uid()
    ))
    OR
    (event_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM event_participants
        WHERE event_participants.event_id = messages.event_id
        AND event_participants.user_id = auth.uid()
    ))
);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
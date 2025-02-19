-- Add event_id column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS event_id BIGINT,
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'chat_message';

-- Add foreign key constraint
ALTER TABLE public.messages
ADD CONSTRAINT fk_event_id
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE;

-- Update RLS policies to allow event messages
CREATE POLICY "Users can insert event messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
    (chat_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.chats c
        WHERE c.id = messages.chat_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    ))
    OR
    (event_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.event_participants ep
        WHERE ep.event_id = messages.event_id
        AND ep.user_id = auth.uid()
    ))
);

-- Add index for event_id
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON public.messages(event_id);
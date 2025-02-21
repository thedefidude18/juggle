-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON public.messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- RLS Policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by event participants" ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM event_participants
            WHERE event_participants.event_id = messages.event_id
            AND event_participants.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = messages.event_id
            AND events.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own messages" ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND
        (
            EXISTS (
                SELECT 1 FROM event_participants
                WHERE event_participants.event_id = messages.event_id
                AND event_participants.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM events
                WHERE events.id = messages.event_id
                AND events.creator_id = auth.uid()
            )
        )
    );

-- Update trigger for real-time
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_message',
    json_build_object(
      'event_id', NEW.event_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();
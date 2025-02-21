-- Create messages table with proper foreign keys
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON public.messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read messages from their events" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;

-- Policy to allow users to read messages from events they participate in or created
CREATE POLICY "Users can read messages from their events" ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.event_participants ep
            WHERE ep.event_id = messages.event_id
            AND ep.user_id = auth.uid()
            AND ep.status = 'accepted'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = messages.event_id
            AND (e.creator_id = auth.uid() OR e.is_private = false)
        )
    );

-- Policy to allow users to insert their own messages
CREATE POLICY "Users can insert their own messages" ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND
        (
            EXISTS (
                SELECT 1 FROM public.event_participants ep
                WHERE ep.event_id = event_id
                AND ep.user_id = auth.uid()
                AND ep.status = 'accepted'
            )
            OR
            EXISTS (
                SELECT 1 FROM public.events e
                WHERE e.id = event_id
                AND e.creator_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.events e
                WHERE e.id = event_id
                AND e.is_private = false
            )
        )
    );

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.messages_with_sender;

-- Create an enhanced view to join messages with user information
CREATE OR REPLACE VIEW public.messages_with_sender AS
SELECT 
    m.id,
    m.event_id,
    m.sender_id,
    m.content,
    m.type,
    m.created_at,
    m.updated_at,
    u.username as sender_username,
    u.avatar_url as sender_avatar_url,
    u.name as sender_name,
    COALESCE(u.username, 'Deleted User') as display_name
FROM public.messages m
LEFT JOIN public.users u ON m.sender_id = u.id
ORDER BY m.created_at ASC;

-- Grant access to the view and table
GRANT SELECT ON public.messages_with_sender TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;

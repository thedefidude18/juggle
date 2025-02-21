-- Create private_chats table to store chat sessions between users
CREATE TABLE IF NOT EXISTS public.private_chats (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create private_chat_participants to store users in each chat
CREATE TABLE IF NOT EXISTS public.private_chat_participants (
    chat_id UUID REFERENCES public.private_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (chat_id, user_id)
);

-- Modify messages table to work with both event and private chats
ALTER TABLE public.messages 
    ADD COLUMN chat_id UUID REFERENCES public.private_chats(id) ON DELETE CASCADE,
    ALTER COLUMN event_id DROP NOT NULL;

-- Add constraint to ensure message belongs to either event or private chat
ALTER TABLE public.messages 
    ADD CONSTRAINT message_context_check 
    CHECK (
        (event_id IS NOT NULL AND chat_id IS NULL) OR 
        (chat_id IS NOT NULL AND event_id IS NULL)
    );

-- Add index for chat_id
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);

-- Update messages_with_sender view to include private chats
DROP VIEW IF EXISTS public.messages_with_sender;
CREATE OR REPLACE VIEW public.messages_with_sender AS
SELECT 
    m.id,
    m.event_id,
    m.chat_id,
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

-- Add RLS policies for private chats
ALTER TABLE public.private_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_chat_participants ENABLE ROW LEVEL SECURITY;

-- Policies for private_chats
CREATE POLICY "Users can view their private chats" ON public.private_chats
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.private_chat_participants pcp
            WHERE pcp.chat_id = id
            AND pcp.user_id = auth.uid()
        )
    );

-- Policies for private_chat_participants
CREATE POLICY "Users can view their chat participants" ON public.private_chat_participants
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.private_chat_participants pcp
            WHERE pcp.chat_id = chat_id
            AND pcp.user_id = auth.uid()
        )
    );

-- Update message policies to include private chats
DROP POLICY IF EXISTS "Users can read messages from their events" ON public.messages;
CREATE POLICY "Users can read their messages" ON public.messages
    FOR SELECT
    USING (
        (
            -- For event messages
            event_id IS NOT NULL AND
            (
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
            )
        )
        OR
        (
            -- For private chat messages
            chat_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.private_chat_participants pcp
                WHERE pcp.chat_id = messages.chat_id
                AND pcp.user_id = auth.uid()
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.private_chats TO authenticated;
GRANT SELECT, INSERT ON public.private_chat_participants TO authenticated;
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view chats they're participating in" ON public.private_chats;
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;

-- Create private_chats table
CREATE TABLE IF NOT EXISTS public.private_chats (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES public.private_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES public.private_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON public.chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.private_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for private_chats
CREATE POLICY "Users can view chats they're participating in" ON public.private_chats
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_id = private_chats.id
            AND user_id = auth.uid()
        )
    );

-- Policies for chat_participants
CREATE POLICY "Users can view chat participants" ON public.chat_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_id = chat_participants.chat_id
            AND user_id = auth.uid()
        )
    );

-- Policies for chat_messages
CREATE POLICY "Users can view messages in their chats" ON public.chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_id = chat_messages.chat_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own messages" ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_id = chat_messages.chat_id
            AND user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.private_chats TO authenticated;
GRANT ALL ON public.chat_participants TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;

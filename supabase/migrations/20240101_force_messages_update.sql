-- Drop and recreate the messages table with all required columns
CREATE TABLE IF NOT EXISTS public.messages_new (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES public.events(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'chat_message',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy existing data if needed
INSERT INTO public.messages_new (id, chat_id, sender_id, content, created_at, updated_at)
SELECT id, chat_id, sender_id, content, created_at, created_at
FROM public.messages;

-- Drop old table and rename new one
DROP TABLE IF EXISTS public.messages CASCADE;
ALTER TABLE public.messages_new RENAME TO messages;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON public.messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';